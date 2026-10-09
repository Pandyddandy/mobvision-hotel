# MobVision Hotel

A browser-based, interactive 360° hotel tour, with a standalone panorama viewer for exploring images and preparing prompts for new viewpoints and seam repairs.

Both apps use plain HTML, CSS, and JavaScript. There is no build step, package installation, or application backend.

## What's included

### Hotel tour

The root [`index.html`](index.html) uses Pannellum to connect hotel panoramas through clickable hotspots:

- Explore the exterior, lobby, reception desk, hall, and Room 101.
- See a daytime exterior from 07:00 to 18:59 and a nighttime exterior otherwise, based on the visitor's local device time when the exterior scene loads.
- Open the elevator panel and select **Rooms** to reach the hall, with optional local sound effects.
- Toggle Room 101's lights while preserving the viewing direction and zoom. Entering from the hall starts with the lights on.
- Use the camera readout and Shift-click coordinates to position hotspots during development.

The reception's **Check In / Login** action is a placeholder. The elevator's **Café**, **Pool**, and **Gym** destinations display **Coming Soon**. Camera limits and hotspot positions are still being tuned.

### Orbit panorama viewer

[`panoramic-viewer/index.html`](panoramic-viewer/index.html) is a self-contained WebGL viewer that works offline:

- Choose or drop a local equirectangular image and explore it with mouse, touch, or keyboard controls.
- Build a **Next frame** prompt using a direction, distance, and optional scene notes.
- Prepare a wrap-seam repair reference, preview a generated candidate, blend the repair band, and save the fixed panorama.
- Open the built-in usage guide on the first visit or with the **?** buttons.

Images stay on the device. Orbit builds prompts; image generation happens separately in GPT. See the [Orbit README](panoramic-viewer/README.md) for the complete generation and repair workflow.

## Run locally

Use a modern browser with WebGL enabled. The hotel tour loads **Pannellum 2.5.6** JavaScript and CSS from jsDelivr, so it requires internet access to that CDN. Orbit has no external runtime dependencies.

Clone the project:

```sh
git clone https://github.com/Pandyddandy/mobvision-hotel.git
cd mobvision-hotel
```

Serve the repository root with Python 3:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

On Windows, use `py -3` instead of `python` if needed. Any static HTTP server can serve the same files.

Open:

| App | Local URL |
| --- | --- |
| Hotel tour | <http://127.0.0.1:8000/> |
| Orbit viewer | <http://127.0.0.1:8000/panoramic-viewer/> |

Stop the server with **Ctrl+C**. Orbit can also be used by opening `panoramic-viewer/index.html` directly in a browser, without a server.

## Explore the hotel

1. Drag to look around and use the viewer's zoom controls or mouse wheel to zoom.
2. Select **Enter Hotel** to reach the lobby.
3. Use **Desk**, **Hall**, or **Elevator** to explore. In the elevator, choose **Rooms**.
4. From the hall, enter **Room 101** and use the light switch in the upper-right corner.
5. Follow **Back to Hall** and **Back to Lobby** to return.

## Project layout

```text
mobvision-hotel/
├── README.md
├── index.html                         # Hotel tour, scene configuration, and UI
├── Panoramas/                         # Hotel panorama PNGs and lighting variants
├── assets/sounds/elevator/             # Door, button, and arrival audio
└── panoramic-viewer/
    ├── index.html                     # Self-contained Orbit app
    ├── README.md                      # Detailed Orbit usage and verification
    ├── examples/                      # Sample rooftop panoramas
    ├── tests/prompt-builder.test.cjs   # Node.js behavior checks
    └── skills/panorama-from-image/     # Panorama-generation instructions
```

## Add or adjust hotel scenes

1. Put a full **360° × 180° equirectangular panorama** in `Panoramas/`. Use a **2:1 width-to-height ratio**; an ordinary wide photo does not contain the full spherical view.
2. Add a scene to the `scenes` object in the root `index.html`, with `type: 'equirectangular'` and the image's relative `panorama` path.
3. Add a navigation hotspot to an existing scene using the new scene's ID:

   ```js
   { pitch: 0, yaw: 45, type: 'scene', text: 'New room', sceneId: 'new_room' }
   ```

4. Use the on-screen yaw/pitch readout or **Shift-click** on the panorama to find hotspot coordinates. Shift-click displays the coordinates and logs them in the browser console.
5. Reload the tour and check navigation, image wrapping, and return hotspots. Paths are case-sensitive on many hosting platforms; preserve the `Panoramas/` capitalization.

The `exteriorSchedule` and `room101Lighting` objects configure day/night selection and room lighting assets. Hotel styling, scripts, and scene definitions all live in the root HTML file.

## Verification

With Node.js installed, run the existing Orbit checks from the repository root:

```sh
node panoramic-viewer/tests/prompt-builder.test.cjs
```

The suite checks the usage guide, prompt directions, heading updates, image rolling, seam-repair references and masks, candidate validation, and compositing. It uses a simulated DOM and pixel-backed canvas; it does not verify real browser/WebGL rendering, hotel navigation, or generated-image quality.

For manual verification, serve the project and walk through the hotel route, toggle Room 101's lights, and try the elevator. In Orbit, load an image from `Panoramas/` or `panoramic-viewer/examples/`, explore it, and check the guide and prompt builder. Inspect seam repairs visually before applying them.

## Hosting and troubleshooting

Deploy the repository contents to a static host, keeping the directory structure intact. Serve the root `index.html` for the hotel tour and `/panoramic-viewer/` for Orbit. No server-side application is required.

- **Hotel tour is blank:** check browser console errors, WebGL support, and access to the jsDelivr scripts and stylesheet referenced in `index.html`.
- **A scene image is missing:** serve from the repository root and check the asset path, filename, and capitalization.
- **A panorama looks distorted:** confirm that it is a full spherical equirectangular image rather than a cropped or stretched photo.
- **Elevator audio is silent:** check browser playback restrictions and the files in `assets/sounds/elevator/`. Audio failures do not interrupt navigation.
- **Orbit's guide appears again:** browser storage may be blocked or cleared; the guide remains available through **?**.

## License

This repository does not currently include a license file. Check with the project owner before redistributing its code, panorama images, or sound assets.
