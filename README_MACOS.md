# Blue Archive macOS Mousecape Cursor Conversion

This package converts the existing Windows BlueArchive cursor packs from `makipom/BlueArchive-Cursors` into Mousecape-ready macOS cursor themes.

No cursor art was redesigned. The conversion preserves the original `.cur` and `.ani` cursor appearance as closely as Mousecape's format allows.

## Deliverables

- `mousecape_output/BlueArchive_Regular.cape`
- `mousecape_output/BlueArchive_Millennium.cape`
- `converted_assets/Regular/`
- `converted_assets/Millennium/`
- `generated_frames/Regular/`
- `generated_frames/Millennium/`
- `mapping.json`
- `docs/hotspots.json`
- `docs/animation_report.md`
- `docs/research_notes.md`
- `scripts/convert_cursors.js`

## Import Into Mousecape

1. Open Mousecape 1813.
2. Use `File > Import Cape`.
3. Select `mousecape_output/BlueArchive_Regular.cape` or `mousecape_output/BlueArchive_Millennium.cape`.
4. Select the imported cape in Mousecape.
5. Click `Apply Cape`.

To switch themes, select the other imported cape and click `Apply Cape` again.

## If Cape Import Fails

Mousecape's `.cape` internals are not formally documented, so the package also includes manual import assets.

Manual assembly path:

1. In Mousecape, create a new cape.
2. Add each cursor role listed in `mapping.json`.
3. Drag the matching PNG from `converted_assets/<Theme>/<Role>/` into the cursor representation fields.
4. Set hotspot, size, frame count, and frame duration from `docs/hotspots.json`.
5. For animated cursors, use the vertical frame sheet PNG and set the reported frame count/duration.

## Retina Support

Retina support is included.

- 1x assets are 32px logical cursor images.
- 2x assets are 64px Retina images.
- Millennium cursors use embedded 64px source images for 2x where available.
- Regular cursors only provide 32px source images, so 2x assets are nearest-neighbor scaled to keep edges sharp.

## Animation Status

Animations are included where Mousecape can represent them.

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
- Generated Mousecape `.cape` plist files.
- Validated both `.cape` files with `plutil -lint`.
- Verified representative PNG frame-sheet dimensions with `sips`.

Still needs user-side runtime validation:

- Import both capes into Mousecape 1813.
- Apply each theme on macOS Sonoma or Sequoia.
- Confirm cursor replacement behavior in common apps.
- Confirm Arrow, Text, and Link hotspot feel.

## Rebuild

From the project root:

```sh
node scripts/convert_cursors.js
```

The script reads from `source_repos/BlueArchive-Cursors` and writes only generated output folders.

