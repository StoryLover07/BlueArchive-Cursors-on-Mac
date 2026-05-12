# Static Compatibility Notes

## Why STATIC capes were added

The first generated Mousecape capes imported successfully, but runtime behavior was unstable: resize cursors only partially applied, and cursors could flicker or disappear during clicking or dragging.

The likely compatibility causes are:

- Animated cursor entries require Mousecape/CoreGraphics to split stacked frames reliably.
- Some Windows `.ani` timing data cannot be represented exactly because Mousecape stores one frame duration per cursor.
- macOS switches between multiple internal cursor identifiers during hover, click, drag, link hover, busy states, and resize gestures. A cape that only registers one identifier per role can appear to fall back or flicker when macOS moves to a related cursor id.

## Static fix

The STATIC capes:

- Use only one frame per cursor.
- Set every `FrameCount` to `1`.
- Set every `FrameDuration` to `1`.
- Keep 1x and 2x PNG representations.
- Preserve original hotspot coordinates.
- Register related macOS cursor identifiers for the same visual role.

Static PNG assets are written to `converted_assets_static/` and `generated_frames_static/`. Animated frame sheets remain in `converted_assets/`.

## Additional cursor aliases

The STATIC capes now use narrow aliases, modeled after the working Link cursor:

- Arrow and context arrow.
- IBeam and IBeamXOR.
- Link and pointing hand.
- Wait and busy.
- Move.
- Forbidden.
- Help.
- Primary Resize NS, EW, Diagonal 1, and Diagonal 2.

Each STATIC cape currently contains 15 cursor entries.

## Recommended testing order

1. Import `BlueArchive_Regular_STATIC.cape`.
2. Apply it in Mousecape.
3. Test Arrow, IBeam, Link, Wait/Busy, and all resize directions.
4. Import and test `BlueArchive_Millennium_STATIC.cape`.
5. Only after both are stable, try the non-static animated capes.
