# Canonical panorama prompt pattern

Use this as the generation brief when converting an attached source image into a spherical panorama.

> Use the attached image as the primary scene and visual reference. Reconstruct the same environment as a full spherical 360° x 180° equirectangular panorama intended as a texture for an interactive panoramic viewer. Treat the source image as the forward-facing anchor view and preserve its visible architecture, objects, materials, atmosphere, lighting direction, color grade, scale, and scene identity as closely as possible. Do not merely stretch or widen the source. Plausibly synthesize all unseen surroundings behind, beside, above, and beneath the original camera so the camera is enclosed by one coherent environment.
>
> Use a single stationary, level camera at the source scene's plausible eye height. Output a 2:1 equirectangular projection with the horizon at the vertical midpoint. Include the full zenith directly overhead and the full nadir directly beneath the camera, with the appropriate equirectangular stretching near both poles.
>
> Make the panorama horizontally seamless: the left and right edges represent adjacent directions and must join naturally with continuous geometry, floor/ceiling lines, textures, skyline or landscape features, cloud fields, lighting, exposure, and shadows. Avoid placing a unique high-detail subject directly across the seam. Avoid duplicated objects or people caused by wrapping. Preserve spatial logic throughout the entire sphere.
>
> Output only the flat equirectangular panorama texture. No borders, no text, no labels, no interface, no cubemap layout, no fisheye circle, no tiny-planet projection.

## Scene-specific additions

Append concrete observations from the source, for example:

- "Continue the same stone floor around the terrace and beneath the camera."
- "The moonlight comes from camera-right; preserve that direction across the full environment."
- "Keep the cathedral visible in the forward quadrant and infer adjoining streets behind the camera."
- "Preserve the exact gothic bedroom furniture visible in the source; invent only the walls and floor portions outside the original frame."
- "Keep the character only once, in the same forward-facing position; do not duplicate them around the panorama."

## Seam checklist

Before accepting a result, visually inspect:

1. Left and right edge color/exposure compatibility.
2. Major floor, wall, railing, horizon, and ceiling lines reaching compatible heights at both edges.
3. No half-object at one edge whose other half fails to continue on the opposite edge.
4. No duplicated landmark positioned symmetrically at both edges.
5. No obvious vertical seam in sky gradients or clouds.
6. Nadir is filled with plausible ground/floor rather than a pinched void or missing patch.
7. Zenith is filled with plausible sky/ceiling rather than a blank cap.
