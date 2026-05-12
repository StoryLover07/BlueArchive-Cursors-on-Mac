#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "source_repos", "BlueArchive-Cursors");

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const MAC_CURSOR_IDS = {
  Arrow: "com.apple.coregraphics.Arrow",
  Text: "com.apple.coregraphics.IBeam",
  Wait: "com.apple.coregraphics.Wait",
  Link: "com.apple.cursor.2",
  Move: "com.apple.coregraphics.Move",
  Forbidden: "com.apple.cursor.3",
  Help: "com.apple.cursor.40",
  ResizeNS: "com.apple.cursor.23",
  ResizeEW: "com.apple.cursor.19",
  ResizeDiag1: "com.apple.cursor.34",
  ResizeDiag2: "com.apple.cursor.30",
};

const MAC_CURSOR_ID_ALIASES = {
  Arrow: [
    "com.apple.coregraphics.Arrow",
    "com.apple.coregraphics.ArrowCtx",
  ],
  Text: [
    "com.apple.coregraphics.IBeam",
    "com.apple.coregraphics.IBeamXOR",
    "com.apple.cursor.26",
  ],
  Wait: [
    "com.apple.coregraphics.Wait",
    "com.apple.cursor.4",
    "com.apple.cursor.14",
    "com.apple.cursor.15",
    "com.apple.cursor.16",
  ],
  Link: [
    "com.apple.cursor.2",
    "com.apple.cursor.13",
  ],
  Move: [
    "com.apple.coregraphics.Move",
    "com.apple.cursor.11",
    "com.apple.cursor.12",
    "com.apple.cursor.39",
  ],
  Forbidden: [
    "com.apple.cursor.3",
  ],
  Help: [
    "com.apple.cursor.40",
  ],
  ResizeNS: [
    "com.apple.cursor.23",
    "com.apple.cursor.21",
    "com.apple.cursor.22",
    "com.apple.cursor.31",
    "com.apple.cursor.32",
    "com.apple.cursor.36",
  ],
  ResizeEW: [
    "com.apple.cursor.19",
    "com.apple.cursor.17",
    "com.apple.cursor.18",
    "com.apple.cursor.27",
    "com.apple.cursor.28",
    "com.apple.cursor.38",
  ],
  ResizeDiag1: [
    "com.apple.cursor.34",
    "com.apple.cursor.33",
    "com.apple.cursor.35",
  ],
  ResizeDiag2: [
    "com.apple.cursor.30",
    "com.apple.cursor.29",
    "com.apple.cursor.37",
  ],
};

const THEMES = {
  Regular: {
    name: "Blue Archive Regular",
    identifier: "com.makipom.bluearchive.regular.mousecape",
    base: SOURCE,
    files: {
      Arrow: "normal.cur",
      Text: "text.ani",
      Wait: "loading.ani",
      Link: "link.cur",
      Move: "move.cur",
      Forbidden: "block.cur",
      Help: "help.cur",
      ResizeNS: "resizeNS.cur",
      ResizeEW: "resizeWE.cur",
      ResizeDiag1: "resizeDIAG1.cur",
      ResizeDiag2: "resizeDIAG2.cur",
    },
  },
  Millennium: {
    name: "Blue Archive Millennium",
    identifier: "com.makipom.bluearchive.millennium.mousecape",
    base: path.join(SOURCE, "Millennium Edition"),
    files: {
      Arrow: "millennium_base.cur",
      Text: "millennium_text.ani",
      Wait: "millennium_loading_v1.ani",
      Link: "millennium_link.cur",
      Move: "millennium_move.cur",
      Forbidden: "millennium_block.cur",
      Help: "millennium_help_rio.cur",
      ResizeNS: "millennium_NS.cur",
      ResizeEW: "millennium_EW.cur",
      ResizeDiag1: "millennium_diag1.cur",
      ResizeDiag2: "millennium_diag2.cur",
    },
    optional: {
      Background: "millennium_background_aris.ani",
    },
  },
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function pngEncode(image) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(image.width, 0);
  ihdr.writeUInt32BE(image.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const stride = image.width * 4;
  const raw = Buffer.alloc((stride + 1) * image.height);
  for (let y = 0; y < image.height; y++) {
    raw[y * (stride + 1)] = 0;
    image.rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  return Buffer.concat([PNG_SIG, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

function pngDecode(buffer, sourceName) {
  if (!buffer.subarray(0, 8).equals(PNG_SIG)) throw new Error(`${sourceName} is not a PNG`);
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  let palette = null;
  let transparency = null;
  while (offset + 8 <= buffer.length) {
    const size = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + size);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error(`${sourceName} uses unsupported interlaced PNG data`);
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "PLTE") {
      palette = [];
      for (let i = 0; i + 2 < data.length; i += 3) palette.push([data[i], data[i + 1], data[i + 2]]);
    } else if (type === "tRNS") {
      transparency = data;
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + size;
  }
  if (bitDepth !== 8 || ![2, 3, 6].includes(colorType)) {
    throw new Error(`${sourceName} uses unsupported PNG color type ${colorType} at ${bitDepth}bpp`);
  }
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const stride = width * channels;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const previous = Buffer.alloc(stride);
  const rgba = Buffer.alloc(width * height * 4);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++];
    const scan = Buffer.from(raw.subarray(pos, pos + stride));
    pos += stride;
    for (let i = 0; i < scan.length; i++) {
      const left = i >= channels ? scan[i - channels] : 0;
      const up = previous[i] || 0;
      const upLeft = i >= channels ? previous[i - channels] : 0;
      if (filter === 1) scan[i] = (scan[i] + left) & 255;
      else if (filter === 2) scan[i] = (scan[i] + up) & 255;
      else if (filter === 3) scan[i] = (scan[i] + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) scan[i] = (scan[i] + paeth(left, up, upLeft)) & 255;
      else if (filter !== 0) throw new Error(`${sourceName} has unsupported PNG filter ${filter}`);
    }
    scan.copy(previous);
    for (let x = 0; x < width; x++) {
      const src = x * channels;
      const dst = (y * width + x) * 4;
      if (colorType === 3) {
        const idx = scan[src];
        const color = palette && palette[idx] ? palette[idx] : [0, 0, 0];
        rgba[dst] = color[0];
        rgba[dst + 1] = color[1];
        rgba[dst + 2] = color[2];
        rgba[dst + 3] = transparency && idx < transparency.length ? transparency[idx] : 255;
      } else {
        rgba[dst] = scan[src];
        rgba[dst + 1] = scan[src + 1];
        rgba[dst + 2] = scan[src + 2];
        rgba[dst + 3] = channels === 4 ? scan[src + 3] : 255;
      }
    }
  }
  return { width, height, rgba };
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

function scaleImageNearest(image, factor) {
  const width = image.width * factor;
  const height = image.height * factor;
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const sy = Math.floor(y / factor);
    for (let x = 0; x < width; x++) {
      const sx = Math.floor(x / factor);
      image.rgba.copy(rgba, (y * width + x) * 4, (sy * image.width + sx) * 4, (sy * image.width + sx) * 4 + 4);
    }
  }
  return { width, height, rgba };
}

function stackFrames(frames) {
  const width = frames[0].width;
  const height = frames[0].height;
  const rgba = Buffer.alloc(width * height * frames.length * 4);
  frames.forEach((frame, index) => {
    for (let y = 0; y < height; y++) {
      frame.rgba.copy(
        rgba,
        ((index * height + y) * width) * 4,
        (y * width) * 4,
        (y * width + width) * 4,
      );
    }
  });
  return { width, height: height * frames.length, rgba };
}

function parseCurBuffer(buffer, sourceName) {
  if (buffer.readUInt16LE(0) !== 0 || buffer.readUInt16LE(2) !== 2) {
    throw new Error(`${sourceName} is not a Windows cursor resource`);
  }
  const count = buffer.readUInt16LE(4);
  const entries = [];
  for (let i = 0; i < count; i++) {
    const off = 6 + i * 16;
    entries.push({
      width: buffer[off] || 256,
      height: buffer[off + 1] || 256,
      hotspotX: buffer.readUInt16LE(off + 4),
      hotspotY: buffer.readUInt16LE(off + 6),
      size: buffer.readUInt32LE(off + 8),
      offset: buffer.readUInt32LE(off + 12),
    });
  }
  const sorted = entries.sort((a, b) => (a.width * a.height) - (b.width * b.height));
  const entry = sorted.find((e) => e.width === 32 && e.height === 32) || sorted[0];
  const retinaEntry = sorted.find((e) => e.width === entry.width * 2 && e.height === entry.height * 2);
  const image = decodeCursorImage(buffer.subarray(entry.offset, entry.offset + entry.size), sourceName);
  const retinaImage = retinaEntry
    ? decodeCursorImage(buffer.subarray(retinaEntry.offset, retinaEntry.offset + retinaEntry.size), `${sourceName}@2x`)
    : null;
  return { ...image, retinaImage, hotspotX: entry.hotspotX, hotspotY: entry.hotspotY };
}

function decodeCursorImage(data, sourceName) {
  if (data.subarray(0, 8).equals(PNG_SIG)) return pngDecode(data, sourceName);
  return decodeDib(data, sourceName);
}

function decodeDib(dib, sourceName) {
  const headerSize = dib.readUInt32LE(0);
  if (headerSize < 40) throw new Error(`${sourceName} has unsupported bitmap header`);
  const width = dib.readInt32LE(4);
  const storedHeight = dib.readInt32LE(8);
  const planes = dib.readUInt16LE(12);
  const bitDepth = dib.readUInt16LE(14);
  const compression = dib.readUInt32LE(16);
  if (planes !== 1 || bitDepth !== 32 || compression !== 0) {
    throw new Error(`${sourceName} uses unsupported DIB format: ${bitDepth}bpp compression=${compression}`);
  }
  const height = Math.abs(storedHeight) / 2;
  const topDown = storedHeight < 0;
  const pixelOffset = headerSize;
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const srcY = topDown ? y : height - 1 - y;
    for (let x = 0; x < width; x++) {
      const src = pixelOffset + (srcY * width + x) * 4;
      const dst = (y * width + x) * 4;
      rgba[dst] = dib[src + 2];
      rgba[dst + 1] = dib[src + 1];
      rgba[dst + 2] = dib[src];
      rgba[dst + 3] = dib[src + 3];
    }
  }
  return { width, height, rgba };
}

function walkRiffChunks(buffer, start, end) {
  const chunks = [];
  let offset = start;
  while (offset + 8 <= end) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const dataStart = offset + 8;
    const dataEnd = dataStart + size;
    chunks.push({ id, size, dataStart, dataEnd, listType: id === "LIST" ? buffer.toString("ascii", dataStart, dataStart + 4) : null });
    offset = dataEnd + (size % 2);
  }
  return chunks;
}

function parseAniBuffer(buffer, sourceName) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "ACON") {
    throw new Error(`${sourceName} is not an animated cursor`);
  }
  const meta = { frameCountDeclared: 0, stepCount: 0, defaultJiffies: 6, rates: [], sequence: [] };
  const frames = [];
  for (const ch of walkRiffChunks(buffer, 12, buffer.length)) {
    if (ch.id === "anih") {
      meta.frameCountDeclared = buffer.readUInt32LE(ch.dataStart + 4);
      meta.stepCount = buffer.readUInt32LE(ch.dataStart + 8);
      meta.defaultJiffies = buffer.readUInt32LE(ch.dataStart + 28) || 6;
      meta.flags = buffer.readUInt32LE(ch.dataStart + 32);
    } else if (ch.id === "rate") {
      for (let o = ch.dataStart; o + 4 <= ch.dataEnd; o += 4) meta.rates.push(buffer.readUInt32LE(o));
    } else if (ch.id === "seq ") {
      for (let o = ch.dataStart; o + 4 <= ch.dataEnd; o += 4) meta.sequence.push(buffer.readUInt32LE(o));
    } else if (ch.id === "LIST" && ch.listType === "fram") {
      for (const sub of walkRiffChunks(buffer, ch.dataStart + 4, ch.dataEnd)) {
        if (sub.id === "icon") {
          frames.push(parseCurBuffer(buffer.subarray(sub.dataStart, sub.dataEnd), `${sourceName}#${frames.length}`));
        }
      }
    }
  }
  const order = meta.sequence.length ? meta.sequence : frames.map((_, i) => i);
  const ordered = order.map((i) => frames[i]).filter(Boolean);
  const firstRate = meta.rates[0] || meta.defaultJiffies || 6;
  return {
    frames: ordered,
    frameDuration: firstRate / 60,
    timingJiffies: meta.rates.length ? meta.rates : [meta.defaultJiffies],
    sourceFrameCount: frames.length,
    sequenceLength: ordered.length,
    variableTiming: new Set(meta.rates).size > 1,
  };
}

function writePlistValue(value, indent = "  ") {
  if (Buffer.isBuffer(value)) {
    return `${indent}<data>\n${indent}  ${value.toString("base64").replace(/(.{68})/g, "$1\n" + indent + "  ").trim()}\n${indent}</data>\n`;
  }
  if (Array.isArray(value)) {
    return `${indent}<array>\n${value.map((v) => writePlistValue(v, indent + "  ")).join("")}${indent}</array>\n`;
  }
  if (value && typeof value === "object") {
    return `${indent}<dict>\n${Object.entries(value).map(([k, v]) => `${indent}  <key>${escapeXml(k)}</key>\n${writePlistValue(v, indent + "  ")}`).join("")}${indent}</dict>\n`;
  }
  if (typeof value === "boolean") return `${indent}<${value ? "true" : "false"}/>\n`;
  if (typeof value === "number") return Number.isInteger(value) ? `${indent}<integer>${value}</integer>\n` : `${indent}<real>${value}</real>\n`;
  return `${indent}<string>${escapeXml(String(value))}</string>\n`;
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function plist(dictionary) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n${writePlistValue(dictionary, "")}</plist>\n`;
}

function convertOne(themeName, role, fileName, theme, report, options = {}) {
  const src = path.join(theme.base, fileName);
  const ext = path.extname(fileName).toLowerCase();
  const assetRoot = options.staticOnly ? "converted_assets_static" : "converted_assets";
  const frameRoot = options.staticOnly ? "generated_frames_static" : "generated_frames";
  const assetDir = path.join(ROOT, assetRoot, themeName, role);
  const frameDir = path.join(ROOT, frameRoot, themeName, role);
  ensureDir(assetDir);
  ensureDir(frameDir);

  let frames;
  let frameDuration = 1;
  let timing = null;
  let variableTiming = false;
  let sourceFrameCount = 1;
  if (ext === ".cur") {
    frames = [parseCurBuffer(fs.readFileSync(src), fileName)];
  } else if (ext === ".ani") {
    const ani = parseAniBuffer(fs.readFileSync(src), fileName);
    frames = ani.frames;
    frameDuration = ani.frameDuration;
    timing = ani.timingJiffies;
    variableTiming = ani.variableTiming;
    sourceFrameCount = ani.sourceFrameCount;
  } else {
    throw new Error(`Unsupported file type: ${fileName}`);
  }

  let status = "preserved";
  let note = "Static cursor preserved.";
  if (frames.length > 1) {
    if (frames.length > 24) {
      frames = frames.slice(0, 24);
      status = "approximated";
      note = "Mousecape registers a maximum of 24 animation frames; extra frames were omitted.";
    } else if (variableTiming) {
      status = "approximated";
      note = "Mousecape uses one frame duration per cursor; variable ANI frame rates were normalized to the first timing value.";
    } else {
      note = "Animation frames and timing preserved using Mousecape vertical frame stacking.";
    }
  }

  if (options.staticOnly && frames.length > 1) {
    frames = [frames[0]];
    frameDuration = 1;
    status = "static-disabled";
    note = "Animation disabled for STATIC cape compatibility; first source frame is used.";
  }

  frames.forEach((frame, index) => {
    fs.writeFileSync(path.join(frameDir, `${String(index + 1).padStart(3, "0")}.png`), pngEncode(frame));
    fs.writeFileSync(path.join(frameDir, `${String(index + 1).padStart(3, "0")}@2x.png`), pngEncode(retinaFrame(frame)));
  });

  const stack1x = stackFrames(frames);
  const stack2x = stackFrames(frames.map((f) => retinaFrame(f)));
  const baseName = path.basename(fileName, ext);
  const png1x = pngEncode(stack1x);
  const png2x = pngEncode(stack2x);
  fs.writeFileSync(path.join(assetDir, `${baseName}.png`), png1x);
  fs.writeFileSync(path.join(assetDir, `${baseName}@2x.png`), png2x);

  const first = frames[0];
  report.hotspots[themeName][role] = {
    sourceFile: fileName,
    macCursorId: MAC_CURSOR_IDS[role] || null,
    hotspotX: first.hotspotX,
    hotspotY: first.hotspotY,
    pointsWide: first.width,
    pointsHigh: first.height,
    frameCount: frames.length,
    frameDurationSeconds: frameDuration,
  };
  report.animations.push({
    theme: themeName,
    output: options.staticOnly ? "STATIC" : "animated",
    role,
    sourceFile: fileName,
    sourceFrameCount,
    outputFrameCount: frames.length,
    frameDurationSeconds: frameDuration,
    timingJiffies: timing,
    status,
    note,
  });

  return {
    HotSpotX: first.hotspotX,
    HotSpotY: first.hotspotY,
    PointsWide: first.width,
    PointsHigh: first.height,
    FrameCount: frames.length,
    FrameDuration: frameDuration,
    Representations: [png1x, png2x],
  };
}

function retinaFrame(frame) {
  if (frame.retinaImage && frame.retinaImage.width === frame.width * 2 && frame.retinaImage.height === frame.height * 2) {
    return frame.retinaImage;
  }
  return scaleImageNearest(frame, 2);
}

function makeCape(theme, themeName, cursors, suffix) {
  const isStatic = suffix === "STATIC";
  return {
    Version: 2,
    MinimumVersion: 2,
    Author: "makipom; converted for Mousecape",
    Identifier: `${theme.identifier}${isStatic ? ".static" : ""}`,
    CapeName: `${theme.name}${isStatic ? " STATIC" : ""}`,
    CapeVersion: isStatic ? 2 : 1,
    Cloud: false,
    HiDPI: true,
    Cursors: cursors,
  };
}

function main() {
  const report = { hotspots: { Regular: {}, Millennium: {} }, animations: [] };
  const staticReport = { hotspots: { Regular: {}, Millennium: {} }, animations: [] };
  const mapping = {};

  for (const [themeName, theme] of Object.entries(THEMES)) {
    const cursors = {};
    const staticCursors = {};
    mapping[themeName] = {};
    for (const [role, fileName] of Object.entries(theme.files)) {
      const cursorId = MAC_CURSOR_IDS[role];
      cursors[cursorId] = convertOne(themeName, role, fileName, theme, report);
      const staticCursor = convertOne(themeName, role, fileName, theme, staticReport, { staticOnly: true });
      for (const alias of MAC_CURSOR_ID_ALIASES[role] || [cursorId]) {
        staticCursors[alias] = staticCursor;
      }
      mapping[themeName][role] = {
        macCursorId: cursorId,
        staticMacCursorIds: MAC_CURSOR_ID_ALIASES[role] || [cursorId],
        sourceFile: fileName,
        convertedAssetDirectory: `converted_assets/${themeName}/${role}`,
        staticAssetDirectory: `converted_assets_static/${themeName}/${role}`,
        generatedFrameDirectory: `generated_frames/${themeName}/${role}`,
        staticFrameDirectory: `generated_frames_static/${themeName}/${role}`,
      };
    }
    fs.writeFileSync(
      path.join(ROOT, "mousecape_output", `BlueArchive_${themeName}.cape`),
      plist(makeCape(theme, themeName, cursors, "animated")),
    );
    fs.writeFileSync(
      path.join(ROOT, "mousecape_output", `BlueArchive_${themeName}_STATIC.cape`),
      plist(makeCape(theme, themeName, staticCursors, "STATIC")),
    );
  }

  fs.writeFileSync(path.join(ROOT, "mapping.json"), JSON.stringify(mapping, null, 2) + "\n");
  fs.writeFileSync(path.join(ROOT, "docs", "hotspots.json"), JSON.stringify(report.hotspots, null, 2) + "\n");
  fs.writeFileSync(path.join(ROOT, "docs", "animation_report.json"), JSON.stringify(report.animations, null, 2) + "\n");
  fs.writeFileSync(path.join(ROOT, "docs", "hotspots_static.json"), JSON.stringify(staticReport.hotspots, null, 2) + "\n");
  fs.writeFileSync(path.join(ROOT, "docs", "animation_report_static.json"), JSON.stringify(staticReport.animations, null, 2) + "\n");
}

main();
