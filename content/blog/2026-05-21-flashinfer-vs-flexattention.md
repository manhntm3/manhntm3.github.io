---
title: "FlashInfer vs FlexAttention: two answers to the same JIT question"
date: "2026-05-21"
description: "Both projects JIT-compile attention kernels. They disagree about almost everything else."
tags: ["gpu", "attention", "triton", "jit"]
---

I spent the last week reading FlashInfer and FlexAttention with the goal of understanding why both projects exist. Both JIT-compile attention kernels. Both target the same hardware. Both are, in some sense, "solve attention performance once and for all." And yet anyone working in this space treats them as solving genuinely different problems.

After a few thousand lines of source and three papers, I think I get it. The short version is that FlashInfer is a library that JIT-specializes a closed set of attention templates, while FlexAttention is a compiler that JITs *whatever you write*. The longer version is more interesting, because it gets at a real tension in how you build infrastructure for a field this fast-moving.

## The thing both are JIT'ing

Before talking about the differences, it's worth being precise about what's being compiled.

The attention forward pass in FlashAttention-2 is a tiled loop: iterate over blocks of Q, and for each Q block sweep across the KV blocks, accumulating an online softmax. The kernel is, in some sense, just bookkeeping around three matmuls. What changes across variants — causal masking, ALiBi biases, sliding windows, document masks, soft-capping, paged KV caches, MLA — is what happens *inside* that loop: where you skip work, what you add to the score, how you index KV.

Compiling for one of these variants by hand is mostly a copy-paste-and-tweak job. Compiling for *all* of them is where things get interesting, because the design choices add up. FlashInfer and FlexAttention diverge precisely on which subset of "variants" they care about and what they're willing to specialize for.

## FlashInfer: a planner that emits one kernel per call site

If you look at `flashinfer/jit/`, the model is straightforward. You declare what you want — `BatchPrefillWithPagedKVCacheWrapper` with a particular head dim, dtype, mask type, page size, and so on — and `plan()` decides on a kernel. The first time you hit a new configuration, it generates source from a Jinja-style template, invokes nvcc, caches the `.so` on disk, and dlopens it. Subsequent calls are free.

The interesting part of that flow isn't the codegen. The codegen is mostly a careful enumeration of template parameters. The interesting part is the load-balanced scheduler that runs *before* the kernel launch. Serving workloads are jagged: at any given step you might be prefilling one 8k-token request while decoding 60 single-token requests. If you naïvely launch a CTA per request, you get terrible utilization. FlashInfer instead chops the work into uniform tiles and packs them onto blocks, and the planner emits scheduling metadata — `qo_indptr`, `kv_indptr`, page table offsets — that the kernel reads at launch time.

So FlashInfer's JIT isn't really about runtime code generation in the `torch.compile` sense. It's much closer to template specialization in C++: you pick a point in a discrete configuration space, and the system materializes the kernel for that point. The bet is that the configuration space is small enough to enumerate and large enough to cover what serving workloads actually do. The Flash papers and a few follow-ups argue that bet has held up surprisingly well.

The trade-off is honest: if your attention variant isn't already a template, FlashInfer can't help you. That's fine — for what it's targeting, the variant set *is* the supported set.

## FlexAttention: the user is the codegen

FlexAttention starts from the opposite assumption. Researchers add new attention variants constantly. Most of those variants are tiny — a per-token bias, an ALiBi slope, a soft cap — and writing a CUDA kernel for each one is absurd. PyTorch's answer is to make the variant *part of the API*. You hand it a Python function:

```python
def alibi(score, b, h, q_idx, kv_idx):
    return score - (q_idx - kv_idx) * alibi_slope[h]

out = flex_attention(q, k, v, score_mod=alibi)
```

Under the hood, Dynamo traces `alibi` into FX, Inductor lowers the FX graph through Triton-IR and Triton-GPUIR into PTX, and the result is fused into the inner loop of a FlashAttention-style kernel. There's no template per variant. There's one parametric kernel, and the parameter happens to be code.

This is genuinely clever. It compresses what used to be a CUDA project into three lines of Python. The cost shows up in two places.

First, the abstraction is fundamentally a *scoring* abstraction — your function gets the pre-softmax score and returns a modified score. It cannot change *which* KV blocks the kernel visits. Anything sparse-by-construction (block-sparse, sliding-window-with-jumps, document masks where most documents are short) leaks performance unless you also supply a `BlockMask`. The BlockMask machinery exists precisely to plug this hole, and it works, but it's a second abstraction layered on top of the first because the first didn't have enough surface area. That's usually a sign the original abstraction was wrong by one axis.

Second, the kernel that Inductor generates is good, not great. The Flashlight paper makes this concrete: for a handful of practically-important variants, hand-written kernels still beat FlexAttention by meaningful margins, and the gap isn't closing as fast as you'd hope. The reasons are the usual Inductor reasons — block sizes aren't always optimal, register allocation around the user code is conservative, you can't easily express tricks like persistent kernels or splitting K across SMs. None of this is a fatal flaw. It is, however, the reason FlashInfer isn't going away.

## Why these are actually different problems

Reading these side by side, the real distinction isn't "JIT vs. no JIT." It's *what counts as the variable axis*.

FlashInfer treats the **shape** of the workload as the variable axis. The math is fixed; the lengths, the page tables, the masks-from-a-known-set, the per-request bookkeeping — those vary. So the JIT specializes on shape, the scheduler load-balances on shape, and the kernel template is hand-tuned because the math doesn't move.

FlexAttention treats the **math** as the variable axis. The shape story is more boring — relatively uniform sequences during training — but the per-step modification of the score is whatever you want it to be. So the JIT specializes on math, and the lowering pipeline (Dynamo → Inductor → Triton) is the heavy machinery because the math *does* move.

These goals don't conflict; they just don't compose well. You'd love a system that JIT-specializes on both. The honest answer is: nobody has shipped that yet, and the reason is that "specialize on user math while load-balancing per-request irregular shapes" implies a much more invasive compiler stack than either project signed up for. FlexAttention's `score_mod` can't see the scheduler. FlashInfer's scheduler can't see your `score_mod`.

## A small architectural observation

Once you frame the two systems this way, you can read the source code with much more sympathy.

`flashinfer/jit/` is mostly templates and a planner because the math is fixed and the *runtime* problem is hard. Of course it looks the way it does. Of course the most interesting file is `scheduler.py`, not the .cu files.

PyTorch's `flex_attention` module is mostly Dynamo and Inductor glue because the runtime problem is easy and the *codegen* problem is the whole thing. Of course the abstraction is a function. Of course `BlockMask` got bolted on later — the system was built around math-first, and access patterns are an afterthought from that vantage point.

I find this kind of "what does the source code's center of gravity tell you about the design priorities" reading more useful than reading the papers in isolation. Papers describe the wins. The source code reveals the trade-offs.

## What I think is coming

A few hints, none of them confident.

cuTile, NVIDIA's tile-level Python DSL, is going to land somewhere in the middle. It's not a library — it's an authoring layer where you express the tiled algorithm directly, and the compiler does the dirty work. If you squint, that's what FlexAttention is doing, just with `flex_attention` as the surface. The difference is that cuTile gives you the tile-level loops, so the user can express block-sparse iteration and scheduling, not only per-element score modification. That removes the "score_mod is the wrong shape" complaint.

Triton's MLIR-based pipeline is the other half. It already lowers FlexAttention. If it keeps evolving toward more aggressive autotuning and persistent-kernel codegen — and the recent releases suggest it is — the perf gap that Flashlight measured will narrow. Maybe not to zero, but enough that the choice between FlexAttention and a hand-tuned kernel becomes a judgment call rather than a clear loss.

And then there's the thing nobody can really paper over: the LLM-serving runtime is going to need both. Variable-length batches at inference time *and* arbitrary attention math from research are both real. My guess is that the convergence point looks more like FlashInfer's planner adopting a FlexAttention-style modification hook than the other way around — because the planner is the harder thing to bolt on after the fact. Code generation is portable; scheduling intelligence is not.

I'll stop short of pretending I know which library wins. I do think the framing they've forced — JIT on shape vs. JIT on math — is the right one to keep in your head while reading either codebase. It explains why FlashInfer's `jit/` directory is mostly templates and a planner, and FlexAttention's is mostly Dynamo and Inductor glue. Two reasonable people, given different problems, wrote two completely different compilers.

That's the lesson I'm walking away with, and the one I'd give anyone trying to navigate this corner of the stack: figure out what *your* variable axis is before you pick the tool, because the tool already picked an answer.
