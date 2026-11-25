export const LEGACY_CHARACTER_FALLBACKS = {
  drago: "kancil_kiko",
  robo: "bobi",
  luna: "kelinci_cici",
  leo: "beruang_bobi",
};

export const CHARACTER_ROSTER = [
  {
    id: "kiko",
    name: "Kiko",
    title: "Petualang Pemberani",
    specialty: "Lincah & Penjelajah Pulau",
    desc: "Selalu bersemangat menjelajahi jalur baru dan menemukan harta karun tersembunyi.",
    accentColor: "#ef4444",
    badgeBg: "#fee2e2",
    badgeText: "#991b1b",
    renderMode: "image",
    cropBox: { x0: 0.01, x1: 0.268, y0: 0.14, y1: 0.9 },
    motionProfile: { bounce: 1.05, lean: 1.15, tempo: 1.08, squash: 1.0 },
    eyeOverlay: { x: 0.52, y: 0.34, w: 0.36, h: 0.12, skin: "#f5b88c" },
  },
  {
    id: "cici",
    name: "Cici",
    title: "Penjelajah Ceria",
    specialty: "Lompatan Tinggi & Pencari Bintang",
    desc: "Gesit melompati rintangan tinggi dan jeli mengumpulkan bintang pengetahuan.",
    accentColor: "#ec4899",
    badgeBg: "#fce7f3",
    badgeText: "#9d174d",
    renderMode: "image",
    cropBox: { x0: 0.255, x1: 0.505, y0: 0.16, y1: 0.9 },
    motionProfile: { bounce: 1.25, lean: 0.95, tempo: 1.1, squash: 1.08 },
    eyeOverlay: { x: 0.53, y: 0.36, w: 0.36, h: 0.12, skin: "#f6bc94" },
  },
  {
    id: "bobi",
    name: "Bobi",
    title: "Ahli Strategi",
    specialty: "Cerdas & Pemecah Teka-Teki",
    desc: "Teliti mengamati petunjuk lingkungan dan membuka gerbang rahasia dengan tepat.",
    accentColor: "#2563eb",
    badgeBg: "#dbeafe",
    badgeText: "#1e40af",
    renderMode: "image",
    cropBox: { x0: 0.495, x1: 0.728, y0: 0.16, y1: 0.9 },
    motionProfile: { bounce: 0.92, lean: 0.9, tempo: 0.96, squash: 0.95 },
    eyeOverlay: { x: 0.5, y: 0.36, w: 0.38, h: 0.12, skin: "#f6bc94" },
  },
  {
    id: "prof_panda",
    name: "Prof. Panda",
    title: "Mentor Bijaksana",
    specialty: "Penjaga Ilmu Pengetahuan",
    desc: "Membawa buku ensiklopedia ajaib dan siap menaklukkan setiap penjaga gerbang.",
    accentColor: "#7c3aed",
    badgeBg: "#ede9fe",
    badgeText: "#5b21b6",
    renderMode: "image",
    cropBox: { x0: 0.66, x1: 0.965, y0: 0.2, y1: 0.89 },
    flipSourceX: true,
    preserveWhiteFur: true,
    hipRatio: 0.8,
    motionProfile: { bounce: 0.86, lean: 0.78, tempo: 0.9, squash: 1.12 },
    eyeOverlay: { x: 0.5, y: 0.35, w: 0.38, h: 0.12, skin: "#2d3748" },
  },
  {
    id: "kancil_kiko",
    name: "Kiko si Kancil",
    title: "Kancil Cerdik",
    specialty: "Lincah & Cepat Berhitung",
    desc: "Kancil ramah bertanduk mungil dan bersyal merah yang selalu sigap melompat.",
    accentColor: "#ea580c",
    badgeBg: "#ffedd5",
    badgeText: "#9a3412",
    renderMode: "animal_rig",
    species: "kancil",
    motionProfile: { bounce: 1.15, lean: 1.18, tempo: 1.12, squash: 1.04 },
  },
  {
    id: "beruang_bobi",
    name: "Bobi si Beruang",
    title: "Beruang Tangguh",
    specialty: "Kuat & Pantang Menyerah",
    desc: "Beruang cokelat ramah berrompi biru petualang yang penuh semangat.",
    accentColor: "#0284c7",
    badgeBg: "#e0f2fe",
    badgeText: "#075985",
    renderMode: "animal_rig",
    species: "beruang",
    motionProfile: { bounce: 0.88, lean: 0.85, tempo: 0.92, squash: 1.15 },
  },
  {
    id: "kelinci_cici",
    name: "Cici si Kelinci",
    title: "Kelinci Gesit",
    specialty: "Cepat & Sangat Teliti",
    desc: "Kelinci lucu bertelinga panjang dan berbaju ungu yang gemar melompat ceria.",
    accentColor: "#9333ea",
    badgeBg: "#f3e8ff",
    badgeText: "#6b21a8",
    renderMode: "animal_rig",
    species: "kelinci",
    motionProfile: { bounce: 1.24, lean: 0.98, tempo: 1.1, squash: 1.1 },
  },
  {
    id: "panda_tutor",
    name: "Tutor Panda",
    title: "Panda Klasik Bijak",
    specialty: "Pendamping Belajar Ramah",
    desc: "Panda klasik berkacamata emas dengan jas hijau dan dasi merah kebanggaannya.",
    accentColor: "#16a34a",
    badgeBg: "#dcfce7",
    badgeText: "#166534",
    renderMode: "animal_rig",
    species: "panda_classic",
    motionProfile: { bounce: 0.85, lean: 0.8, tempo: 0.9, squash: 1.12 },
  },
];

export const ANIMATION_STATES = [
  { key: "idle", label: "Diam", fps: 7, repeat: -1 },
  { key: "walk", label: "Berjalan", fps: 11, repeat: -1 },
  { key: "run", label: "Berlari", fps: 14, repeat: -1 },
  { key: "jump", label: "Melompat", fps: 12, repeat: 0 },
  { key: "fall", label: "Melayang", fps: 9, repeat: -1 },
  { key: "attack", label: "Menyerang", fps: 16, repeat: 0 },
  { key: "hurt", label: "Terkena Hit", fps: 12, repeat: 0 },
  { key: "victory", label: "Menang", fps: 11, repeat: -1 },
  { key: "swim", label: "Berenang", fps: 11, repeat: -1 },
  { key: "swim_idle", label: "Mengambang", fps: 7, repeat: -1 },
  { key: "climb", label: "Memanjat", fps: 10, repeat: -1 },
];

const SHEET_COLS = 8;
const FRAME_W = 192;
const FRAME_H = 224;
const PORTRAIT_W = 360;
const PORTRAIT_H = 420;

class CharacterAssetManager {
  constructor() {
    this.portraits = new Map();
    this.sheetCanvases = new Map();
    this.portraitUrls = new Map();
    this.lineupImage = null;
    this.lineupLoadPromise = null;
  }

  resolveCharacterId(charId) {
    const raw = String(charId || "kiko");
    const mapped = LEGACY_CHARACTER_FALLBACKS[raw] || raw;
    const exists = CHARACTER_ROSTER.some((c) => c.id === mapped);
    return exists ? mapped : CHARACTER_ROSTER[0].id;
  }

  getCharacterMeta(charId) {
    const resolved = this.resolveCharacterId(charId);
    return (
      CHARACTER_ROSTER.find((c) => c.id === resolved) || CHARACTER_ROSTER[0]
    );
  }

  preloadAssets(scene) {
    scene.load.image("heroes_lineup_src", "./assets/ui/heroes-lineup.jpg");
  }

  ensureLineupImageLoaded() {
    if (
      this.lineupImage &&
      this.lineupImage.complete &&
      this.lineupImage.naturalWidth > 0
    ) {
      return Promise.resolve(this.lineupImage);
    }
    if (this.lineupLoadPromise) return this.lineupLoadPromise;

    this.lineupLoadPromise = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.lineupImage = img;
        CHARACTER_ROSTER.filter((c) => c.renderMode === "image").forEach(
          (c) => {
            this.portraits.delete(c.id);
            this.sheetCanvases.delete(c.id);
            this.portraitUrls.delete(c.id);
          },
        );
        resolve(img);
      };
      img.onerror = () => {
        if (!img.dataset.triedPng) {
          img.dataset.triedPng = "1";
          img.src = "./assets/ui/heroes-lineup.png";
        } else {
          resolve(null);
        }
      };
      img.src = "./assets/ui/heroes-lineup.jpg";
    });

    return this.lineupLoadPromise;
  }

  extractCleanPortrait(charMeta, sourceImg) {
    const sw = sourceImg.naturalWidth || sourceImg.width;
    const sh = sourceImg.naturalHeight || sourceImg.height;
    const sx = Math.floor(sw * charMeta.cropBox.x0);
    const sy = Math.floor(sh * charMeta.cropBox.y0);
    const cw = Math.max(
      20,
      Math.floor(sw * (charMeta.cropBox.x1 - charMeta.cropBox.x0)),
    );
    const ch = Math.max(
      20,
      Math.floor(sh * (charMeta.cropBox.y1 - charMeta.cropBox.y0)),
    );

    const rawCanvas = document.createElement("canvas");
    rawCanvas.width = cw;
    rawCanvas.height = ch;
    const rCtx = rawCanvas.getContext("2d");
    rCtx.drawImage(sourceImg, sx, sy, cw, ch, 0, 0, cw, ch);

    if (charMeta.id === "prof_panda") {
      rCtx.fillStyle = "#ffffff";
      rCtx.fillRect(0, 0, Math.floor(cw * 0.08), Math.floor(ch * 0.42));
    }

    const imgData = rCtx.getImageData(0, 0, cw, ch);
    const data = imgData.data;
    const visited = new Uint8Array(cw * ch);
    const queue = new Int32Array(cw * ch);
    let head = 0;
    let tail = 0;

    const preserveWhite = Boolean(charMeta.preserveWhiteFur);
    const floorBandY = Math.floor(ch * (preserveWhite ? 0.86 : 0.78));

    const isBgPixel = (x, y, idx) => {
      const p = idx * 4;
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const neutral = max - min < (preserveWhite ? 14 : 20);
      if (preserveWhite) {
        if (r > 245 && g > 245 && b > 245) return true;
        if (y >= floorBandY && neutral && min > 170) return true;
        return false;
      }
      if (r > 232 && g > 232 && b > 232) return true;
      if (y >= floorBandY && neutral && min > 168) return true;
      if (neutral && min > 218) return true;
      return false;
    };

    const pushIfBg = (x, y) => {
      if (x < 0 || x >= cw || y < 0 || y >= ch) return;
      const idx = y * cw + x;
      if (visited[idx]) return;
      visited[idx] = 1;
      if (isBgPixel(x, y, idx)) queue[tail++] = idx;
    };

    for (let x = 0; x < cw; x++) {
      pushIfBg(x, 0);
      pushIfBg(x, ch - 1);
    }
    for (let y = 0; y < ch; y++) {
      pushIfBg(0, y);
      pushIfBg(cw - 1, y);
    }

    while (head < tail) {
      const idx = queue[head++];
      data[idx * 4 + 3] = 0;
      const x = idx % cw;
      const y = (idx - x) / cw;
      pushIfBg(x - 1, y);
      pushIfBg(x + 1, y);
      pushIfBg(x, y - 1);
      pushIfBg(x, y + 1);
    }

    for (let y = 1; y < ch - 1; y++) {
      for (let x = 1; x < cw - 1; x++) {
        const idx = y * cw + x;
        const p = idx * 4;
        if (data[p + 3] === 0) continue;
        const nearTransparent =
          data[(idx - 1) * 4 + 3] === 0 ||
          data[(idx + 1) * 4 + 3] === 0 ||
          data[(idx - cw) * 4 + 3] === 0 ||
          data[(idx + cw) * 4 + 3] === 0;
        const max = Math.max(data[p], data[p + 1], data[p + 2]);
        const min = Math.min(data[p], data[p + 1], data[p + 2]);
        if (preserveWhite) {
          if (nearTransparent && max - min < 12 && min > 236) data[p + 3] = 95;
        } else if (nearTransparent && max - min < 22 && min > 185) {
          data[p + 3] = 0;
        }
      }
    }

    rCtx.putImageData(imgData, 0, 0);

    let minX = cw;
    let minY = ch;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        if (data[(y * cw + x) * 4 + 3] > 30) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX <= minX || maxY <= minY) {
      return this.buildFallbackHumanPortrait(charMeta.id);
    }

    const trimW = maxX - minX + 1;
    const trimH = maxY - minY + 1;
    const out = document.createElement("canvas");
    out.width = PORTRAIT_W;
    out.height = PORTRAIT_H;
    const oCtx = out.getContext("2d");
    oCtx.imageSmoothingEnabled = true;
    oCtx.imageSmoothingQuality = "high";

    const scale = Math.min(
      (PORTRAIT_W - 28) / trimW,
      (PORTRAIT_H - 32) / trimH,
    );
    const dw = trimW * scale;
    const dh = trimH * scale;
    const dx = (PORTRAIT_W - dw) / 2;
    const dy = PORTRAIT_H - 12 - dh;

    oCtx.save();
    if (charMeta.flipSourceX) {
      oCtx.translate(PORTRAIT_W, 0);
      oCtx.scale(-1, 1);
    }
    oCtx.drawImage(rawCanvas, minX, minY, trimW, trimH, dx, dy, dw, dh);
    oCtx.restore();
    return out;
  }

  buildFallbackHumanPortrait(charId) {
    const out = document.createElement("canvas");
    out.width = PORTRAIT_W;
    out.height = PORTRAIT_H;
    const ctx = out.getContext("2d");
    const map = {
      kiko: { top: "#ef4444" },
      cici: { top: "#ec4899" },
      bobi: { top: "#3b82f6" },
      prof_panda: { top: "#7c3aed" },
    };
    const p = map[charId] || map.kiko;
    ctx.save();
    ctx.translate(PORTRAIT_W / 2, PORTRAIT_H * 0.62);
    ctx.scale(2, 2);
    ctx.fillStyle = p.top;
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-24, -4, 48, 52, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = charId === "prof_panda" ? "#ffffff" : "#fed7aa";
    ctx.beginPath();
    ctx.arc(0, -34, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return out;
  }

  computeKinematics(stateKey, f, profile) {
    const t = f / SHEET_COLS;
    const phase = t * Math.PI * 2;
    const bounce = profile?.bounce || 1;
    const lean = profile?.lean || 1;
    const sq = profile?.squash || 1;

    const k = {
      shiftX: 0,
      bobY: 0,
      bodyTilt: 0,
      headTilt: 0,
      headBobY: 0,
      scaleX: 1,
      scaleY: 1,
      leftLegRot: 0,
      rightLegRot: 0,
      leftLegLift: 0,
      rightLegLift: 0,
      leftArmRot: 0.16,
      rightArmRot: -0.16,
      earLag: 0,
      tailWag: Math.sin(phase) * 0.22,
      scarfWave: Math.sin(phase) * 0.16,
      blink: false,
      expression: "happy",
      shadowScale: 1,
      hideShadow: false,
      swimStroke: 0,
    };

    if (stateKey === "idle") {
      const breath = Math.sin(phase);
      k.bobY = breath * 1.8;
      k.scaleY = 1 + breath * 0.032 * sq;
      k.scaleX = 1 - breath * 0.018 * sq;
      k.headTilt = Math.sin(phase - 0.6) * 0.055;
      k.headBobY = Math.sin(phase - 0.5) * 1.2;
      k.earLag = Math.sin(phase - 1.0) * 0.12;
      k.tailWag = Math.sin(phase * 2) * 0.28;
      k.leftArmRot = 0.14 + breath * 0.07;
      k.rightArmRot = -0.14 - breath * 0.07;
      k.blink = f === 5;
      k.expression = f === 3 || f === 4 ? "cheer" : "happy";
    } else if (stateKey === "walk") {
      const s = Math.sin(phase);
      const stepBounce = Math.abs(s);
      k.bobY = -stepBounce * 4.8 * bounce;
      k.bodyTilt = (0.05 + s * 0.035) * lean;
      k.headTilt = -s * 0.04;
      k.scaleY = 1 + (stepBounce - 0.4) * 0.038 * sq;
      k.scaleX = 1 - (stepBounce - 0.4) * 0.026 * sq;
      k.leftLegRot = s * 0.48;
      k.rightLegRot = -s * 0.48;
      k.leftLegLift = Math.max(0, s) * 6;
      k.rightLegLift = Math.max(0, -s) * 6;
      k.leftArmRot = -s * 0.46;
      k.rightArmRot = s * 0.46;
      k.earLag = -0.1 - stepBounce * 0.16;
      k.tailWag = s * 0.42;
      k.scarfWave = -0.24 + s * 0.18;
      k.shadowScale = 1 - stepBounce * 0.12;
    } else if (stateKey === "run") {
      const s = Math.sin(phase);
      const stepBounce = Math.abs(s);
      k.bobY = -stepBounce * 7.2 * bounce;
      k.bodyTilt = (0.15 + s * 0.045) * lean;
      k.headTilt = -0.05 - s * 0.035;
      k.scaleX = 1.04;
      k.scaleY = 0.98 + stepBounce * 0.05;
      k.leftLegRot = s * 0.72;
      k.rightLegRot = -s * 0.72;
      k.leftLegLift = Math.max(0, s) * 9;
      k.rightLegLift = Math.max(0, -s) * 9;
      k.leftArmRot = -s * 0.76;
      k.rightArmRot = s * 0.76;
      k.earLag = -0.32 - stepBounce * 0.2;
      k.tailWag = -0.26 + s * 0.44;
      k.scarfWave = -0.52 + s * 0.24;
      k.shadowScale = 0.88 - stepBounce * 0.15;
      k.expression = "focused";
    } else if (stateKey === "jump") {
      if (f === 0) {
        k.bobY = 5.2;
        k.scaleX = 1.15 * sq;
        k.scaleY = 0.85 / sq;
        k.bodyTilt = 0.08;
        k.earLag = 0.22;
        k.leftArmRot = 0.55;
        k.rightArmRot = -0.55;
      } else if (f <= 4) {
        const lift = Math.sin(((f - 1) / 4) * Math.PI * 0.85);
        k.bobY = -5 - lift * 9 * bounce;
        k.scaleX = 0.92;
        k.scaleY = 1.1;
        k.bodyTilt = -0.05;
        k.leftLegRot = 0.4;
        k.rightLegRot = -0.34;
        k.leftLegLift = 8.5;
        k.rightLegLift = 4.5;
        k.leftArmRot = -0.82;
        k.rightArmRot = 0.7;
        k.earLag = 0.26;
        k.shadowScale = 0.62;
        k.expression = "cheer";
      } else {
        const land = f === 7;
        k.bobY = land ? 4.4 : -1.5;
        k.scaleX = land ? 1.14 : 0.98;
        k.scaleY = land ? 0.86 : 1.02;
        k.earLag = land ? 0.3 : -0.16;
        k.shadowScale = land ? 1.08 : 0.76;
      }
    } else if (stateKey === "fall") {
      const s = Math.sin(phase);
      k.bobY = -3.5 + s * 2.2;
      k.bodyTilt = 0.06;
      k.scaleX = 1.03;
      k.scaleY = 0.96;
      k.leftLegRot = -0.22 + s * 0.1;
      k.rightLegRot = 0.22 - s * 0.1;
      k.leftArmRot = -0.92 + s * 0.12;
      k.rightArmRot = 0.92 - s * 0.12;
      k.earLag = -0.38 + s * 0.08;
      k.scarfWave = -0.42;
      k.shadowScale = 0.66;
    } else if (stateKey === "swim") {

      const s = Math.sin(phase);
      const c = Math.cos(phase);
      k.hideShadow = true;
      k.bobY = -10 + s * 4.2;
      k.bodyTilt = 0.56 + c * 0.1;
      k.headTilt = -0.34 - c * 0.06;
      k.scaleX = 1.04 + s * 0.03;
      k.scaleY = 0.96 - s * 0.03;
      k.leftLegRot = 0.42 + Math.sin(phase * 2) * 0.52;
      k.rightLegRot = 0.42 - Math.sin(phase * 2) * 0.52;
      k.leftLegLift = 6 + Math.max(0, Math.sin(phase * 2)) * 5;
      k.rightLegLift = 6 + Math.max(0, -Math.sin(phase * 2)) * 5;
      k.leftArmRot = -1.25 + s * 1.15;
      k.rightArmRot = -0.35 - s * 1.15;
      k.earLag = -0.55 + s * 0.16;
      k.tailWag = Math.sin(phase * 2) * 0.52;
      k.scarfWave = -0.68 + s * 0.22;
      k.swimStroke = s;
      k.expression = "focused";
    } else if (stateKey === "swim_idle") {

      const s = Math.sin(phase);
      k.hideShadow = true;
      k.bobY = -8 + s * 4.5;
      k.bodyTilt = 0.12 + s * 0.06;
      k.headTilt = -0.06 - s * 0.04;
      k.scaleY = 1 + s * 0.025;
      k.scaleX = 1 - s * 0.02;
      k.leftLegRot = s * 0.34;
      k.rightLegRot = -s * 0.34;
      k.leftLegLift = 5;
      k.rightLegLift = 5;
      k.leftArmRot = -0.55 + Math.cos(phase) * 0.38;
      k.rightArmRot = 0.55 - Math.cos(phase) * 0.38;
      k.earLag = -0.22 + s * 0.14;
      k.tailWag = s * 0.36;
      k.scarfWave = -0.28 + s * 0.18;
      k.blink = f === 6;
      k.expression = "happy";
    } else if (stateKey === "climb") {

      const s = Math.sin(phase);
      k.hideShadow = true;
      k.bobY = -4 - Math.abs(s) * 4.5;
      k.shiftX = s * 3.5;
      k.bodyTilt = s * 0.08;
      k.headTilt = -s * 0.05;
      k.leftLegRot = -s * 0.35;
      k.rightLegRot = s * 0.35;
      k.leftLegLift = Math.max(0, s) * 9;
      k.rightLegLift = Math.max(0, -s) * 9;
      k.leftArmRot = -1.6 + s * 0.65;
      k.rightArmRot = 1.6 + s * 0.65;
      k.earLag = 0.14 + Math.abs(s) * 0.14;
      k.tailWag = s * 0.35;
      k.expression = "focused";
    } else if (stateKey === "attack") {
      if (f <= 1) {
        k.shiftX = -5.5;
        k.bodyTilt = -0.12;
        k.rightArmRot = -1.05;
      } else if (f <= 5) {
        k.shiftX = 8.5;
        k.bodyTilt = 0.16;
        k.scaleX = 1.09;
        k.scaleY = 0.95;
        k.rightArmRot = 1.1;
        k.leftArmRot = -0.55;
        k.expression = "focused";
      } else {
        k.shiftX = 2.5;
        k.bodyTilt = 0.05;
      }
    } else if (stateKey === "hurt") {
      k.shiftX = f % 2 === 1 ? -6.5 : -2.5;
      k.bodyTilt = -0.2;
      k.headTilt = -0.14;
      k.scaleX = 0.94;
      k.scaleY = 1.05;
      k.leftArmRot = -0.75;
      k.rightArmRot = 0.75;
      k.earLag = 0.32;
      k.expression = "hurt";
    } else if (stateKey === "victory") {
      const hop = Math.abs(Math.sin(phase));
      k.bobY = -hop * 10 * bounce;
      k.bodyTilt = Math.sin(phase) * 0.08;
      k.headTilt = Math.sin(phase) * 0.09;
      k.scaleY = 1 + hop * 0.055;
      k.scaleX = 1 - hop * 0.028;
      k.leftLegRot = -hop * 0.24;
      k.rightLegRot = hop * 0.24;
      k.leftLegLift = hop * 6.5;
      k.rightLegLift = hop * 6.5;
      k.leftArmRot = -1.05 + Math.sin(phase * 2) * 0.22;
      k.rightArmRot = 1.05 - Math.sin(phase * 2) * 0.22;
      k.earLag = -0.18 + hop * 0.3;
      k.tailWag = Math.sin(phase * 2) * 0.5;
      k.shadowScale = 1 - hop * 0.25;
      k.expression = "joy";
    }

    return k;
  }

  drawAnimalRigCharacter(ctx, species, cx, groundY, scale, k, stateKey, f) {
    const specs = {
      kancil: {
        stroke: "#5c2808",
        furLight: "#fdba74",
        furMid: "#f97316",
        furDark: "#c2410c",
        belly: "#fff7ed",
        outfitTop: "#ef4444",
        outfitBot: "#b91c1c",
        pants: "#78350f",
        shoeTop: "#7c2d12",
        shoeBot: "#451a03",
        bodyW: 27,
        bodyH: 28,
        headRx: 20,
        headRy: 18,
      },
      beruang: {
        stroke: "#43200a",
        furLight: "#d9915b",
        furMid: "#b56734",
        furDark: "#7c3f18",
        belly: "#fef3c7",
        outfitTop: "#3b82f6",
        outfitBot: "#1d4ed8",
        pants: "#1e3a8a",
        shoeTop: "#78350f",
        shoeBot: "#451a03",
        bodyW: 34,
        bodyH: 31,
        headRx: 24,
        headRy: 21,
      },
      kelinci: {
        stroke: "#4c2c69",
        furLight: "#ffffff",
        furMid: "#f8fafc",
        furDark: "#dbe4f0",
        belly: "#fdf2f8",
        outfitTop: "#a855f7",
        outfitBot: "#7e22ce",
        pants: "#6b21a8",
        shoeTop: "#f472b6",
        shoeBot: "#db2777",
        bodyW: 27,
        bodyH: 28,
        headRx: 21,
        headRy: 18.5,
      },
      panda_classic: {
        stroke: "#1e293b",
        furLight: "#ffffff",
        furMid: "#f1f5f9",
        furDark: "#cbd5e1",
        belly: "#f8fafc",
        outfitTop: "#22c55e",
        outfitBot: "#15803d",
        pants: "#334155",
        shoeTop: "#334155",
        shoeBot: "#0f172a",
        bodyW: 33,
        bodyH: 30,
        headRx: 23.5,
        headRy: 20.5,
      },
    };
    const sp = specs[species] || specs.kancil;

    ctx.save();
    ctx.translate(cx + k.shiftX * scale, groundY);
    ctx.scale(scale, scale);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    if (!k.hideShadow) {
      ctx.fillStyle = "rgba(15, 23, 42, 0.22)";
      ctx.beginPath();
      ctx.ellipse(
        0,
        1,
        21 * k.shadowScale,
        5 * k.shadowScale,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    const hipY = -16 + k.bobY;

    ctx.save();
    ctx.translate(-sp.bodyW * 0.42, hipY - 5);
    ctx.rotate(k.tailWag);
    if (species === "kelinci") {
      const tGrad = ctx.createRadialGradient(-7, -4, 1, -6, -2, 8);
      tGrad.addColorStop(0, "#ffffff");
      tGrad.addColorStop(1, "#e2e8f0");
      ctx.fillStyle = tGrad;
      ctx.strokeStyle = sp.stroke;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-6, -2, 7.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (species === "kancil") {
      ctx.fillStyle = sp.furDark;
      ctx.strokeStyle = sp.stroke;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(-7, -3, 7, 4.2, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff7ed";
      ctx.beginPath();
      ctx.ellipse(-9, -4, 3.8, 2.2, -0.35, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = species === "panda_classic" ? "#1e293b" : sp.furDark;
      ctx.beginPath();
      ctx.arc(-5, -2, 5.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const drawLeg = (lx, rot, lift, isBack) => {
      ctx.save();
      ctx.translate(lx, hipY - lift);
      ctx.rotate(rot);
      ctx.fillStyle =
        species === "kelinci"
          ? isBack
            ? "#e2e8f0"
            : "#ffffff"
          : isBack
            ? sp.furDark
            : sp.pants;
      ctx.strokeStyle = sp.stroke;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-4.8, -2, 9.6, 13, 4.8);
      ctx.fill();
      ctx.stroke();

      const sGrad = ctx.createLinearGradient(0, 7, 0, 16);
      sGrad.addColorStop(0, sp.shoeTop);
      sGrad.addColorStop(1, sp.shoeBot);
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.roundRect(-5.8, 8, 13.5, 7.5, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.beginPath();
      ctx.ellipse(2, 10, 3.5, 1.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    drawLeg(-6.5, k.leftLegRot, k.leftLegLift, true);
    drawLeg(6.5, k.rightLegRot, k.rightLegLift, false);

    ctx.save();
    ctx.translate(0, hipY + 2);
    ctx.rotate(k.bodyTilt);
    ctx.scale(k.scaleX, k.scaleY);

    ctx.save();
    ctx.translate(-sp.bodyW * 0.45, -sp.bodyH * 0.72);
    ctx.rotate(k.leftArmRot);
    ctx.fillStyle = species === "panda_classic" ? "#1e293b" : sp.furMid;
    ctx.strokeStyle = sp.stroke;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-4.5, -2, 9, 17, 4.5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const torsoGrad = ctx.createLinearGradient(
      -sp.bodyW / 2,
      -sp.bodyH,
      sp.bodyW / 2,
      2,
    );
    torsoGrad.addColorStop(0, sp.outfitTop);
    torsoGrad.addColorStop(1, sp.outfitBot);
    ctx.fillStyle = torsoGrad;
    ctx.strokeStyle = sp.stroke;
    ctx.lineWidth = 1.7;

    if (species === "kelinci") {
      ctx.beginPath();
      ctx.moveTo(-sp.bodyW * 0.42, -sp.bodyH);
      ctx.lineTo(sp.bodyW * 0.42, -sp.bodyH);
      ctx.quadraticCurveTo(sp.bodyW * 0.62, -6, sp.bodyW * 0.58, 2);
      ctx.quadraticCurveTo(0, 5, -sp.bodyW * 0.58, 2);
      ctx.quadraticCurveTo(-sp.bodyW * 0.62, -6, -sp.bodyW * 0.42, -sp.bodyH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(-4.5, -sp.bodyH + 3, 5.5, 3.2, 0.25, 0, Math.PI * 2);
      ctx.ellipse(4.5, -sp.bodyH + 3, 5.5, 3.2, -0.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f472b6";
      ctx.fillRect(-sp.bodyW * 0.48, -11, sp.bodyW * 0.96, 4.2);
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(0, -9, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.roundRect(-sp.bodyW / 2, -sp.bodyH, sp.bodyW, sp.bodyH + 2, 12);
      ctx.fill();
      ctx.stroke();

      if (species === "beruang") {
        ctx.fillStyle = sp.belly;
        ctx.beginPath();
        ctx.roundRect(-5.5, -sp.bodyH + 3, 11, sp.bodyH - 5, 5);
        ctx.fill();
        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        ctx.arc(-8.5, -sp.bodyH + 11, 2, 0, Math.PI * 2);
        ctx.arc(8.5, -sp.bodyH + 11, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (species === "panda_classic") {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(-6.5, -sp.bodyH + 1);
        ctx.lineTo(0, -sp.bodyH + 14);
        ctx.lineTo(6.5, -sp.bodyH + 1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.moveTo(0, -sp.bodyH + 4);
        ctx.lineTo(3.6, -sp.bodyH + 15);
        ctx.lineTo(0, -sp.bodyH + 20);
        ctx.lineTo(-3.6, -sp.bodyH + 15);
        ctx.closePath();
        ctx.fill();
      } else if (species === "kancil") {
        ctx.fillStyle = sp.belly;
        ctx.beginPath();
        ctx.ellipse(0, -11, 8.5, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.translate(-7, -sp.bodyH + 4);
        ctx.rotate(k.scarfWave);
        ctx.fillStyle = "#ef4444";
        ctx.strokeStyle = "#991b1b";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(-15, -3, 16, 6.5, 3);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.roundRect(-12, -sp.bodyH - 1, 24, 6.5, 3);
        ctx.fill();
      }
    }

    ctx.fillStyle = "rgba(15, 23, 42, 0.14)";
    ctx.beginPath();
    ctx.ellipse(0, -sp.bodyH + 1, 12, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(sp.bodyW * 0.45, -sp.bodyH * 0.72);
    ctx.rotate(k.rightArmRot);
    ctx.fillStyle = species === "panda_classic" ? "#1e293b" : sp.furLight;
    ctx.strokeStyle = sp.stroke;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-4.5, -2, 9, 17, 4.5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(0, -sp.bodyH - sp.headRy * 0.78 + k.headBobY);
    ctx.rotate(k.headTilt);

    if (species === "kelinci") {
      const drawRabbitEar = (ex, baseRot) => {
        ctx.save();
        ctx.translate(ex, -sp.headRy + 4);
        ctx.rotate(baseRot + k.earLag);
        const earGrad = ctx.createLinearGradient(-5, -28, 6, 0);
        earGrad.addColorStop(0, "#ffffff");
        earGrad.addColorStop(1, "#e2e8f0");
        ctx.fillStyle = earGrad;
        ctx.strokeStyle = sp.stroke;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.ellipse(0, -13, 6.2, 15.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        const innerGrad = ctx.createLinearGradient(0, -24, 0, -2);
        innerGrad.addColorStop(0, "#fbcfe8");
        innerGrad.addColorStop(1, "#f472b6");
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.ellipse(0, -12.5, 3.2, 10.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      drawRabbitEar(-9, -0.16);
      drawRabbitEar(9, 0.16);
    } else if (species === "kancil") {
      const drawDeerEar = (ex, side) => {
        ctx.save();
        ctx.translate(ex, -sp.headRy + 7);
        ctx.rotate(side * 0.5 + k.earLag * 0.55);
        ctx.fillStyle = sp.furMid;
        ctx.strokeStyle = sp.stroke;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(side * 6, -3, 10.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fed7aa";
        ctx.beginPath();
        ctx.ellipse(side * 6, -3, 6, 2.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      drawDeerEar(-13, -1);
      drawDeerEar(13, 1);

      ctx.strokeStyle = "#92400e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-6.5, -sp.headRy + 2);
      ctx.lineTo(-9.5, -sp.headRy - 8);
      ctx.moveTo(6.5, -sp.headRy + 2);
      ctx.lineTo(9.5, -sp.headRy - 8);
      ctx.stroke();
    } else {
      const earColor = species === "panda_classic" ? "#1e293b" : sp.furDark;
      const innerColor = species === "panda_classic" ? "#334155" : "#fed7aa";
      [-16, 16].forEach((ex, i) => {
        ctx.save();
        ctx.translate(ex, -sp.headRy + 5);
        ctx.rotate((i === 0 ? -1 : 1) * 0.1 + k.earLag * 0.4);
        ctx.fillStyle = earColor;
        ctx.strokeStyle = sp.stroke;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = innerColor;
        ctx.beginPath();
        ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    const headGrad = ctx.createRadialGradient(-7, -8, 3, 0, 1, sp.headRx + 7);
    headGrad.addColorStop(0, sp.furLight);
    headGrad.addColorStop(0.65, sp.furMid);
    headGrad.addColorStop(1, sp.furDark);
    ctx.fillStyle = headGrad;
    ctx.strokeStyle = sp.stroke;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.ellipse(0, 0, sp.headRx, sp.headRy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.beginPath();
    ctx.ellipse(-6, -10, 7, 3.5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    if (species === "kelinci") {
      ctx.save();
      ctx.translate(-9, -sp.headRy + 3);
      ctx.rotate(-0.22);
      ctx.fillStyle = "#ec4899";
      ctx.strokeStyle = "#831843";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(-4.5, 0, 4.8, 3.2, -0.2, 0, Math.PI * 2);
      ctx.ellipse(4.5, 0, 4.8, 3.2, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(0, 0, 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (species === "kancil") {
      ctx.fillStyle = "#fff7ed";
      ctx.beginPath();
      ctx.arc(-4.5, -10.5, 2.1, 0, Math.PI * 2);
      ctx.arc(0, -12.2, 2.6, 0, Math.PI * 2);
      ctx.arc(4.5, -10.5, 2.1, 0, Math.PI * 2);
      ctx.fill();
    } else if (species === "beruang") {
      ctx.fillStyle = "#fef3c7";
      ctx.beginPath();
      ctx.ellipse(1.5, 6, 11.5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (species === "panda_classic") {
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.ellipse(-7.5, -2, 7.2, 5.8, -0.2, 0, Math.PI * 2);
      ctx.ellipse(9.5, -2, 7.2, 5.8, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(244, 114, 182, 0.36)";
    ctx.beginPath();
    ctx.ellipse(-12.5, 5, 4.5, 2.6, 0, 0, Math.PI * 2);
    ctx.ellipse(14.5, 5, 4.5, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();

    const eyeY = -1.5;
    const eyeL = -7.2;
    const eyeR = 9.6;
    if (k.expression === "hurt") {
      ctx.strokeStyle = species === "panda_classic" ? "#ffffff" : sp.stroke;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(eyeL - 3.5, eyeY - 2.8);
      ctx.lineTo(eyeL + 2.8, eyeY);
      ctx.lineTo(eyeL - 3.5, eyeY + 2.8);
      ctx.moveTo(eyeR + 3.5, eyeY - 2.8);
      ctx.lineTo(eyeR - 2.8, eyeY);
      ctx.lineTo(eyeR + 3.5, eyeY + 2.8);
      ctx.stroke();
    } else if (k.expression === "joy") {
      ctx.strokeStyle = species === "panda_classic" ? "#ffffff" : sp.stroke;
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      ctx.arc(eyeL, eyeY + 2, 4, Math.PI, 0);
      ctx.arc(eyeR, eyeY + 2, 4, Math.PI, 0);
      ctx.stroke();
    } else if (k.blink) {
      ctx.strokeStyle = species === "panda_classic" ? "#ffffff" : sp.stroke;
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(eyeL - 4, eyeY + 0.5);
      ctx.quadraticCurveTo(eyeL, eyeY + 2.2, eyeL + 4, eyeY + 0.5);
      ctx.moveTo(eyeR - 4, eyeY + 0.5);
      ctx.quadraticCurveTo(eyeR, eyeY + 2.2, eyeR + 4, eyeY + 0.5);
      ctx.stroke();
    } else {
      const drawEye = (ex) => {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(ex, eyeY, 4.6, 5.1, 0, 0, Math.PI * 2);
        ctx.fill();
        const irisGrad = ctx.createRadialGradient(
          ex + 0.8,
          eyeY - 0.5,
          0.5,
          ex + 0.8,
          eyeY,
          3.6,
        );
        irisGrad.addColorStop(0, species === "kelinci" ? "#581c87" : "#1e293b");
        irisGrad.addColorStop(1, "#0f172a");
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.arc(ex + 0.7, eyeY + 0.2, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ex + 1.8, eyeY - 1.3, 1.4, 0, Math.PI * 2);
        ctx.arc(ex - 0.5, eyeY + 1.4, 0.7, 0, Math.PI * 2);
        ctx.fill();
      };
      drawEye(eyeL);
      drawEye(eyeR);
      if (species === "kelinci") {
        ctx.strokeStyle = sp.stroke;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(eyeL - 4.4, eyeY - 2.6);
        ctx.lineTo(eyeL - 6.2, eyeY - 4.2);
        ctx.moveTo(eyeR + 4.4, eyeY - 2.6);
        ctx.lineTo(eyeR + 6.2, eyeY - 4.2);
        ctx.stroke();
      }
    }

    if (species === "panda_classic") {
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(eyeL, eyeY, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(eyeR, eyeY, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(eyeL + 7, eyeY);
      ctx.lineTo(eyeR - 7, eyeY);
      ctx.stroke();
    }

    ctx.fillStyle = species === "kelinci" ? "#f472b6" : "#1e293b";
    ctx.beginPath();
    ctx.ellipse(1.2, 4.2, 3.2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = sp.stroke;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    if (k.expression === "cheer" || k.expression === "joy") {
      ctx.fillStyle = "#fb7185";
      ctx.arc(1.2, 7.6, 4.2, 0, Math.PI);
      ctx.fill();
      ctx.stroke();
    } else if (k.expression === "hurt") {
      ctx.arc(1.2, 10.6, 3.2, Math.PI, 0);
      ctx.stroke();
    } else if (species === "kelinci") {
      ctx.moveTo(-2.5, 7.8);
      ctx.quadraticCurveTo(-0.5, 10, 1.2, 7.5);
      ctx.quadraticCurveTo(2.9, 10, 4.9, 7.8);
      ctx.stroke();
    } else {
      ctx.arc(1.2, 7.2, 4, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }

    if (species === "kelinci" && k.expression !== "hurt") {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.roundRect(-0.5, 8.6, 3.4, 2.8, 1);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();

    if (stateKey === "hurt" && f % 2 === 1) {
      ctx.fillStyle = "rgba(239, 68, 68, 0.28)";
      ctx.beginPath();
      ctx.arc(0, -40, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  getPortraitCanvas(charId, phaserScene = null) {
    const meta = this.getCharacterMeta(charId);
    if (this.portraits.has(meta.id)) {
      return this.portraits.get(meta.id);
    }

    if (meta.renderMode === "animal_rig") {
      const out = document.createElement("canvas");
      out.width = PORTRAIT_W;
      out.height = PORTRAIT_H;
      const ctx = out.getContext("2d");
      const k = this.computeKinematics("idle", 2, meta.motionProfile);
      this.drawAnimalRigCharacter(
        ctx,
        meta.species,
        PORTRAIT_W / 2,
        PORTRAIT_H - 22,
        3.35,
        k,
        "idle",
        2,
      );
      this.portraits.set(meta.id, out);
      return out;
    }

    let sourceImg = this.lineupImage;
    if (
      !sourceImg &&
      phaserScene &&
      phaserScene.textures.exists("heroes_lineup_src")
    ) {
      sourceImg = phaserScene.textures
        .get("heroes_lineup_src")
        .getSourceImage();
      this.lineupImage = sourceImg;
    }

    const portrait =
      sourceImg && (sourceImg.naturalWidth > 0 || sourceImg.width > 0)
        ? this.extractCleanPortrait(meta, sourceImg)
        : this.buildFallbackHumanPortrait(meta.id);

    this.portraits.set(meta.id, portrait);
    return portrait;
  }

  getPortraitDataURL(charId) {
    const meta = this.getCharacterMeta(charId);
    if (this.portraitUrls.has(meta.id)) {
      return this.portraitUrls.get(meta.id);
    }
    const url = this.getPortraitCanvas(meta.id).toDataURL("image/png");
    this.portraitUrls.set(meta.id, url);
    return url;
  }

  drawImageArticulatedFrame(
    ctx,
    portrait,
    fx,
    fy,
    frameW,
    frameH,
    stateKey,
    f,
    meta,
    k,
  ) {
    const pw = portrait.width;
    const ph = portrait.height;
    const hipRatio = meta.hipRatio || 0.72;
    const hipSrcY = Math.floor(ph * hipRatio);
    const legSrcH = ph - hipSrcY;

    const unit = frameW / 96;
    const drawW = 80 * unit;
    const drawH = 92 * unit;
    const upperDrawH = drawH * hipRatio;
    const legDrawH = drawH * (1 - hipRatio);
    const groundY = fy + frameH - 8 * unit;
    const centerX = fx + frameW / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (!k.hideShadow) {
      ctx.fillStyle = "rgba(15, 23, 42, 0.22)";
      ctx.beginPath();
      ctx.ellipse(
        centerX + k.shiftX * unit,
        groundY + unit,
        22 * unit * k.shadowScale,
        5.5 * unit * k.shadowScale,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    const hipDrawY = groundY - legDrawH + k.bobY * unit;

    ctx.save();
    ctx.translate(
      centerX + (k.shiftX - 10) * unit,
      hipDrawY - k.leftLegLift * unit,
    );
    ctx.rotate(k.leftLegRot);
    ctx.drawImage(
      portrait,
      0,
      hipSrcY,
      pw * 0.52,
      legSrcH,
      -drawW * 0.38,
      -2 * unit,
      drawW * 0.52,
      legDrawH + 3 * unit,
    );
    ctx.restore();

    ctx.save();
    ctx.translate(
      centerX + (k.shiftX + 10) * unit,
      hipDrawY - k.rightLegLift * unit,
    );
    ctx.rotate(k.rightLegRot);
    ctx.drawImage(
      portrait,
      pw * 0.48,
      hipSrcY,
      pw * 0.52,
      legSrcH,
      -drawW * 0.14,
      -2 * unit,
      drawW * 0.52,
      legDrawH + 3 * unit,
    );
    ctx.restore();

    ctx.save();
    ctx.translate(centerX + k.shiftX * unit, hipDrawY + 2 * unit);
    ctx.rotate(k.bodyTilt + k.headTilt * 0.35);
    ctx.scale(k.scaleX, k.scaleY);
    ctx.drawImage(
      portrait,
      0,
      0,
      pw,
      hipSrcY + 8,
      -drawW / 2,
      -upperDrawH,
      drawW,
      upperDrawH + 4 * unit,
    );

    if (k.blink && meta.eyeOverlay) {
      const eo = meta.eyeOverlay;
      const ex = -drawW / 2 + drawW * eo.x;
      const ey = -upperDrawH + drawH * eo.y;
      ctx.fillStyle = eo.skin;
      ctx.beginPath();
      ctx.roundRect(
        ex - (drawW * eo.w) / 2,
        ey - 4 * unit,
        drawW * eo.w,
        8 * unit,
        4 * unit,
      );
      ctx.fill();
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2 * unit;
      ctx.beginPath();
      ctx.moveTo(ex - 11 * unit, ey + unit);
      ctx.lineTo(ex - 3 * unit, ey + unit);
      ctx.moveTo(ex + 3 * unit, ey + unit);
      ctx.lineTo(ex + 11 * unit, ey + unit);
      ctx.stroke();
    }

    if (stateKey === "hurt" && f % 2 === 1) {
      ctx.fillStyle = "rgba(239, 68, 68, 0.32)";
      ctx.beginPath();
      ctx.arc(0, -upperDrawH * 0.5, 32 * unit, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawSharedActionEffects(ctx, fx, fy, frameW, frameH, stateKey, f, meta) {
    const unit = frameW / 96;
    const centerX = fx + frameW / 2;
    const groundY = fy + frameH - 8 * unit;

    if ((stateKey === "run" || stateKey === "walk") && (f === 1 || f === 5)) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
      ctx.beginPath();
      ctx.arc(
        centerX - 24 * unit,
        groundY - 3 * unit,
        5 * unit,
        0,
        Math.PI * 2,
      );
      ctx.arc(
        centerX - 31 * unit,
        groundY - 7 * unit,
        3.5 * unit,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    if (stateKey === "jump" && (f === 1 || f === 2)) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 3 * unit;
      ctx.beginPath();
      ctx.arc(
        centerX,
        groundY - 2 * unit,
        (16 + f * 5) * unit,
        Math.PI * 1.15,
        Math.PI * 1.85,
      );
      ctx.stroke();
    }

    if (stateKey === "swim") {
      const waveOffset = (f % 4) * 3.5 * unit;
      ctx.save();
      ctx.strokeStyle = "rgba(224, 242, 254, 0.85)";
      ctx.lineWidth = 2.6 * unit;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(
        centerX - 18 * unit - waveOffset,
        fy + frameH * 0.58,
        12 * unit,
        0.4,
        2.5,
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(
        centerX + 12 * unit,
        fy + frameH * 0.52,
        (9 + (f % 3) * 3) * unit,
        -0.7,
        0.9,
      );
      ctx.stroke();
      ctx.fillStyle = "rgba(224, 242, 254, 0.8)";
      ctx.beginPath();
      ctx.arc(
        centerX - 26 * unit,
        fy + frameH * (0.48 - (f % 4) * 0.04),
        3 * unit,
        0,
        Math.PI * 2,
      );
      ctx.arc(
        centerX - 33 * unit,
        fy + frameH * (0.62 - (f % 3) * 0.04),
        2.2 * unit,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
    }

    if (stateKey === "swim_idle" && (f === 2 || f === 6)) {
      ctx.strokeStyle = "rgba(224, 242, 254, 0.65)";
      ctx.lineWidth = 2 * unit;
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        fy + frameH * 0.72,
        20 * unit,
        5 * unit,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }

    if (stateKey === "attack" && f >= 2 && f <= 5) {
      ctx.save();
      ctx.strokeStyle = meta.accentColor;
      ctx.lineWidth = 5 * unit;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(fx + frameW - 22 * unit, fy + frameH / 2, 24 * unit, -0.95, 0.95);
      ctx.stroke();
      ctx.strokeStyle = "#fef08a";
      ctx.lineWidth = 2.6 * unit;
      ctx.beginPath();
      ctx.arc(fx + frameW - 18 * unit, fy + frameH / 2, 18 * unit, -0.75, 0.75);
      ctx.stroke();
      ctx.restore();
    }

    if (stateKey === "victory" && (f === 1 || f === 3 || f === 5 || f === 7)) {
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(
        fx + (18 + (f % 3) * 4) * unit,
        fy + 22 * unit,
        4 * unit,
        0,
        Math.PI * 2,
      );
      ctx.arc(
        fx + frameW - 18 * unit,
        fy + (16 + (f % 2) * 5) * unit,
        4.5 * unit,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  buildAnimatedSheetCanvas(charId, phaserScene = null) {
    const meta = this.getCharacterMeta(charId);
    if (this.sheetCanvases.has(meta.id)) {
      return this.sheetCanvases.get(meta.id);
    }

    const portrait =
      meta.renderMode === "image"
        ? this.getPortraitCanvas(meta.id, phaserScene)
        : null;
    const sheet = document.createElement("canvas");
    sheet.width = FRAME_W * SHEET_COLS;
    sheet.height = FRAME_H * ANIMATION_STATES.length;
    const ctx = sheet.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ANIMATION_STATES.forEach((st, rowIdx) => {
      for (let f = 0; f < SHEET_COLS; f++) {
        const fx = f * FRAME_W;
        const fy = rowIdx * FRAME_H;
        const k = this.computeKinematics(st.key, f, meta.motionProfile);

        if (meta.renderMode === "animal_rig") {
          this.drawAnimalRigCharacter(
            ctx,
            meta.species,
            fx + FRAME_W / 2,
            fy + FRAME_H - 14,
            1.62,
            k,
            st.key,
            f,
          );
        } else {
          this.drawImageArticulatedFrame(
            ctx,
            portrait,
            fx,
            fy,
            FRAME_W,
            FRAME_H,
            st.key,
            f,
            meta,
            k,
          );
        }
        this.drawSharedActionEffects(
          ctx,
          fx,
          fy,
          FRAME_W,
          FRAME_H,
          st.key,
          f,
          meta,
        );
      }
    });

    this.sheetCanvases.set(meta.id, sheet);
    return sheet;
  }

  buildTexturesAndAnimations(scene) {
    CHARACTER_ROSTER.forEach((char) => {
      const sheetKey = `player_sheet_${char.id}`;
      const staticKey = `player_${char.id}`;

      const sheetCanvas = this.buildAnimatedSheetCanvas(char.id, scene);
      if (scene.textures.exists(sheetKey)) scene.textures.remove(sheetKey);
      scene.textures.addSpriteSheet(sheetKey, sheetCanvas, {
        frameWidth: FRAME_W,
        frameHeight: FRAME_H,
      });

      const portraitCanvas = this.getPortraitCanvas(char.id, scene);
      const compactCanvas = document.createElement("canvas");
      compactCanvas.width = 136;
      compactCanvas.height = 160;
      const cCtx = compactCanvas.getContext("2d");
      cCtx.imageSmoothingEnabled = true;
      cCtx.imageSmoothingQuality = "high";
      cCtx.drawImage(
        portraitCanvas,
        0,
        0,
        PORTRAIT_W,
        PORTRAIT_H,
        0,
        0,
        136,
        160,
      );

      if (scene.textures.exists(staticKey)) scene.textures.remove(staticKey);
      scene.textures.addCanvas(staticKey, compactCanvas);

      const tempo = char.motionProfile?.tempo || 1;
      ANIMATION_STATES.forEach((st, rowIdx) => {
        const animKey = `${char.id}_${st.key}`;
        if (scene.anims.exists(animKey)) scene.anims.remove(animKey);
        scene.anims.create({
          key: animKey,
          frames: scene.anims.generateFrameNumbers(sheetKey, {
            start: rowIdx * SHEET_COLS,
            end: rowIdx * SHEET_COLS + SHEET_COLS - 1,
          }),
          frameRate: Math.round(st.fps * tempo),
          repeat: st.repeat,
        });
      });
    });
  }

  mountLivePreview(canvasEl, getCharId, getStateKey) {
    if (!canvasEl) return () => {};
    const dpr = Math.min(2, window.devicePixelRatio || 2);
    const cssW = 250;
    const cssH = 250;
    canvasEl.style.width = `${cssW}px`;
    canvasEl.style.height = `${cssH}px`;
    canvasEl.width = Math.round(cssW * dpr);
    canvasEl.height = Math.round(cssH * dpr);

    const ctx = canvasEl.getContext("2d");
    let frame = 0;
    let lastTime = 0;
    let rafId = null;
    let stopped = false;

    this.ensureLineupImageLoaded();

    const tick = (now) => {
      if (stopped) return;
      const charId = this.resolveCharacterId(getCharId());
      const meta = this.getCharacterMeta(charId);
      const stateKey = getStateKey();
      const stateCfg =
        ANIMATION_STATES.find((s) => s.key === stateKey) || ANIMATION_STATES[0];
      const intervalMs = Math.max(60, Math.round(1000 / stateCfg.fps));

      if (now - lastTime >= intervalMs) {
        frame = (frame + 1) % SHEET_COLS;
        lastTime = now;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, cssW, cssH);

      const pedGrad = ctx.createRadialGradient(
        cssW / 2,
        cssH - 28,
        10,
        cssW / 2,
        cssH - 28,
        92,
      );
      pedGrad.addColorStop(0, "#fde047");
      pedGrad.addColorStop(0.55, "#22c55e");
      pedGrad.addColorStop(1, "#15803d");
      ctx.fillStyle = pedGrad;
      ctx.beginPath();
      ctx.ellipse(cssW / 2, cssH - 28, 86, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      const k = this.computeKinematics(stateKey, frame, meta.motionProfile);
      if (meta.renderMode === "animal_rig") {
        this.drawAnimalRigCharacter(
          ctx,
          meta.species,
          cssW / 2,
          cssH - 26,
          1.72,
          k,
          stateKey,
          frame,
        );
      } else {
        const portrait = this.getPortraitCanvas(charId);
        this.drawImageArticulatedFrame(
          ctx,
          portrait,
          29,
          10,
          192,
          224,
          stateKey,
          frame,
          meta,
          k,
        );
      }
      this.drawSharedActionEffects(
        ctx,
        29,
        10,
        192,
        224,
        stateKey,
        frame,
        meta,
      );

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }
}

export const characterAssetManager = new CharacterAssetManager();
