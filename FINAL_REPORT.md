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
- Updated STATIC capes to use the same narrow cursor-id pattern that made Link/clickable hover reliable.

## What Partially Works

- Animated capes are now considered experimental because the first runtime test showed flicker/fallback behavior in Mousecape.
- Regular `text.ani` and `loading.ani` use variable timing. Mousecape supports one frame duration per cursor, so timing was normalized.
- Millennium `millennium_loading_v1.ani` has more frames than Mousecape accepts. It was trimmed to 24 frames.
- Runtime `.cape` import/application has not been tested inside the Mousecape GUI from this environment.

## What Failed

- No source cursor content failed extraction.
- No required PNG generation failed.
- No plist validation failed.

## Cape Generation

`.cape` generation succeeded at the file-format level. All generated cape files pass `plutil -lint`.

Recommended files:

- `BlueArchive_Regular_STATIC.cape`
- `BlueArchive_Millennium_STATIC.cape`

Experimental files:

- `BlueArchive_Regular.cape`
- `BlueArchive_Millennium.cape`

## Animation Preservation

- Static cursor roles: preserved.
- STATIC capes intentionally disable animation and use first-frame cursor images.
- Millennium Text animation: preserved.
- Regular Text and Wait animations: approximated due to Mousecape timing limits.
- Millennium Wait animation: approximated due to Mousecape's 24-frame limit.

## Manual Steps Remaining

- Import both STATIC `.cape` files into Mousecape 1813.
- Apply Regular STATIC and Millennium STATIC themes once each.
- Confirm hotspot feel in real use.
- If Mousecape rejects either generated cape, assemble from `converted_assets_static`, `mapping.json`, and `docs/hotspots_static.json`.

## Recommended Next Improvements

- Test import/apply on an Apple Silicon Mac running Sonoma and Sequoia.
- If Mousecape accepts more representations reliably, add 5x/10x generated representations.
- Add a tiny visual QA page/contact sheet for comparing all cursor roles side-by-side.
