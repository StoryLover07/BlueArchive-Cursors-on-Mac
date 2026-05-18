# Mousecape Runtime Diagnostics

These diagnostics are for isolating Mousecape/macOS cursor replacement behavior. They do not change the converted Blue Archive art and do not change the main generated capes.

## Why this exists

The current capes import and validate as plist files, but user-side runtime testing still shows basic cursors such as Arrow and IBeam not always applying, while Wait/Loading works well. That pattern points away from a simple PNG, hotspot, or frame-count problem and toward runtime behavior:

- The app or system context may use a different cursor identifier than the one being tested.
- Some CoreGraphics or CoreCursor identifiers may no longer be globally replaceable on recent macOS.
- AppKit, SwiftUI, Electron/Chromium, and window chrome can reset cursor state differently.
- Mousecape relies on private CoreGraphics cursor APIs, so behavior can differ by macOS version and hardware.

## Generate minimal capes

Run:

```sh
node scripts/make_diagnostic_capes.js
```

The script copies one cursor entry at a time from the existing STATIC capes into `mousecape_output/diagnostics/`. It does not decode, redraw, or modify images.

Generated files include one-id capes for:

- Arrow: `com.apple.coregraphics.Arrow`
- Context Arrow: `com.apple.coregraphics.ArrowCtx`
- IBeam: `com.apple.coregraphics.IBeam`
- IBeamXOR: `com.apple.coregraphics.IBeamXOR`
- Horizontal IBeam: `com.apple.cursor.26`
- Link: `com.apple.cursor.2`
- Pointing: `com.apple.cursor.13`
- Resize N/S variants: `com.apple.cursor.21`, `.22`, `.23`, `.31`, `.32`, `.36`
- Wait/Busy/counting variants: `com.apple.coregraphics.Wait`, `com.apple.cursor.4`, `.14`, `.15`, `.16`

## Recommended test matrix

Import and apply one diagnostic cape at a time. After each test, reset or apply the next diagnostic cape so only one identifier is active.

1. Test `BlueArchive_Regular_DIAG_Link.cape` on a web link. This is the positive control because Link has been observed to work.
2. Test `BlueArchive_Regular_DIAG_Arrow.cape` on desktop/Finder/app content.
3. Test `BlueArchive_Regular_DIAG_ArrowCtx.cape` in the same places.
4. Test `BlueArchive_Regular_DIAG_IBeam.cape` in native text fields.
5. Test `BlueArchive_Regular_DIAG_IBeamXOR.cape` and `BlueArchive_Regular_DIAG_IBeamHorizontal.cape` in the same text fields.
6. Test each ResizeNS diagnostic on native window edges and inside resizable app content.
7. Test Wait/Busy/counting diagnostics during known loading states.

Record results by app and context. For example:

```text
macOS version:
Mousecape version:
Hardware:

Identifier: com.apple.coregraphics.Arrow
Finder desktop:
Safari/Chrome page body:
TextEdit document:
Notes text field:
Window resize edge:
Observed flicker/disappear:
```

## Dump current Mousecape/CoreCursor data

Mousecape's `mousecloak` helper has a dump mode in upstream source:

```sh
mousecloak --dump /tmp/current-cursors.cape
```

If the installed app exposes the helper binary, run the dump after applying the working and non-working diagnostic capes, then compare the affected cursor entries:

```sh
plutil -p /tmp/current-cursors.cape
plutil -p mousecape_output/diagnostics/BlueArchive_Regular_DIAG_Arrow.cape
```

Useful things to compare:

- Whether the identifier is present in the dump.
- Whether `FrameCount`, `FrameDuration`, `PointsWide`, `PointsHigh`, `HotSpotX`, and `HotSpotY` match.
- Whether Mousecape writes back the representation as expected after applying.

If `--dump` does not include or preserve a tested identifier, the issue is likely Mousecape/CoreGraphics runtime support rather than the Blue Archive conversion.

## Interpreting outcomes

- Link diagnostic works, Arrow diagnostic does not: likely Arrow replacement is blocked, overridden, or using a different runtime path.
- Arrow works only in some apps: likely app-level `NSCursor` or framework reset behavior.
- IBeam variants all fail in text fields: likely IBeam replacement is not reliably hookable on this macOS/app combination.
- One ResizeNS variant works only on window chrome or only inside app content: the contexts are using different CoreCursor identifiers.
- Wait works consistently while static roles fail: animation and PNG representation are probably not the primary cause.
