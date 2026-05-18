# Final Report

## What Works

- Generated `mousecape_output/BlueArchive_Regular_STATIC.cape`.
- Generated `mousecape_output/BlueArchive_Millennium_STATIC.cape`.
- Generated `mousecape_output/BlueArchive_Regular.cape`.
- Generated `mousecape_output/BlueArchive_Millennium.cape`.
- Extracted all required Regular and Millennium cursor roles.
- Generated 1x and 2x PNG assets.
- Generated separate STATIC 1x and 2x PNG assets.
- Generated individual animation frames and Mousecape vertical frame sheets.
- Generated separate STATIC first-frame assets.
- Preserved Windows cursor hotspot metadata in generated documentation and cape files.
- Produced mapping and hotspot documentation for manual Mousecape assembly if needed.
- Updated BOTH STATIC and animated capes to use only cursor ids from Mousecape's own cursor map.
- Static Text/Wait now use the most visible extracted frame instead of blindly using the first animation frame.

## What Works (Improved)

- Animated capes now include official cursor-id aliases for better reliability in macOS.
- Regular `text.ani` and `loading.ani` variable timing was averaged for smoother Mousecape playback.
- Millennium `millennium_loading_v1.ani` is now downsampled to 24 frames (Mousecape limit) to preserve the full animation cycle.
- Loading animation was reported by the user as natural; it remains enabled in the animated capes.

## What Failed

- No source cursor content failed extraction.
- No required PNG generation failed.
- No plist validation failed.

## Cape Generation

`.cape` generation succeeded at the file-format level. All generated cape files pass `plutil -lint`.

Recommended files:

- `BlueArchive_Regular.cape`
- `BlueArchive_Millennium.cape`

Static fallback files:

- `BlueArchive_Regular_STATIC.cape`
- `BlueArchive_Millennium_STATIC.cape`

## Animation Preservation

- Static cursor roles: preserved.
- STATIC capes intentionally disable animation and use visible single-frame cursor images.
- Millennium Text animation: preserved.
- Regular Text and Wait animations: approximated due to Mousecape timing limits.
- Millennium Wait animation: approximated due to Mousecape's 24-frame limit.

## Manual Steps Remaining

- Import both animated `.cape` files into Mousecape 1813 first.
- If an app still shows cursor instability, apply the matching STATIC fallback cape.
- Confirm hotspot feel in real use.
- If Mousecape rejects either generated cape, assemble from `converted_assets_static`, `mapping.json`, and `docs/hotspots_static.json`.

## Recommended Next Improvements

- Test import/apply on an Apple Silicon Mac running Sonoma and Sequoia.
- If Mousecape accepts more representations reliably, add 5x/10x generated representations.
- Add a tiny visual QA page/contact sheet for comparing all cursor roles side-by-side.
