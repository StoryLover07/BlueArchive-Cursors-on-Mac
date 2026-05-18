#!/usr/bin/env node
const childProcess = require("child_process");
const fs = require("fs");

const VALID_CURSOR_IDS = new Set([
  "com.apple.coregraphics.Alias",
  "com.apple.coregraphics.Arrow",
  "com.apple.coregraphics.ArrowCtx",
  "com.apple.coregraphics.Copy",
  "com.apple.coregraphics.Empty",
  "com.apple.coregraphics.IBeam",
  "com.apple.coregraphics.IBeamXOR",
  "com.apple.coregraphics.Move",
  "com.apple.coregraphics.Wait",
  "com.apple.cursor.2",
  "com.apple.cursor.3",
  "com.apple.cursor.4",
  "com.apple.cursor.5",
  "com.apple.cursor.7",
  "com.apple.cursor.8",
  "com.apple.cursor.9",
  "com.apple.cursor.10",
  "com.apple.cursor.11",
  "com.apple.cursor.12",
  "com.apple.cursor.13",
  "com.apple.cursor.14",
  "com.apple.cursor.15",
  "com.apple.cursor.16",
  "com.apple.cursor.17",
  "com.apple.cursor.18",
  "com.apple.cursor.19",
  "com.apple.cursor.20",
  "com.apple.cursor.21",
  "com.apple.cursor.22",
  "com.apple.cursor.23",
  "com.apple.cursor.24",
  "com.apple.cursor.25",
  "com.apple.cursor.26",
  "com.apple.cursor.27",
  "com.apple.cursor.28",
  "com.apple.cursor.29",
  "com.apple.cursor.30",
  "com.apple.cursor.31",
  "com.apple.cursor.32",
  "com.apple.cursor.33",
  "com.apple.cursor.34",
  "com.apple.cursor.35",
  "com.apple.cursor.36",
  "com.apple.cursor.37",
  "com.apple.cursor.38",
  "com.apple.cursor.39",
  "com.apple.cursor.40",
  "com.apple.cursor.41",
  "com.apple.cursor.42",
  "com.apple.cursor.43",
]);

const CAPES = [
  "mousecape_output/BlueArchive_Regular.cape",
  "mousecape_output/BlueArchive_Millennium.cape",
  "mousecape_output/BlueArchive_Regular_STATIC.cape",
  "mousecape_output/BlueArchive_Millennium_STATIC.cape",
];

function plist(file) {
  childProcess.execFileSync("plutil", ["-lint", file], { stdio: "pipe" });
  return childProcess.execFileSync("plutil", ["-p", file], { encoding: "utf8" });
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

for (const cape of CAPES) {
  if (!fs.existsSync(cape)) {
    fail(`Missing ${cape}`);
    continue;
  }
  const output = plist(cape);
  const ids = [...output.matchAll(/"(com\.apple[^"]+)" => \{/g)].map((match) => match[1]);
  const invalid = ids.filter((id) => !VALID_CURSOR_IDS.has(id));
  if (invalid.length) fail(`${cape}: invalid cursor ids: ${invalid.join(", ")}`);

  const zeroValues = output.match(/"HotSpot[XY]" => 0|"Points(?:High|Wide)" => 0/g);
  if (zeroValues) fail(`${cape}: zero hotspot or point size value found`);

  if (cape.includes("_STATIC")) {
    const nonStaticFrames = [...output.matchAll(/"FrameCount" => (\d+)/g)]
      .map((match) => Number(match[1]))
      .filter((count) => count !== 1);
    if (nonStaticFrames.length) fail(`${cape}: static cape has non-1 frame counts: ${nonStaticFrames.join(", ")}`);
  }

  console.log(`${cape}: OK (${ids.length} cursor ids)`);
}

