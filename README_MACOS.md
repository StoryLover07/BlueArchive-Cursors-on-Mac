# Blue Archive macOS Mousecape Cursor Conversion

This package converts the existing Windows BlueArchive cursor packs from `makipom/BlueArchive-Cursors` into Mousecape-ready macOS cursor themes.

No cursor art was redesigned. The conversion preserves the original `.cur` and `.ani` cursor appearance as closely as Mousecape's format allows.

## Deliverables

- `mousecape_output/BlueArchive_Regular_STATIC.cape`
- `mousecape_output/BlueArchive_Millennium_STATIC.cape`
- `mousecape_output/BlueArchive_Regular.cape`
- `mousecape_output/BlueArchive_Millennium.cape`
- `converted_assets/Regular/`
- `converted_assets/Millennium/`
- `converted_assets_static/Regular/`
- `converted_assets_static/Millennium/`
- `generated_frames/Regular/`
- `generated_frames/Millennium/`
- `generated_frames_static/Regular/`
- `generated_frames_static/Millennium/`
- `mapping.json`
- `docs/hotspots.json`
- `docs/animation_report.md`
- `docs/research_notes.md`
- `scripts/convert_cursors.js`

## Import Into Mousecape

Recommended:

Use the animated capes when you want the confirmed loading animation:

- `mousecape_output/BlueArchive_Regular.cape`
- `mousecape_output/BlueArchive_Millennium.cape`

These keep Loading/Wait and Text/IBeam animated, while all naturally static roles remain single-frame. They now use only cursor identifiers present in Mousecape's own cursor map.

Fallback:

Use the STATIC capes first:

- `mousecape_output/BlueArchive_Regular_STATIC.cape`
- `mousecape_output/BlueArchive_Millennium_STATIC.cape`

These disable all animations and use visible single-frame assets. Static Text/Wait choose the most visible extracted frame instead of blindly using the first animation frame.

1. Open Mousecape 1813.
2. Use `File > Import Cape`.
3. Select `mousecape_output/BlueArchive_Regular.cape` or `mousecape_output/BlueArchive_Millennium.cape`.
4. Select the imported cape in Mousecape.
5. Click `Apply Cape`.

To switch themes, select the other imported cape and click `Apply Cape` again.

If Arrow/Text/Resize still behaves differently across apps, test the matching `_STATIC.cape` as a fallback so animation is removed from the equation.

## If Cape Import Fails

Mousecape's `.cape` internals are not formally documented, so the package also includes manual import assets.

Manual assembly path:

1. In Mousecape, create a new cape.
2. Add each cursor role listed in `mapping.json`.
3. For the recommended static build, drag the matching PNG from `converted_assets_static/<Theme>/<Role>/` into the cursor representation fields.
4. Set hotspot, size, frame count, and frame duration from `docs/hotspots_static.json`.
5. For animated cursors, use the vertical frame sheet PNG and set the reported frame count/duration.

Animated manual assets remain in `converted_assets/<Theme>/<Role>/`.

## Retina Support

Retina support is included.

- 1x assets are 32px logical cursor images.
- 2x assets are 64px Retina images.
- Millennium cursors use embedded 64px source images for 2x where available.
- Regular cursors only provide 32px source images, so 2x assets are nearest-neighbor scaled to keep edges sharp.

## Animation Status

The recommended animated capes keep animation for Text/IBeam and Loading/Wait only.

Static roles in the animated capes include:

- Arrow / Normal
- Link / Pointing hand / Clickable hover
- Move
- Forbidden / Block
- Help
- Resize NS
- Resize EW
- Resize Diagonal 1
- Resize Diagonal 2

- Mousecape animation uses a vertical frame sheet.
- Mousecape supports one frame duration per cursor.
- Mousecape source code enforces a maximum of 24 frames.

See `docs/animation_report.md` for exact preservation and approximation notes.

## Hotspots

Hotspots were read from the original Windows cursor metadata and written to the cape files. The extracted values are in `docs/hotspots.json`.

Important precision hotspots:

- Regular Arrow: `(5, 2)`
- Regular Link: `(5, 2)`
- Regular Text: `(15, 15)`
- Millennium Arrow: `(6, 10)`
- Millennium Link: `(6, 10)`
- Millennium Text: `(11, 19)`

## Validation

Completed:

- Parsed all required Regular and Millennium source cursors.
- Extracted PNG assets and animation frames.
- Generated 1x and 2x assets.
- Generated recommended STATIC Mousecape `.cape` plist files.
- Generated experimental animated Mousecape `.cape` plist files.
- Validated all `.cape` files with `plutil -lint`.
- Validated all cursor identifiers against Mousecape's own cursor map.
- Verified representative PNG frame-sheet dimensions with `sips`.
- Verified STATIC capes contain only `FrameCount=1` cursor entries.
- Verified STATIC capes have no zero hotspot or point-size values.
- Reworked cursor aliases to use official Mousecape ids only.

Still needs user-side runtime validation:

- Import both capes into Mousecape 1813.
- Apply each theme on macOS Sonoma or Sequoia.
- Confirm cursor replacement behavior in common apps.
- Confirm Arrow, Text, and Link hotspot feel.

## Runtime Diagnostics

If the full capes import but Arrow, IBeam, or resize cursors still do not apply consistently, stop changing the broad cursor mapping and use the minimal diagnostics instead:

```sh
node scripts/make_diagnostic_capes.js
```

This writes one-identifier test capes to `mousecape_output/diagnostics/`, such as `BlueArchive_Regular_DIAG_Arrow.cape`, `BlueArchive_Regular_DIAG_IBeam.cape`, `BlueArchive_Regular_DIAG_Link.cape`, `BlueArchive_Regular_DIAG_ResizeNS.cape`, and `BlueArchive_Regular_DIAG_Wait.cape`.

See `docs/mousecape_runtime_diagnostics.md` for the test matrix and Mousecape dump notes.

## Rebuild

From the project root:

```sh
node scripts/convert_cursors.js
node scripts/make_diagnostic_capes.js
node scripts/validate_mousecape_outputs.js
```

The script reads from `source_repos/BlueArchive-Cursors` and writes only generated output folders.
