# Orbit panoramic viewer

A self-contained, offline 360° viewer and prompt builder. Open `index.html` in a browser, choose or drop a full equirectangular panorama, and drag to look around. Full panoramas use a 2:1 aspect ratio and cover 360° horizontally and 180° vertically. Example images are in `examples/`; you can also load the hotel's images from `../Panoramas/`.

No installation, server, external dependencies, or uploads are required. The browser needs WebGL. Press **Escape** to return to the image picker.

## Generate the next viewpoint

1. Open **Next frame**. Direction follows the viewer's horizontal rotation: 0° front, −90° left, +90° right, and ±180° back. Manual entry remains available until you rotate again.
2. Choose the distance in meters and optionally add scene notes.
3. Copy the prompt into GPT and attach the current **full panorama** as Image 1.
4. Load the generated frame and repeat.

The prompt requests camera translation, parallax, consistent scene identity, full spherical coverage, and the same world-space front orientation. Distance and hidden geometry are approximate from a single image. The viewer builds prompts; image generation happens separately in GPT.

## Repair a wrap seam

1. Load the generated panorama and expand **Repair the wrap seam**.
2. Download a fresh repair reference. It moves the original edge join to the center and covers the join with a magenta placeholder.
3. Attach that reference to GPT and copy the matching repair prompt. GPT should reconstruct the missing strip. The optional alpha mask is for editing tools with a dedicated mask input.
4. Import GPT's candidate and inspect the before/after preview. The viewer rejects mismatched dimensions, exactly unchanged bands, and large remaining magenta placeholders. Other pixel changes do **not** prove successful seam repair.
5. Apply a suitable candidate and save the fixed panorama as your next generation reference.

Only the repair band is composited, with feathered boundaries. The original front orientation is restored. Keep the page open during the repair; the reference and band settings are held in memory. Check geometry, object continuity, and the wrap in 360° before accepting a result.

## Verification

With Node.js installed, run from this folder:

```sh
node tests/prompt-builder.test.cjs
```

The tests cover directions, automatic heading updates, prompts, image rolling, repair references and masks, candidate validation and application, preservation outside the band, feathering, orientation, and cancellation. They use a simulated DOM and pixel-backed canvas; they do not verify real browser/WebGL rendering or GPT generation quality.

The source panorama skill is preserved in `skills/panorama-from-image/`.
