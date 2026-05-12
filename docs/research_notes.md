# Research Notes

Date: 2026-05-12

## Mousecape support findings

- Mousecape imports and applies `.cape` files. Its upstream README describes a cape as a cursor pack with multiple scale representations per cursor, including examples such as Arrow having 1x, 2x, 5x, and 10x representations.
- Mousecape creation UI accepts images dragged into cursor representation fields. I did not find native `.cur` or `.ani` import code in the Mousecape source. Windows cursor files need conversion to image representations first.
- Mousecape animation is frame-based. Upstream documentation says animated cursors are represented as one vertical image strip, with frames stacked top-to-bottom, plus `FrameCount` and `FrameDuration`.
- Mousecape 1813 is the current upstream release referenced by the Mousecape project.

Primary sources checked:

- https://github.com/alexzielenski/Mousecape
- `source_repos/Mousecape/Mousecape/mousecloak/MCDefs.m`
- `source_repos/Mousecape/Mousecape/mousecloak/apply.m`
- `source_repos/Mousecape/Mousecape/com.maxrudberg.svanslosbluehazard.cape`

## Cape file structure

The example `.cape` in Mousecape is an XML property list. The top-level keys used here are:

- `Version`
- `MinimumVersion`
- `Author`
- `Identifier`
- `CapeName`
- `CapeVersion`
- `Cloud`
- `HiDPI`
- `Cursors`

Each cursor entry contains:

- `HotSpotX`
- `HotSpotY`
- `PointsWide`
- `PointsHigh`
- `FrameCount`
- `FrameDuration`
- `Representations`

`Representations` is an array of image data blobs. This conversion writes PNG image data for 1x and 2x representations.

## Cursor identifiers

Mousecape maps named cursor roles to CoreGraphics/CoreCursor identifiers. The conversion uses:

- Arrow: `com.apple.coregraphics.Arrow`
- Text/IBeam: `com.apple.coregraphics.IBeam`
- Wait: `com.apple.coregraphics.Wait`
- Link: `com.apple.cursor.2`
- Move: `com.apple.coregraphics.Move`
- Forbidden: `com.apple.cursor.3`
- Help: `com.apple.cursor.40`
- Resize NS: `com.apple.cursor.23`
- Resize EW: `com.apple.cursor.19`
- Resize Diagonal 1: `com.apple.cursor.34`
- Resize Diagonal 2: `com.apple.cursor.30`

## Windows cursor extraction

- `.cur` files are Windows cursor resources. Hotspots are stored in the directory entry.
- Regular Edition `.cur` files are 32x32 32-bit DIB cursor resources.
- Millennium Edition `.cur` files include multiple sizes. The converter uses the 32x32 cursor as the logical 1x cursor and the 64x64 embedded cursor as the 2x Retina representation where available.
- `.ani` files are RIFF `ACON` containers. The converter reads `anih`, `rate`, `seq `, and `LIST/fram/icon` chunks.
- Frames are extracted as cursor resources, preserving hotspot metadata from frame 1.

## Animation feasibility

Animations are feasible in Mousecape when represented as vertical frame sheets. Limitations found in Mousecape source:

- `apply.m` rejects frame counts outside `1...24`.
- Mousecape stores a single `FrameDuration` per cursor. Windows `.ani` can contain per-frame timing through a `rate` chunk.

For this reason:

- Static cursors are preserved.
- Animated cursors with constant timing and 24 or fewer output frames are preserved.
- Variable-timing `.ani` files are approximated with one frame duration.
- Animated cursors above 24 frames are trimmed to 24 frames for Mousecape compatibility.

