"""
noise_gen.py — Cinematic accretion disk noise texture
Output: noise_deep.png  (1024×512, tileable in U/angle, clamped in V/radius)

pip install numpy Pillow scipy
"""

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

# ── Config ──────────────────────────────────────────────────────────────────
W, H        = 1024, 512   # width = angular (tileable), height = radial
OCTAVES     = 6
WARP_STR    = 0.25        # domain warp strength  (0 = off, 0.4 = extreme)
SHEAR_SIG   = (1.0, 9.0)  # gaussian blur (radial σ, angular σ) — orbital smear
WORLEY_W    = 0.25        # how much cellular/blob noise to mix in
POWER       = 1.8         # contrast exponent — higher = darker, punchier

# ── Spectral noise (tileable by construction) ────────────────────────────────
def spectral_layer(w, h, fc, bw, seed):
    """Single frequency band, random phase — guaranteed periodic in both axes."""
    rng = np.random.default_rng(seed)
    fx  = np.fft.rfftfreq(w) * w
    fy  = np.fft.fftfreq(h) * h
    FX, FY = np.meshgrid(fx, fy)
    mag = np.sqrt(FX**2 + (FY * w / h)**2)   # aspect-correct frequency distance
    mag[0, 0] = 1e-9
    env = np.exp(-0.5 * ((mag - fc) / bw) ** 2)
    env[0, 0] = 0
    phase = rng.uniform(0, 2 * np.pi, env.shape)
    field = np.fft.irfft2(env * np.exp(1j * phase), s=(h, w))
    return (field / (np.abs(field).max() + 1e-9)).astype(np.float32)

def fbm_spectral(w, h, base_freq=3, octaves=6, lacunarity=2.0, gain=0.5):
    out, a, f = np.zeros((h, w), np.float32), 0.5, base_freq
    for i in range(octaves):
        out += a * spectral_layer(w, h, f, f * 0.5, seed=i * 37 + 13)
        a *= gain
        f *= lacunarity
    out -= out.min()
    return out / (out.max() + 1e-9)

# ── Worley / cellular noise ───────────────────────────────────────────────────
def worley_noise(w, h, n_cells=60, seed=99):
    """Inverted cell distance — peaks at cell centers, dips at boundaries."""
    rng  = np.random.default_rng(seed)
    pts  = rng.uniform(0, 1, (n_cells, 2))
    # replicate in x so angular edge wraps correctly
    pts3 = np.concatenate([pts + [dx, 0] for dx in (-1, 0, 1)])

    gx = np.linspace(0, 1, w, endpoint=False)
    gy = np.linspace(0, 1, h, endpoint=False)
    GX, GY = np.meshgrid(gx, gy)

    best = np.full((h, w), np.inf, np.float32)
    for cx, cy in pts3:
        d = np.sqrt((GX - cx) ** 2 + (GY - cy) ** 2)
        best = np.minimum(best, d)

    best -= best.min()
    return 1.0 - best / (best.max() + 1e-9)   # invert: bright blobs

# ── Bilinear sample with angular wrap ────────────────────────────────────────
def sample_bilinear(field, sx, sy, w, h):
    xi = sx * w
    yi = sy * h
    x0 = np.floor(xi).astype(int) % w          # wraps angularly
    x1 = (x0 + 1) % w
    y0 = np.clip(np.floor(yi).astype(int), 0, h - 1)
    y1 = np.clip(y0 + 1, 0, h - 1)
    tx = (xi - np.floor(xi)).astype(np.float32)
    ty = (yi - np.floor(yi)).astype(np.float32)
    return (field[y0, x0] * (1 - tx) * (1 - ty) +
            field[y0, x1] *      tx  * (1 - ty) +
            field[y1, x0] * (1 - tx) *      ty  +
            field[y1, x1] *      tx  *      ty)

# ── Domain warp ───────────────────────────────────────────────────────────────
def warp(field, strength, w, h):
    """Displace sample coordinates by two independent FBM fields."""
    wx = fbm_spectral(w, h, base_freq=4, octaves=4) * 2 - 1
    wy = fbm_spectral(w, h, base_freq=4, octaves=4) * 2 - 1

    gx = np.linspace(0, 1, w, endpoint=False)
    gy = np.linspace(0, 1, h, endpoint=False)
    GX, GY = np.meshgrid(gx, gy)

    sx = (GX + strength * wx) % 1.0                        # angular: wraps
    sy = np.clip(GY + strength * wy * 0.3, 0.0, 1.0)      # radial:  clamps

    return sample_bilinear(field, sx, sy, w, h)

# ── Main ──────────────────────────────────────────────────────────────────────
print("Generating base spectral FBM...")
base = fbm_spectral(W, H, base_freq=3, octaves=OCTAVES)

print("Domain warp pass 1...")
warped = warp(base, WARP_STR, W, H)

print("Domain warp pass 2 (half strength)...")
warped = warp(warped, WARP_STR * 0.5, W, H)

print("Generating Worley (plasma blob) layer...")
cells = worley_noise(W, H, n_cells=60)

print("Compositing + orbital shear...")
noise = warped * (1 - WORLEY_W) + cells * WORLEY_W

# Orbital shear: elongate features along angular axis (axis=1)
noise = gaussian_filter(noise, sigma=SHEAR_SIG)

# Re-normalise after blur
noise -= noise.min()
noise /= noise.max() + 1e-9

# Contrast punch
noise = np.power(noise, POWER)
noise -= noise.min()
noise /= noise.max() + 1e-9

img = (noise * 255).clip(0, 255).astype(np.uint8)
rgba = np.stack([img, img, img, np.full_like(img, 255)], axis=-1)
Image.fromarray(rgba, "RGBA").save("noise_deep.png")
print(f"Done → noise_deep.png  ({W}×{H})")