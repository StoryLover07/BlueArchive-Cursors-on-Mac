# Animation Report

## Summary

Recommended use: import the STATIC capes first. The STATIC capes intentionally disable every animation and use only the first source frame for each animated cursor.

- Regular `text.ani`: approximated. The source uses variable frame timing; Mousecape supports one frame duration per cursor, so the first rate was used.
- Regular `loading.ani`: approximated. The source uses variable frame timing; Mousecape supports one frame duration per cursor, so the first rate was used.
- Millennium `millennium_text.ani`: preserved. Constant timing, output frame count is within Mousecape's 24-frame limit.
- Millennium `millennium_loading_v1.ani`: approximated. The source has 25 physical frames; Mousecape accepts up to 24, so the output was trimmed to 24 frames.

## Generated Animation Assets

- Frame sheets for Mousecape import are in `converted_assets/<Theme>/<Role>/`.
- Individual extracted frames are in `generated_frames/<Theme>/<Role>/`.
- Both 1x and 2x PNGs were generated.

## Machine-Readable Report

See `docs/animation_report.json` for exact frame counts, frame durations, source files, and status per cursor role.

See `docs/animation_report_static.json` for the STATIC cape report. All STATIC animated sources are marked `static-disabled`.
