# WebGPU Black Hole Raymarching App — Architecture Notes

## 1. Overview

This app renders a black hole scene using WebGPU.

The rendering flow is split into two stages:

1. **Compute pass**
   - Runs the raymarching / raytracing logic.
   - Writes the generated black hole image into an offscreen texture.

2. **Render pass**
   - Draws a fullscreen triangle/quad.
   - Samples the offscreen texture produced by the compute shader.
   - Displays the final image on the canvas.

The app uses a 3D orbit camera controlled by 2D mouse input.

---

## 2. Main WebGPU Resources

### 2.1 GPU device

```ts
GPUDevice
```

The `GPUDevice` is the main object used to create GPU resources such as buffers, textures, samplers, bind groups, and pipelines.

Created from:

```ts
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();
```

---

### 2.2 Canvas context

```ts
GPUCanvasContext
```

The canvas context connects the WebGPU output to the HTML canvas.

Created from:

```ts
const context = canvas.getContext("webgpu") as GPUCanvasContext | null;
```

Configured with:

```ts
context.configure({
  device,
  format: canvasFormat,
  alphaMode: "premultiplied",
});
```

The render pass writes to:

```ts
context.getCurrentTexture().createView()
```

---

### 2.3 Uniform buffer

```ts
GPUBuffer
```

The uniform buffer stores small pieces of data that the compute shader needs every frame.

This app uses it for:

- Camera position
- Time
- First pixel ray position
- Ray direction delta per pixel horizontally
- Ray direction delta per pixel vertically
- Canvas width
- Canvas height
- Whether the stars texture exists
- Disk density modifier

Created with:

```ts
this.uniformBuffer = this.device.createBuffer({
  size: 96,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
```

Resource type:

```ts
buffer: { type: "uniform" }
```

Binding:

```ts
binding: 0
```

Shader visibility:

```ts
GPUShaderStage.COMPUTE
```

This means the buffer is only visible to the compute shader.

---

### 2.4 Output texture

```ts
GPUTexture
```

The output texture is an offscreen texture. The compute shader writes the raymarched black hole image into this texture.

Created with:

```ts
this.outputTexture = this.device.createTexture({
  size: [this.canvas.width, this.canvas.height],
  format: "rgba8unorm",
  usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
});
```

It has two usages:

```ts
GPUTextureUsage.STORAGE_BINDING
```

Allows the compute shader to write pixels into it.

```ts
GPUTextureUsage.TEXTURE_BINDING
```

Allows the render shader to sample from it later.

Compute binding:

```ts
binding: 1
storageTexture: {
  format: "rgba8unorm",
  access: "write-only",
}
```

Render binding:

```ts
binding: 0
texture: { sampleType: "float" }
```

---

### 2.5 Stars texture

```ts
GPUTexture
```

The stars texture is loaded from:

```txt
stars.png
```

The compute shader samples it as a background/environment texture.

Created with:

```ts
this.starsTexture = this.device.createTexture({
  size: [imageBitmap.width, imageBitmap.height, 1],
  format: "rgba8unorm",
  usage:
    GPUTextureUsage.TEXTURE_BINDING |
    GPUTextureUsage.COPY_DST |
    GPUTextureUsage.RENDER_ATTACHMENT,
});
```

If `stars.png` cannot be loaded, the app creates a fallback 1x1 black texture.

Compute binding:

```ts
binding: 2
texture: { sampleType: "float" }
```

Shader visibility:

```ts
GPUShaderStage.COMPUTE
```

---

### 2.6 Sampler

```ts
GPUSampler
```

The sampler controls how textures are read.

Created with:

```ts
this.sampler = this.device.createSampler({
  magFilter: "linear",
  minFilter: "linear",
  addressModeU: "repeat",
  addressModeV: "clamp-to-edge",
});
```

Used by:

- The compute shader to sample the stars texture
- The render shader to sample the output texture

Compute binding:

```ts
binding: 3
sampler: { type: "filtering" }
```

Render binding:

```ts
binding: 1
sampler: { type: "filtering" }
```

---

## 3. Bind Group Layouts

Bind group layouts describe what resources a shader expects.

---

### 3.1 Compute bind group layout

The compute shader uses four bindings:

| Binding | Resource | Type | Usage |
|---:|---|---|---|
| 0 | Uniform buffer | `uniform buffer` | Camera, time, image size, ray data |
| 1 | Output texture | `storage texture` | Compute shader writes final pixels |
| 2 | Stars texture | `sampled texture` | Background/environment texture |
| 3 | Sampler | `filtering sampler` | Sampling stars texture |

Code:

```ts
this.computeBindGroupLayout = this.device.createBindGroupLayout({
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type: "uniform" },
    },
    {
      binding: 1,
      visibility: GPUShaderStage.COMPUTE,
      storageTexture: {
        format: "rgba8unorm",
        access: "write-only",
      },
    },
    {
      binding: 2,
      visibility: GPUShaderStage.COMPUTE,
      texture: { sampleType: "float" },
    },
    {
      binding: 3,
      visibility: GPUShaderStage.COMPUTE,
      sampler: { type: "filtering" },
    },
  ],
});
```

---

### 3.2 Display/render bind group layout

The render shader uses two bindings:

| Binding | Resource | Type | Usage |
|---:|---|---|---|
| 0 | Output texture | `sampled texture` | Read the compute result |
| 1 | Sampler | `filtering sampler` | Sample the output texture |

Code:

```ts
this.displayBindGroupLayout = this.device.createBindGroupLayout({
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.FRAGMENT,
      texture: { sampleType: "float" },
    },
    {
      binding: 1,
      visibility: GPUShaderStage.FRAGMENT,
      sampler: { type: "filtering" },
    },
  ],
});
```

---

## 4. Uniform Memory Layout

The uniform buffer is 96 bytes.

It is packed manually using:

```ts
const uniformData = new ArrayBuffer(96);
const floatView = new Float32Array(uniformData);
const uintView = new Uint32Array(uniformData);
```

Each slot is 4 bytes.

The layout is:

| Float/Uint index | Data | Type |
|---:|---|---|
| 0 | camera position X | `f32` |
| 1 | camera position Y | `f32` |
| 2 | camera position Z | `f32` |
| 3 | time | `f32` |
| 4 | pixel00 position X | `f32` |
| 5 | pixel00 position Y | `f32` |
| 6 | pixel00 position Z | `f32` |
| 7 | has stars texture | `u32` |
| 8 | delta W X | `f32` |
| 9 | delta W Y | `f32` |
| 10 | delta W Z | `f32` |
| 11 | image width | `u32` |
| 12 | delta H X | `f32` |
| 13 | delta H Y | `f32` |
| 14 | delta H Z | `f32` |
| 15 | image height | `u32` |
| 16 | disk density modifier | `f32` |
| 17 | padding | `f32` |
| 18 | padding | `f32` |
| 19 | padding | `f32` |

Total:

```txt
20 values × 4 bytes = 80 bytes
```

The buffer is allocated as 96 bytes to leave safe padding/alignment space.

---

## 5. Camera Uniforms

The app does not send a full camera matrix to the shader.

Instead, it sends enough data for the compute shader to reconstruct one ray per pixel.

Important camera-related uniforms:

### 5.1 Camera position

```ts
cameraPosition: vec3f
```

This is the 3D position of the camera in world space.

It comes from the orbit camera:

```ts
const cameraFrame = getCameraFrame(this.camera);
const cameraPosition = cameraFrame.position;
```

---

### 5.2 Pixel 00 position

```ts
pixel00: vec3f
```

This is the world-space position of the first pixel on the virtual viewport.

The shader can use this as the starting point for calculating rays.

---

### 5.3 Delta W

```ts
deltaW: vec3f
```

This is the world-space step from one pixel to the next pixel horizontally.

For pixel coordinate `x`, the shader can move along the viewport by:

```wgsl
rayPixelPosition += delta_w * f32(x)
```

---

### 5.4 Delta H

```ts
deltaH: vec3f
```

This is the world-space step from one pixel to the next pixel vertically.

For pixel coordinate `y`, the shader can move along the viewport by:

```wgsl
rayPixelPosition += delta_h * f32(y)
```

---

### 5.5 Image width and height

```ts
imageWidth: u32
imageHeight: u32
```

The compute shader uses these to avoid writing outside the image bounds.

---

### 5.6 Time

```ts
time: f32
```

Used for animation, such as orbiting disk movement, animated noise, or changing visual effects over time.

---

## 6. Pipelines and Shaders

The app uses two pipelines:

1. Compute pipeline
2. Render pipeline

---

## 7. Compute Pipeline

The compute pipeline runs the black hole raymarching shader.

Shader file:

```txt
src/compute.wgsl
```

Created with:

```ts
const computeModule = this.device.createShaderModule({
  code: computeShaderCode,
});

this.computePipeline = this.device.createComputePipeline({
  layout: this.device.createPipelineLayout({
    bindGroupLayouts: [this.computeBindGroupLayout],
  }),
  compute: {
    module: computeModule,
    entryPoint: "main",
  },
});
```

The compute shader:

- Reads camera/ray data from the uniform buffer
- Computes a ray for every pixel
- Raymarches through the black hole scene
- Samples stars/background texture when needed
- Writes the final color into the output storage texture

Dispatch:

```ts
computePass.dispatchWorkgroups(
  Math.ceil(this.canvas.width / 8),
  Math.ceil(this.canvas.height / 8)
);
```

This means the shader likely uses an 8x8 workgroup size in WGSL, for example:

```wgsl
@compute @workgroup_size(8, 8)
fn main(...) { ... }
```

Each work item corresponds to one pixel or one output texel.

---

## 8. Render Pipeline

The render pipeline displays the texture generated by the compute pipeline.

Shader file:

```txt
src/render.wgsl
```

Created with:

```ts
const displayModule = this.device.createShaderModule({
  code: displayShaderCode,
});

this.displayPipeline = this.device.createRenderPipeline({
  layout: this.device.createPipelineLayout({
    bindGroupLayouts: [this.displayBindGroupLayout],
  }),
  vertex: {
    module: displayModule,
    entryPoint: "vs_main",
  },
  fragment: {
    module: displayModule,
    entryPoint: "fs_main",
    targets: [{ format: this.canvasFormat }],
  },
  primitive: {
    topology: "triangle-list",
  },
});
```

The render shader has two stages:

### Vertex shader

Entry point:

```txt
vs_main
```

Usually creates a fullscreen triangle or fullscreen quad.

### Fragment shader

Entry point:

```txt
fs_main
```

Samples the output texture and returns the final color to the canvas.

Draw call:

```ts
renderPass.draw(6);
```

This draws 6 vertices, commonly used for two triangles forming a fullscreen quad.

---

## 9. Frame Execution Flow

Every frame:

### Step 1 — Update uniforms

The CPU calculates the camera ray data and writes it into the uniform buffer:

```ts
this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
```

---

### Step 2 — Start command encoder

```ts
const commandEncoder = this.device.createCommandEncoder();
```

---

### Step 3 — Compute pass

```ts
const computePass = commandEncoder.beginComputePass();
computePass.setPipeline(this.computePipeline);
computePass.setBindGroup(0, this.computeBindGroup);
computePass.dispatchWorkgroups(...);
computePass.end();
```

This fills the offscreen output texture.

---

### Step 4 — Render pass

```ts
const renderPass = commandEncoder.beginRenderPass(...);
renderPass.setPipeline(this.displayPipeline);
renderPass.setBindGroup(0, this.displayBindGroup);
renderPass.draw(6);
renderPass.end();
```

This displays the offscreen texture on the canvas.

---

### Step 5 — Submit commands

```ts
this.device.queue.submit([commandEncoder.finish()]);
```

The GPU executes the compute pass first, then the render pass.

---

## 10. High-Level Pipeline Diagram

```txt
CPU / TypeScript
   |
   | update camera + time
   | write uniform buffer
   v
Uniform Buffer
   |
   v
Compute Pipeline: compute.wgsl
   |
   | raymarch black hole scene
   | sample stars texture
   | write pixels
   v
Output Storage Texture
   |
   v
Render Pipeline: render.wgsl
   |
   | fullscreen draw
   | sample output texture
   v
Canvas Current Texture
   |
   v
Screen
```

---

## 11. Why This Architecture Is Efficient

This design is efficient because the expensive black hole raymarching work runs in a compute shader on the GPU.

The CPU only does lightweight per-frame work:

- Update time
- Update camera data
- Write a small uniform buffer
- Submit GPU commands

The render pass is simple. It only displays the already-computed texture.

This keeps the architecture clean:

- `app.ts` handles app lifecycle and UI
- `camera.ts` handles camera state and input
- `blackhole.ts` handles WebGPU resources, bindings, pipelines, and rendering
- `compute.wgsl` handles black hole raymarching
- `render.wgsl` handles displaying the result
