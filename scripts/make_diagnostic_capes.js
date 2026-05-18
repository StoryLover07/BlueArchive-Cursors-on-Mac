#!/usr/bin/env node
const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SOURCE_CAPES = {
  Regular: path.join(ROOT, "mousecape_output", "BlueArchive_Regular_STATIC.cape"),
  Millennium: path.join(ROOT, "mousecape_output", "BlueArchive_Millennium_STATIC.cape"),
};
const OUTPUT_DIR = path.join(ROOT, "mousecape_output", "diagnostics");

const DIAGNOSTICS = [
  ["Arrow", "com.apple.coregraphics.Arrow"],
  ["ArrowCtx", "com.apple.coregraphics.ArrowCtx"],
  ["IBeam", "com.apple.coregraphics.IBeam"],
  ["IBeamXOR", "com.apple.coregraphics.IBeamXOR"],
  ["IBeamHorizontal", "com.apple.cursor.26"],
  ["Link", "com.apple.cursor.2"],
  ["Pointing", "com.apple.cursor.13"],
  ["ResizeNS", "com.apple.cursor.23"],
  ["ResizeN", "com.apple.cursor.21"],
  ["ResizeS", "com.apple.cursor.22"],
  ["WindowN", "com.apple.cursor.31"],
  ["WindowNS", "com.apple.cursor.32"],
  ["WindowS", "com.apple.cursor.36"],
  ["Wait", "com.apple.coregraphics.Wait"],
  ["Busy", "com.apple.cursor.4"],
  ["CountingUp", "com.apple.cursor.14"],
  ["CountingDown", "com.apple.cursor.15"],
  ["CountingUpDown", "com.apple.cursor.16"],
];

function escapeXml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function findMatchingDictEnd(xml, dictStart) {
  const token = /<\/?dict>/g;
  token.lastIndex = dictStart;
  let depth = 0;
  let match;
  while ((match = token.exec(xml))) {
    if (match[0] === "<dict>") {
      depth += 1;
    } else {
      depth -= 1;
      if (depth === 0) return token.lastIndex;
    }
  }
  throw new Error("Could not find matching </dict>");
}

function cursorBlock(xml, identifier) {
  const key = `<key>${escapeXml(identifier)}</key>`;
  const keyStart = xml.indexOf(key);
  if (keyStart === -1) throw new Error(`Missing cursor id ${identifier}`);
  const dictStart = xml.indexOf("<dict>", keyStart + key.length);
  if (dictStart === -1) throw new Error(`Missing cursor dict for ${identifier}`);
  const dictEnd = findMatchingDictEnd(xml, dictStart);
  return { key, dict: xml.slice(dictStart, dictEnd) };
}

function capeXml({ author, identifier, name, cursorKey, cursorDict }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Author</key>
  <string>${escapeXml(author)}</string>
  <key>CapeName</key>
  <string>${escapeXml(name)}</string>
  <key>CapeVersion</key>
  <integer>1</integer>
  <key>Cloud</key>
  <false/>
  <key>Cursors</key>
  <dict>
    ${cursorKey}
${cursorDict.split("\n").map((line) => `    ${line}`).join("\n")}
  </dict>
  <key>HiDPI</key>
  <true/>
  <key>Identifier</key>
  <string>${escapeXml(identifier)}</string>
  <key>MinimumVersion</key>
  <integer>2</integer>
  <key>Version</key>
  <integer>2</integer>
</dict>
</plist>
`;
}

function lint(file) {
  childProcess.execFileSync("plutil", ["-lint", file], { stdio: "pipe" });
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

let written = 0;
for (const [theme, sourceCape] of Object.entries(SOURCE_CAPES)) {
  const xml = fs.readFileSync(sourceCape, "utf8");
  for (const [label, cursorId] of DIAGNOSTICS) {
    const block = cursorBlock(xml, cursorId);
    const fileName = `BlueArchive_${theme}_DIAG_${label}.cape`;
    const output = path.join(OUTPUT_DIR, fileName);
    fs.writeFileSync(output, capeXml({
      author: "makipom; diagnostic cape assembled from converted static output",
      identifier: `com.makipom.bluearchive.${theme.toLowerCase()}.diagnostic.${label.toLowerCase()}`,
      name: `Blue Archive ${theme} DIAG ${label}`,
      cursorKey: block.key,
      cursorDict: block.dict,
    }));
    lint(output);
    written += 1;
  }
}

console.log(`Wrote ${written} diagnostic capes to ${path.relative(ROOT, OUTPUT_DIR)}`);
