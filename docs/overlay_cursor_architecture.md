# Overlay Cursor Architecture

## Current conclusion

Mousecape/CoreGraphics runtime replacement is not a reliable primary path on macOS 26 for the Blue Archive cursor pack.

The diagnostic capes isolate one cursor identifier at a time. In the reported macOS 26 environment, these all failed:

- `com.apple.cursor.2` / Link
- `com.apple.coregraphics.Arrow`
- `com.apple.coregraphics.IBeam`
- `com.apple.coregraphics.IBeamXOR`
- `com.apple.cursor.26` / horizontal IBeam

That result is stronger than the earlier mixed behavior. If Link, Arrow, and IBeam all fail in Chrome, Finder, and system UI while the capes still import and lint correctly, the problem is no longer likely to be PNG encoding, hotspots, frame count, or alias coverage. The replacement path itself is unreliable for modern macOS.

## Viable pivot

The practical alternative is an overlay cursor renderer:

1. Hide the native cursor.
2. Track global mouse location.
3. Render the converted Blue Archive cursor image in a transparent, click-through window above normal UI.
4. Preserve animation by advancing through extracted frames.
5. Add contextual cursor classification later.

This is closer to how professional cursor-highlighting, screen recording, and assistive overlay tools avoid depending on private cursor replacement APIs.

## Prototype

The repository now includes a SwiftPM prototype in `NativeCursorOverlay/`.

It currently supports:

- Native AppKit executable.
- Transparent click-through overlay window.
- All Spaces / fullscreen auxiliary window behavior.
- Global mouse tracking through a listen-only CGEvent tap when available.
- Timer polling fallback using `NSEvent.mouseLocation`.
- Optional native cursor hiding through `CGDisplayHideCursor`.
- Retina-friendly drawing using the existing extracted PNG frames.
- Animated cursor roles such as `Wait` and `Text`.
- Manual role selection for testing.
- Runtime role switching through global hotkeys when the event tap receives key events.
- Automatic role cycling for deterministic verification.

It intentionally does not modify original Blue Archive assets.

## Run

From `NativeCursorOverlay/`:

```sh
swift run bluearchive-cursor-overlay --repo .. --theme Regular --role Arrow --verbose
```

For a non-invasive visual test that keeps the system cursor visible:

```sh
swift run bluearchive-cursor-overlay --repo .. --theme Regular --role Arrow --no-hide --verbose
```

Animated wait test:

```sh
swift run bluearchive-cursor-overlay --repo .. --theme Regular --role Wait --verbose
```

Auto-cycle verification:

```sh
swift run bluearchive-cursor-overlay --repo .. --theme Regular --role Arrow --no-hide --duration 5 --cycle-seconds 1 --verbose
```

Expected log:

```text
Switched role: Text, frames: 22
Switched role: Link, frames: 1
Switched role: Wait, frames: 13
```

Quit with `Control-C` in the terminal.

## Hotkeys

When the event tap is allowed to observe keyboard input, use `Control+Option+Command` plus:

- `A`: Arrow
- `T`: Text/IBeam
- `L`: Link
- `W`: Wait
- `M`: Move
- `N`: Resize N/S
- `E`: Resize E/W
- `1`: Resize diagonal 1
- `2`: Resize diagonal 2
- `F`: Forbidden
- `H`: Help

Synthetic hotkeys sent through automation may not be seen by the event tap even when physical keyboard input works. Use `--cycle-seconds` for deterministic automated testing.

## Important permissions

The overlay can poll `NSEvent.mouseLocation` without being a full cursor replacement system. For the lower-latency CGEvent tap path, macOS may require Accessibility/Input Monitoring permission for the terminal or final app bundle.

If the native cursor is hidden, the process must terminate cleanly to show it again. The prototype calls `CGDisplayShowCursor` during normal termination. If it is force-killed and the cursor remains hidden, moving focus or running another cursor-showing utility may be needed.

## Context detection plan

Reliable contextual cursor states are the hard part. Options:

- Manual mode/hotkeys: simplest and robust for proof of rendering.
- Accessibility hit testing: can infer text fields, links, buttons, and resize handles in many native apps, but requires Accessibility permission and may be inconsistent in Chrome/Electron.
- Event-driven heuristics: infer drag, resize, and busy states from mouse button state, active app, and window edge geometry.
- Browser extension bridge: strongest option for Chrome link/text context, but app-specific.
- Hybrid: overlay renderer core plus optional app-specific detectors.

The first production-quality path should be hybrid:

1. Overlay renderer core in Swift.
2. Accessibility-based detector for native apps.
3. Browser extension or injected helper for Chromium-family apps if link/text precision is required.
4. User fallback hotkeys for contexts that cannot be detected safely.

## Known limitations

- A transparent overlay cannot change the actual system cursor semantic state; it only visually replaces it.
- Fullscreen and secure input contexts may place windows above the overlay or restrict event observation.
- Multi-monitor support needs more testing around displays with different scale factors.
- The event tap may require user permission.
- Contextual role detection is not complete in the prototype.

## Verified locally

On macOS 26 with Command Line Tools Swift:

- `swift build` succeeds.
- `swift run bluearchive-cursor-overlay --repo .. --theme Regular --role Arrow --no-hide --duration 2 --verbose` starts the overlay, creates a top-level transparent window, and installs the event tap.
- A screenshot with Screen Recording permission shows the Blue Archive cursor rendered above normal apps.
- `swift run bluearchive-cursor-overlay --repo .. --theme Regular --role Arrow --no-hide --duration 5 --cycle-seconds 1 --verbose` switches roles at runtime and loads animated frame sets.
- `swift run bluearchive-cursor-overlay --repo .. --theme Regular --role Arrow --duration 2 --verbose` hides the native cursor and exits cleanly.
