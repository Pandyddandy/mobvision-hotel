---
name: panorama-from-image
description: Convert an ordinary perspective image or scene reference into a full spherical 360° x 180° equirectangular panorama suitable for interactive panoramic viewers, VR skyboxes, environment textures, and spherical image viewers. Use when the user asks to turn a normal image into a panorama, extend a photo or generated image into 360°, create a 2:1 equirectangular texture from a reference image, make a seamless spherical environment, or regenerate a scene as a complete panorama with zenith, nadir, and seamless left-right wrapping.
---

# Panorama From Image

Turn a supplied image into a full spherical environment rather than a merely wide crop or stretched frame. Treat the source image as the visual and geometric anchor for the forward-facing direction, then infer and synthesize the unseen surroundings consistently.

## Core workflow

1. Confirm there is a usable image in the current conversation.
   - If no source image is available, ask the user to upload or identify one.
   - If the user supplied several images, use the one they identify as the scene anchor; use others only as supporting references.

2. Inspect the source before generation.
   - Identify camera height, approximate field of view, horizon, dominant geometry, materials, lighting direction, weather, time of day, and scene style.
   - Preserve distinctive structures, furniture, terrain, architecture, characters, and lighting visible in the source unless the user asks to change them.
   - Treat the original view as the center/front longitude by default.

3. Generate by image editing / image-conditioned generation, not by simple stretching.
   - Extend the environment around the camera through the unseen left, right, rear, overhead, and beneath regions.
   - Invent hidden geometry conservatively and plausibly from the source scene.
   - Do not mirror-copy major objects around the sphere unless the scene logically requires symmetry.
   - Preserve scale and perspective continuity at the boundaries between source-derived and newly invented regions.

4. Enforce spherical panorama geometry.
   - Output exactly a 2:1 image.
   - Use a single stationary, level camera at the source camera's plausible eye height.
   - Place the horizon at the vertical midpoint unless the source clearly demands another camera pitch; prefer correcting mild source tilt instead of carrying it into the panorama.
   - Cover the full 360° horizontally and full 180° vertically.
   - Include both zenith and nadir.
   - Use correct equirectangular projection, including expected stretching toward the top and bottom.

5. Enforce seam quality.
   - The left and right edges must represent adjacent longitudes and join naturally.
   - Continue floors, walls, railings, roads, coastlines, ceilings, skies, light gradients, shadows, and textures across the wrap seam.
   - Keep strong singular objects away from the seam when possible.
   - Avoid duplicated people, furniture, windows, lamps, trees, or skyline elements caused by edge repetition.
   - Avoid abrupt exposure, color-temperature, weather, or cloud changes at the seam.

6. Preserve scene identity.
   - Match the source's visual style, lens character, texture density, color grade, exposure, and lighting direction.
   - Do not arbitrarily redesign the visible source region.
   - If the source is photorealistic, keep the panorama photorealistic; if stylized, preserve that style.
   - For people or named characters, preserve identity and clothing and avoid accidental duplicates elsewhere in the panorama.

7. Deliver only the panorama image unless the user asks for commentary.

## Default image-generation brief

Use the following intent when invoking the image generation/editing tool. Adapt scene-specific details from the source image; do not copy the bracketed placeholders literally.

Read `references/prompt-pattern.md` for the canonical prompt pattern and seam checklist.

## Quality rules

A valid result must satisfy all of these:

- 2:1 equirectangular flat texture.
- Full 360° x 180° spherical coverage.
- Horizon centered vertically.
- Complete overhead and beneath-camera content.
- No black poles, missing floor, blank ceiling, borders, text, UI, or cubemap faces.
- No fisheye circle, tiny-planet projection, cylindrical panorama, or ordinary ultrawide perspective.
- No simple horizontal stretch of the source image.
- Plausible spatial continuity behind the original camera.
- Seam-aware left/right edge construction.

If a first result visibly behaves like a normal ultrawide image rather than a true spherical texture, regenerate with stronger emphasis on **full spherical equirectangular projection, zenith/nadir coverage, and seamless 0°/360° wrapping**.

## User shorthand

Interpret requests like these as this workflow:

- "make this 360"
- "turn this into a panorama"
- "bake a 2:1 pano from this"
- "make this equirectangular"
- "extend this scene all around me"
- "use this image as the front view of a 360 environment"

By default, preserve the original scene faithfully and synthesize only what the source does not show.
