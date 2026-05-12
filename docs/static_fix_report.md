# Static Fix Report

## 1. What was wrong with the previous static version

The previous STATIC cape disabled all animations, but it also registered a broad set of macOS internal cursor aliases for resize and drag/window states. Link/clickable hover improved, but resize still flickered or disappeared during click/drag.

The likely issue is that some window-specific resize identifiers are unstable when replaced with the converted 32x32 cursor art. During a resize drag, macOS can switch cursor identifiers rapidly; replacing too many related resize/window ids can make that transition more fragile.

## 2. Why Link/clickable hover worked

The working Link implementation is simple and stable:

- Static single-frame cursor image.
- `FrameCount=1`.
- `FrameDuration=1`.
- Valid 32x32 1x PNG.
- Valid 64x64 2x Retina PNG.
- Hotspot preserved from the Windows cursor.
- Only the relevant clickable cursor identifiers are registered: `com.apple.cursor.2` and `com.apple.cursor.13`.

## 3. What changed for resize and other static cursors

The new `STATIC_FIXED` capes apply the Link pattern to every non-animated cursor role.

Resize cursors now register only the primary Mousecape/CoreCursor resize identifiers:

- Resize NS: `com.apple.cursor.23`
- Resize EW: `com.apple.cursor.19`
- Resize Diagonal 1: `com.apple.cursor.34`
- Resize Diagonal 2: `com.apple.cursor.30`

The broader window-edge aliases from the earlier STATIC build are not used in `STATIC_FIXED`.

## 4. Static cursor states

These are static in `STATIC_FIXED`:

- Arrow / Normal
- Link / Pointing hand / Clickable hover
- Move
- Forbidden / Block
- Help
- Resize NS
- Resize EW
- Resize Diagonal 1
- Resize Diagonal 2

Each static role uses one frame, valid 1x and 2x PNG data, original hotspot metadata, and no blank animation frames.

## 5. Animated cursor states

Only these remain animated:

- Regular Loading / Wait: `loading.ani`
- Regular Text / IBeam: `text.ani`
- Millennium Loading / Wait: `millennium_loading_v1.ani`
- Millennium Text / IBeam: `millennium_text.ani`

## 6. Known Mousecape/macOS limitations

- Mousecape stores one `FrameDuration` per cursor, while Windows `.ani` can contain per-frame timing.
- Mousecape's application code rejects animation frame counts outside `1...24`.
- macOS may use private or version-dependent CoreCursor identifiers during some window-resize gestures. `STATIC_FIXED` avoids replacing the broad window-specific resize aliases that appeared unstable.

## 7. Exact files to import

Import and apply these first:

- `mousecape_output/BlueArchive_Regular_STATIC_FIXED.cape`
- `mousecape_output/BlueArchive_Millennium_STATIC_FIXED.cape`

Treat these as older fallback or experimental files:

- `mousecape_output/BlueArchive_Regular_STATIC.cape`
- `mousecape_output/BlueArchive_Millennium_STATIC.cape`
- `mousecape_output/BlueArchive_Regular.cape`
- `mousecape_output/BlueArchive_Millennium.cape`

