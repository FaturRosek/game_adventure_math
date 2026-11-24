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
    cropBox: { x0: 0.01, x1: 0.268, y0: 0.14, y1: 0.9 },
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
    cropBox: { x0: 0.255, x1: 0.505, y0: 0.16, y1: 0.9 },
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
    cropBox: { x0: 0.495, x1: 0.728, y0: 0.16, y1: 0.9 },
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
    cropBox: { x0: 0.66, x1: 0.965, y0: 0.2, y1: 0.89 },
    flipSourceX: true,
    preserveWhiteFur: true,
    hipRatio: 0.8,
  },
];

export const ANIMATION_STATES = [
  { key: "idle", label: "Diam", fps: 6, repeat: -1 },
  { key: "walk", label: "Berjalan", fps: 10, repeat: -1 },
  { key: "run", label: "Berlari", fps: 13, repeat: -1 },
  { key: "jump", label: "Melompat", fps: 10, repeat: 0 },
  { key: "fall", label: "Melayang", fps: 8, repeat: -1 },
  { key: "attack", label: "Menyerang", fps: 14, repeat: 0 },
  { key: "hurt", label: "Terkena Hit", fps: 10, repeat: 0 },
  { key: "victory", label: "Menang", fps: 9, repeat: -1 },
];

const SHEET_COLS = 6;
const FRAME_W = 96;
const FRAME_H = 112;

class CharacterAssetManager {
  constructor() {
    this.portraits = new Map();
    this.sheetCanvases = new Map();
    this.portraitUrls = new Map();
    this.lineupImage = null;
    this.lineupLoadPromise = null;
  }

  getCharacterMeta(charId) {
    return CHARACTER_ROSTER.find((c) => c.id === charId) || CHARACTER_ROSTER[0];
  }

  preloadAssets(scene) {
    scene.load.image('heroes_lineup_src', './assets/ui/heroes-lineup.jpg');
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
        this.portraits.clear();
        this.sheetCanvases.clear();
        this.portraitUrls.clear();
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
      if (isBgPixel(x, y, idx)) {
        queue[tail++] = idx;
      }
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
          if (nearTransparent && max - min < 12 && min > 236) {
            data[p + 3] = 95;
          }
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
      return this.buildFallbackFullBodyPortrait(charMeta.id);
    }

    const trimW = maxX - minX + 1;
    const trimH = maxY - minY + 1;
    const out = document.createElement("canvas");
    out.width = 180;
    out.height = 210;
    const oCtx = out.getContext("2d");
    const scale = Math.min(164 / trimW, 194 / trimH);
    const dw = trimW * scale;
    const dh = trimH * scale;
    const dx = (180 - dw) / 2;
    const dy = 204 - dh;

    oCtx.save();
    if (charMeta.flipSourceX) {
      oCtx.translate(180, 0);
      oCtx.scale(-1, 1);
    }
    oCtx.drawImage(rawCanvas, minX, minY, trimW, trimH, dx, dy, dw, dh);
    oCtx.restore();

    return out;
  }

  buildFallbackFullBodyPortrait(charId) {
    const out = document.createElement("canvas");
    out.width = 180;
    out.height = 210;
    const ctx = out.getContext("2d");

    const palettes = {
      kiko: {
        top: "#ef4444",
        bot: "#991b1b",
        pants: "#334155",
        hair: "#7c2d12",
        skin: "#fed7aa",
        shoe: "#f97316",
      },
      cici: {
        top: "#ec4899",
        bot: "#be185d",
        pants: "#f472b6",
        hair: "#78350f",
        skin: "#fed7aa",
        shoe: "#db2777",
      },
      bobi: {
        top: "#3b82f6",
        bot: "#1d4ed8",
        pants: "#334155",
        hair: "#78350f",
        skin: "#fed7aa",
        shoe: "#2563eb",
      },
      prof_panda: {
        top: "#7c3aed",
        bot: "#5b21b6",
        pants: "#312e81",
        hair: "#1e293b",
        skin: "#ffffff",
        shoe: "#334155",
      },
    };
    const p = palettes[charId] || palettes.kiko;

    ctx.save();
    ctx.translate(90, 124);

    ctx.fillStyle = p.pants;
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-20, 42, 16, 26, 6);
    ctx.roundRect(4, 42, 16, 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = p.shoe;
    ctx.beginPath();
    ctx.roundRect(-24, 64, 22, 12, 6);
    ctx.roundRect(2, 64, 22, 12, 6);
    ctx.fill();
    ctx.stroke();

    const bodyGrad = ctx.createLinearGradient(0, -4, 0, 46);
    bodyGrad.addColorStop(0, p.top);
    bodyGrad.addColorStop(1, p.bot);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-26, -4, 52, 50, 16);
    ctx.fill();
    ctx.stroke();

    if (charId === "prof_panda") {
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(-28, -68, 12, 0, Math.PI * 2);
      ctx.arc(28, -68, 12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.hair;
      ctx.beginPath();
      ctx.arc(0, -48, 34, Math.PI, 0);
      ctx.fill();
    }

    ctx.fillStyle = p.skin;
    ctx.beginPath();
    ctx.roundRect(-30, -68, 60, 56, 26);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(-12, -42, 4.5, 0, Math.PI * 2);
    ctx.arc(12, -42, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -28, 9, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.restore();
    return out;
  }

  getPortraitCanvas(charId, phaserScene = null) {
    const meta = this.getCharacterMeta(charId);
    if (this.portraits.has(meta.id)) {
      return this.portraits.get(meta.id);
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
        : this.buildFallbackFullBodyPortrait(meta.id);

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

  drawArticulatedFrame(ctx, portrait, fx, fy, stateKey, f, meta) {
    const phase = (f / SHEET_COLS) * Math.PI * 2;
    const pw = portrait.width;
    const ph = portrait.height;
    const hipRatio = meta.hipRatio || 0.72;
    const hipSrcY = Math.floor(ph * hipRatio);
    const legSrcH = ph - hipSrcY;

    const drawW = 80;
    const drawH = 92;
    const upperDrawH = drawH * hipRatio;
    const legDrawH = drawH * (1 - hipRatio);
    const groundY = fy + FRAME_H - 8;
    const centerX = fx + FRAME_W / 2;

    let bodyBobY = 0;
    let bodyTilt = 0;
    let bodyScaleX = 1;
    let bodyScaleY = 1;
    let leftLegRot = 0;
    let rightLegRot = 0;
    let leftLegLift = 0;
    let rightLegLift = 0;
    let shiftX = 0;

    if (stateKey === "idle") {
      bodyBobY = Math.sin(phase) * 2.2;
      bodyScaleY = 1 + Math.sin(phase) * 0.028;
      bodyScaleX = 1 - Math.sin(phase) * 0.018;
    } else if (stateKey === "walk") {
      const s = Math.sin(phase);
      bodyBobY = -Math.abs(s) * 4.5;
      bodyTilt = 0.05 + s * 0.03;
      leftLegRot = s * 0.42;
      rightLegRot = -s * 0.42;
      leftLegLift = Math.max(0, s) * 5;
      rightLegLift = Math.max(0, -s) * 5;
    } else if (stateKey === "run") {
      const s = Math.sin(phase);
      bodyBobY = -Math.abs(s) * 6.5;
      bodyTilt = 0.13 + s * 0.04;
      bodyScaleX = 1.03;
      leftLegRot = s * 0.62;
      rightLegRot = -s * 0.62;
      leftLegLift = Math.max(0, s) * 8;
      rightLegLift = Math.max(0, -s) * 8;
    } else if (stateKey === "jump") {
      const t = Math.min(1, f / (SHEET_COLS - 1));
      bodyBobY = -6 - Math.sin(t * Math.PI) * 7;
      bodyTilt = -0.06;
      bodyScaleY = 1.08;
      bodyScaleX = 0.93;
      leftLegRot = 0.36;
      rightLegRot = -0.28;
      leftLegLift = 8;
      rightLegLift = 4;
    } else if (stateKey === "fall") {
      const s = Math.sin(phase);
      bodyBobY = -5 + s * 2.5;
      bodyTilt = 0.06;
      bodyScaleY = 0.96;
      bodyScaleX = 1.04;
      leftLegRot = -0.22 + s * 0.12;
      rightLegRot = 0.22 - s * 0.12;
      leftLegLift = 5;
      rightLegLift = 5;
    } else if (stateKey === "attack") {
      const punch = f >= 1 && f <= 3;
      shiftX = punch ? 8 : 0;
      bodyTilt = punch ? 0.16 : 0;
      bodyScaleX = punch ? 1.08 : 1;
      leftLegRot = punch ? -0.35 : 0;
      rightLegRot = punch ? 0.35 : 0;
    } else if (stateKey === "hurt") {
      shiftX = f % 2 === 1 ? -6 : -2;
      bodyTilt = -0.18;
      leftLegRot = 0.2;
      rightLegRot = -0.15;
    } else if (stateKey === "victory") {
      const jump = Math.abs(Math.sin(phase));
      bodyBobY = -jump * 11;
      bodyTilt = Math.sin(phase) * 0.08;
      bodyScaleY = 1 + jump * 0.05;
      leftLegRot = -jump * 0.25;
      rightLegRot = jump * 0.25;
      leftLegLift = jump * 6;
      rightLegLift = jump * 6;
    }

    const shadowScale = stateKey === "jump" || stateKey === "fall" ? 0.72 : 1;
    ctx.fillStyle = "rgba(15, 23, 42, 0.22)";
    ctx.beginPath();
    ctx.ellipse(
      centerX + shiftX,
      groundY + 1,
      22 * shadowScale,
      5.5 * shadowScale,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    const hipDrawY = groundY - legDrawH + bodyBobY;

    ctx.save();
    ctx.translate(centerX + shiftX - 10, hipDrawY - leftLegLift);
    ctx.rotate(leftLegRot);
    ctx.drawImage(
      portrait,
      0,
      hipSrcY,
      pw * 0.52,
      legSrcH,
      -drawW * 0.38,
      -2,
      drawW * 0.52,
      legDrawH + 3,
    );
    ctx.restore();

    ctx.save();
    ctx.translate(centerX + shiftX + 10, hipDrawY - rightLegLift);
    ctx.rotate(rightLegRot);
    ctx.drawImage(
      portrait,
      pw * 0.48,
      hipSrcY,
      pw * 0.52,
      legSrcH,
      -drawW * 0.14,
      -2,
      drawW * 0.52,
      legDrawH + 3,
    );
    ctx.restore();

    ctx.save();
    ctx.translate(centerX + shiftX, hipDrawY + 2);
    ctx.rotate(bodyTilt);
    ctx.scale(bodyScaleX, bodyScaleY);
    ctx.drawImage(
      portrait,
      0,
      0,
      pw,
      hipSrcY + 8,
      -drawW / 2,
      -upperDrawH,
      drawW,
      upperDrawH + 4,
    );

    if (stateKey === "hurt" && f % 2 === 1) {
      ctx.fillStyle = "rgba(239, 68, 68, 0.35)";
      ctx.beginPath();
      ctx.arc(0, -upperDrawH * 0.5, 32, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if ((stateKey === "run" || stateKey === "walk") && (f === 1 || f === 4)) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
      ctx.beginPath();
      ctx.arc(centerX - 24, groundY - 3, 5, 0, Math.PI * 2);
      ctx.arc(centerX - 31, groundY - 7, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (stateKey === "jump" && f <= 2) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, groundY - 2, 16 + f * 5, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }

    if (stateKey === "attack" && f >= 1 && f <= 3) {
      ctx.save();
      ctx.strokeStyle = meta.accentColor;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(fx + FRAME_W - 22, fy + FRAME_H / 2, 24, -0.9, 0.9);
      ctx.stroke();
      ctx.strokeStyle = "#fef08a";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(fx + FRAME_W - 19, fy + FRAME_H / 2, 18, -0.7, 0.7);
      ctx.stroke();
      ctx.restore();
    }

    if (stateKey === "victory" && (f === 1 || f === 4)) {
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(fx + 20, fy + 22, 4, 0, Math.PI * 2);
      ctx.arc(fx + FRAME_W - 20, fy + 18, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  buildAnimatedSheetCanvas(charId, phaserScene = null) {
    const meta = this.getCharacterMeta(charId);
    if (this.sheetCanvases.has(meta.id)) {
      return this.sheetCanvases.get(meta.id);
    }

    const portrait = this.getPortraitCanvas(meta.id, phaserScene);
    const sheet = document.createElement("canvas");
    sheet.width = FRAME_W * SHEET_COLS;
    sheet.height = FRAME_H * ANIMATION_STATES.length;
    const ctx = sheet.getContext("2d");

    ANIMATION_STATES.forEach((st, rowIdx) => {
      for (let f = 0; f < SHEET_COLS; f++) {
        this.drawArticulatedFrame(
          ctx,
          portrait,
          f * FRAME_W,
          rowIdx * FRAME_H,
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
      const customKey = `custom_3d_${char.id}`;
      const sheetKey = `player_sheet_${char.id}`;
      const staticKey = `player_${char.id}`;

      const hasPreRendered3D =
        scene.textures.exists(customKey) &&
        scene.textures.get(customKey).frameTotal > 1;

      if (!hasPreRendered3D) {
        const sheetCanvas = this.buildAnimatedSheetCanvas(char.id, scene);
        if (scene.textures.exists(sheetKey)) {
          scene.textures.remove(sheetKey);
        }
        scene.textures.addSpriteSheet(sheetKey, sheetCanvas, {
          frameWidth: FRAME_W,
          frameHeight: FRAME_H,
        });
      }

      const activeSheetKey = hasPreRendered3D ? customKey : sheetKey;
      const portraitCanvas = this.getPortraitCanvas(char.id, scene);

      const compactCanvas = document.createElement("canvas");
      compactCanvas.width = 68;
      compactCanvas.height = 80;
      const cCtx = compactCanvas.getContext("2d");
      cCtx.drawImage(portraitCanvas, 0, 0, 180, 210, 0, 0, 68, 80);

      if (scene.textures.exists(staticKey)) {
        scene.textures.remove(staticKey);
      }
      scene.textures.addCanvas(staticKey, compactCanvas);

      ANIMATION_STATES.forEach((st, rowIdx) => {
        const animKey = `${char.id}_${st.key}`;
        if (scene.anims.exists(animKey)) {
          scene.anims.remove(animKey);
        }
        scene.anims.create({
          key: animKey,
          frames: scene.anims.generateFrameNumbers(activeSheetKey, {
            start: rowIdx * SHEET_COLS,
            end: rowIdx * SHEET_COLS + SHEET_COLS - 1,
          }),
          frameRate: st.fps,
          repeat: st.repeat,
        });
      });
    });
  }

  mountLivePreview(canvasEl, getCharId, getStateKey) {
    if (!canvasEl) return () => {};
    const ctx = canvasEl.getContext("2d");
    let frame = 0;
    let lastTime = 0;
    let rafId = null;
    let stopped = false;

    this.ensureLineupImageLoaded();

    const tick = (now) => {
      if (stopped) return;
      if (now - lastTime > 100) {
        frame = (frame + 1) % SHEET_COLS;
        lastTime = now;
      }

      const charId = getCharId();
      const stateKey = getStateKey();
      const rowIdx = Math.max(
        0,
        ANIMATION_STATES.findIndex((s) => s.key === stateKey),
      );
      const sheet = this.buildAnimatedSheetCanvas(charId);

      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

      const pedGrad = ctx.createRadialGradient(
        canvasEl.width / 2,
        canvasEl.height - 28,
        10,
        canvasEl.width / 2,
        canvasEl.height - 28,
        92,
      );
      pedGrad.addColorStop(0, "#fde047");
      pedGrad.addColorStop(0.55, "#22c55e");
      pedGrad.addColorStop(1, "#15803d");
      ctx.fillStyle = pedGrad;
      ctx.beginPath();
      ctx.ellipse(
        canvasEl.width / 2,
        canvasEl.height - 28,
        88,
        22,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      const scale = 2.05;
      const dw = FRAME_W * scale;
      const dh = FRAME_H * scale;
      ctx.drawImage(
        sheet,
        frame * FRAME_W,
        rowIdx * FRAME_H,
        FRAME_W,
        FRAME_H,
        (canvasEl.width - dw) / 2,
        canvasEl.height - 22 - dh,
        dw,
        dh,
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
