export function injectEarlyChildhoodStyles() {
  if (document.getElementById("ec-world-styles")) return;
  const style = document.createElement("style");
  style.id = "ec-world-styles";
  style.textContent = `
    .ec-fullscreen {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      font-family: 'Fredoka', 'Nunito', 'Comic Sans MS', 'Segoe UI', sans-serif;
      user-select: none;
      z-index: 40;
      pointer-events: auto;
    }
    .ec-world-bg,
    .ec-world-bg * {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    }
    .ec-world-layer {
      position: relative;
      z-index: 5;
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 12px 22px 16px;
      height: 100%;
      box-sizing: border-box;
      pointer-events: auto;
    }
    .ec-top-hud {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }
    .ec-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 999px;
      background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(240,248,255,0.9));
      border: 3px solid #ffffff;
      box-shadow: 0 6px 0 rgba(44,62,80,0.18), 0 10px 20px rgba(0,0,0,0.12);
      font-weight: 900;
      color: #2c3e50;
      font-size: 0.96rem;
    }
    .ec-btn-3d {
      border: 3px solid rgba(255,255,255,0.9);
      border-radius: 999px;
      padding: 10px 20px;
      font-weight: 900;
      font-size: 0.96rem;
      color: #ffffff;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-shadow: 0 2px 2px rgba(0,0,0,0.25);
      transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.14s;
    }
    .ec-btn-3d:hover {
      transform: translateY(-3px) scale(1.04);
      filter: brightness(1.06);
    }
    .ec-btn-3d:active {
      transform: translateY(3px) scale(0.95);
    }
    .ec-btn-green {
      background: linear-gradient(180deg, #55efc4 0%, #00b894 55%, #009473 100%);
      box-shadow: 0 6px 0 #006b53, 0 10px 18px rgba(0,0,0,0.18);
    }
    .ec-btn-orange {
      background: linear-gradient(180deg, #ffeaa7 0%, #fdcb6e 45%, #e17055 100%);
      box-shadow: 0 6px 0 #b33939, 0 10px 18px rgba(0,0,0,0.18);
    }
    .ec-btn-blue {
      background: linear-gradient(180deg, #74b9ff 0%, #0984e3 65%, #0652dd 100%);
      box-shadow: 0 6px 0 #043896, 0 10px 18px rgba(0,0,0,0.18);
    }
    .ec-btn-pink {
      background: linear-gradient(180deg, #fd79a8 0%, #e84393 65%, #b33771 100%);
      box-shadow: 0 6px 0 #7c224d, 0 10px 18px rgba(0,0,0,0.18);
    }
    .ec-btn-red {
      background: linear-gradient(180deg, #ff7675 0%, #d63031 65%, #b33939 100%);
      box-shadow: 0 6px 0 #7a1c1c, 0 10px 18px rgba(0,0,0,0.18);
    }
    .ec-world-card {
      position: relative;
      z-index: 6;
      pointer-events: auto;
      border-radius: 28px;
      padding: 16px 14px;
      border: 4px solid #ffffff;
      box-shadow: 0 10px 0 rgba(44,62,80,0.2), 0 16px 28px rgba(0,0,0,0.15);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      overflow: hidden;
      color: #ffffff;
      text-shadow: 0 2px 4px rgba(0,0,0,0.28);
    }
    .ec-world-card:hover {
      transform: translateY(-7px) scale(1.03);
    }
    .ec-world-card:active {
      transform: translateY(2px) scale(0.97);
    }
    .ec-play-stage {
      flex: 1;
      width: 100%;
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(8px);
      border: 5px solid rgba(255, 255, 255, 0.95);
      border-radius: 34px;
      box-shadow: 0 14px 32px rgba(0,0,0,0.14), inset 0 4px 14px rgba(255,255,255,0.8);
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      animation: ecStagePop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .ec-mascot-dock {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 8px;
      justify-content: center;
    }
    .ec-speech-bubble {
      background: linear-gradient(180deg, #ffffff, #fffdf0);
      border: 4px solid #f39c12;
      border-radius: 24px;
      padding: 10px 20px;
      font-weight: 900;
      font-size: 1.08rem;
      color: #2c3e50;
      box-shadow: 0 6px 0 rgba(243,156,18,0.28);
      max-width: 680px;
    }
    .ec-progress-track {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.9);
      padding: 6px 12px;
      border-radius: 999px;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 0 rgba(0,0,0,0.12);
    }
    .ec-progress-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #dfe6e9;
      border: 2px solid #b2bec3;
      transition: transform 0.25s, background 0.25s;
    }
    .ec-progress-dot.done {
      background: linear-gradient(180deg, #ffeaa7, #f39c12);
      border-color: #d35400;
      transform: scale(1.12);
    }
    .ec-progress-dot.current {
      background: linear-gradient(180deg, #55efc4, #00b894);
      border-color: #006b53;
      transform: scale(1.25);
    }
    .ec-hidden-bonus {
      position: absolute;
      z-index: 6;
      cursor: pointer;
      font-size: 2.1rem;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));
      animation: ecFloatBob 2.4s ease-in-out infinite;
      transition: transform 0.15s;
    }
    .ec-hidden-bonus:hover {
      transform: scale(1.28);
    }
    .ec-level-node {
      width: 122px;
      height: 122px;
      border-radius: 50%;
      border: 6px solid #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #ffffff;
      font-weight: 900;
      text-shadow: 0 2px 3px rgba(0,0,0,0.3);
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
    }
    .ec-level-node.unlocked {
      background: radial-gradient(circle at 30% 25%, #ffeaa7, #f39c12 58%, #d35400 100%);
      box-shadow: 0 10px 0 #9c4100, 0 16px 24px rgba(0,0,0,0.25);
    }
    .ec-level-node.unlocked:hover {
      transform: translateY(-8px) scale(1.08);
    }
    .ec-level-node.locked {
      background: radial-gradient(circle at 30% 25%, #b2bec3, #636e72 75%);
      box-shadow: 0 8px 0 #2d3436;
      cursor: not-allowed;
      opacity: 0.82;
    }
    .ec-mascot-anim {
      display: inline-block;
      transform-origin: bottom center;
    }
    .ec-mood-idle { animation: ecIdleBreath 2.2s ease-in-out infinite; }
    .ec-mood-happy { animation: ecHappyJump 0.55s ease-in-out infinite; }
    .ec-mood-confused { animation: ecConfusedWobble 0.9s ease-in-out infinite; }
    .ec-mood-celebrate { animation: ecCelebrateSpin 0.7s ease-in-out infinite; }
    .ec-cloud-drift { animation: ecCloudDrift 26s linear infinite; }
    .ec-cloud-drift-slow { animation: ecCloudDrift 38s linear infinite; }
    .ec-sway { transform-origin: bottom center; animation: ecSwayTree 3.6s ease-in-out infinite; }
    .ec-butterfly { animation: ecButterflyFly 7s ease-in-out infinite; }
    .ec-particle {
      position: fixed;
      pointer-events: none;
      z-index: 99;
      font-size: 1.5rem;
      animation: ecParticleBurst 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes ecStagePop {
      0% { opacity: 0; transform: scale(0.94) translateY(14px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes ecIdleBreath {
      0%, 100% { transform: translateY(0) scaleY(1); }
      50% { transform: translateY(-5px) scaleY(1.03); }
    }
    @keyframes ecHappyJump {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-16px) scale(1.08); }
    }
    @keyframes ecConfusedWobble {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-8deg); }
      75% { transform: rotate(8deg); }
    }
    @keyframes ecCelebrateSpin {
      0%, 100% { transform: translateY(0) rotate(-6deg) scale(1.05); }
      50% { transform: translateY(-20px) rotate(6deg) scale(1.12); }
    }
    @keyframes ecCloudDrift {
      0% { transform: translateX(-140px); }
      100% { transform: translateX(1320px); }
    }
    @keyframes ecSwayTree {
      0%, 100% { transform: rotate(-2deg); }
      50% { transform: rotate(2.5deg); }
    }
    @keyframes ecButterflyFly {
      0%, 100% { transform: translate(0, 0) rotate(-6deg); }
      25% { transform: translate(45px, -22px) rotate(8deg); }
      50% { transform: translate(90px, 6px) rotate(-4deg); }
      75% { transform: translate(35px, 18px) rotate(6deg); }
    }
    @keyframes ecFloatBob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes ecParticleBurst {
      0% { opacity: 1; transform: translate(0, 0) scale(0.5) rotate(0deg); }
      100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1.35) rotate(260deg); }
    }
  `;
  document.head.appendChild(style);
}

export function getWorldTheme(categoryId = "hub") {
  const themes = {
    hub: {
      skyTop: "#4facfe",
      skyBot: "#a1ffce",
      hillBack: "#7bed9f",
      hillFront: "#2ed573",
      cardGrad: "linear-gradient(145deg,#ff9ff3,#f368e0)",
      bonusIcon: "🦋",
      bonusLabel: "Kupu-kupu Ajaib",
    },
    angka: {
      skyTop: "#56ccf2",
      skyBot: "#fef9e7",
      hillBack: "#a3cb38",
      hillFront: "#27ae60",
      cardGrad: "linear-gradient(145deg,#ffbe76,#f0932b)",
      bonusIcon: "🍓",
      bonusLabel: "Stroberi Rahasia",
    },
    huruf: {
      skyTop: "#74b9ff",
      skyBot: "#dfe6e9",
      hillBack: "#a29bfe",
      hillFront: "#6c5ce7",
      cardGrad: "linear-gradient(145deg,#74b9ff,#0984e3)",
      bonusIcon: "🎈",
      bonusLabel: "Balon Huruf Emas",
    },
    warna_bentuk: {
      skyTop: "#ff9ff3",
      skyBot: "#ffeaa7",
      hillBack: "#55efc4",
      hillFront: "#00b894",
      cardGrad: "linear-gradient(145deg,#ff9ff3,#e84393)",
      bonusIcon: "🌈",
      bonusLabel: "Permata Pelangi",
    },
    hewan_alam: {
      skyTop: "#48dbfb",
      skyBot: "#c8f7c5",
      hillBack: "#58b19f",
      hillFront: "#1dd1a1",
      cardGrad: "linear-gradient(145deg,#55efc4,#10ac84)",
      bonusIcon: "🐝",
      bonusLabel: "Lebah Madu Lucu",
    },
    tubuh_harian: {
      skyTop: "#81ecec",
      skyBot: "#fff3cd",
      hillBack: "#fab1a0",
      hillFront: "#7bed9f",
      cardGrad: "linear-gradient(145deg,#ffeaa7,#e17055)",
      bonusIcon: "🫧",
      bonusLabel: "Gelembung Sabun",
    },
    logika_kreasi: {
      skyTop: "#a29bfe",
      skyBot: "#ffeaa7",
      hillBack: "#81ecec",
      hillFront: "#00cec9",
      cardGrad: "linear-gradient(145deg,#a29bfe,#6c5ce7)",
      bonusIcon: "🌟",
      bonusLabel: "Bintang Ide",
    },
  };
  return themes[categoryId] || themes.hub;
}

export function renderWorldBackgroundSVG(categoryId = "hub") {
  const t = getWorldTheme(categoryId);
  let decorSvg = "";

  if (categoryId === "angka") {
    decorSvg = `
      <g class="ec-sway">
        <rect x="115" y="455" width="32" height="110" rx="10" fill="#8d5524"/>
        <circle cx="131" cy="430" r="68" fill="#2ecc71"/>
        <circle cx="105" cy="420" r="11" fill="#e74c3c"/>
        <circle cx="152" cy="405" r="11" fill="#e74c3c"/>
        <circle cx="136" cy="450" r="11" fill="#f1c40f"/>
      </g>
      <g class="ec-sway">
        <rect x="1095" y="465" width="30" height="100" rx="10" fill="#8d5524"/>
        <circle cx="1110" cy="435" r="64" fill="#27ae60"/>
        <circle cx="1088" cy="430" r="11" fill="#f39c12"/>
        <circle cx="1132" cy="422" r="11" fill="#e74c3c"/>
      </g>
    `;
  } else if (categoryId === "warna_bentuk") {
    decorSvg = `
      <path d="M 180 540 A 460 360 0 0 1 1100 540" fill="none" stroke="#ff7675" stroke-width="24" opacity="0.65"/>
      <path d="M 204 540 A 436 336 0 0 1 1076 540" fill="none" stroke="#ffeaa7" stroke-width="24" opacity="0.7"/>
      <path d="M 228 540 A 412 312 0 0 1 1052 540" fill="none" stroke="#55efc4" stroke-width="24" opacity="0.65"/>
      <path d="M 252 540 A 388 288 0 0 1 1028 540" fill="none" stroke="#74b9ff" stroke-width="24" opacity="0.65"/>
      <rect x="90" y="530" width="54" height="54" rx="12" fill="#e84393" opacity="0.85"/>
      <polygon points="1140,515 1190,595 1090,595" fill="#f1c40f" opacity="0.88"/>
    `;
  } else if (categoryId === "huruf") {
    decorSvg = `
      <g class="ec-butterfly">
        <circle cx="170" cy="230" r="32" fill="#ff7675"/>
        <text x="170" y="241" text-anchor="middle" font-size="30" font-weight="900" fill="#fff">A</text>
        <line x1="170" y1="262" x2="170" y2="305" stroke="#fff" stroke-width="3"/>
      </g>
      <g class="ec-butterfly">
        <circle cx="1060" cy="215" r="32" fill="#fdcb6e"/>
        <text x="1060" y="226" text-anchor="middle" font-size="30" font-weight="900" fill="#2c3e50">B</text>
        <line x1="1060" y1="247" x2="1060" y2="290" stroke="#fff" stroke-width="3"/>
      </g>
    `;
  } else if (categoryId === "hewan_alam") {
    decorSvg = `
      <ellipse cx="640" cy="665" rx="340" ry="48" fill="#48dbfb" opacity="0.8"/>
      <ellipse cx="640" cy="665" rx="280" ry="26" fill="#81ecec" opacity="0.6"/>
      <g class="ec-sway">
        <rect x="90" y="420" width="28" height="160" rx="8" fill="#795548"/>
        <ellipse cx="104" cy="400" rx="75" ry="24" fill="#2ecc71"/>
        <ellipse cx="104" cy="420" rx="68" ry="22" fill="#27ae60"/>
      </g>
    `;
  } else if (categoryId === "tubuh_harian") {
    decorSvg = `
      <g>
        <rect x="78" y="455" width="130" height="105" rx="14" fill="#ffeaa7" stroke="#e17055" stroke-width="5"/>
        <polygon points="64,462 143,392 222,462" fill="#e17055"/>
        <rect x="122" y="505" width="42" height="55" rx="8" fill="#d35400"/>
        <circle cx="102" cy="495" r="14" fill="#74b9ff"/>
      </g>
    `;
  } else {
    decorSvg = `
      <g class="ec-butterfly">
        <polygon points="150,200 162,226 190,230 170,248 174,276 150,262 126,276 130,248 110,230 138,226" fill="#ffeaa7"/>
      </g>
      <g class="ec-butterfly">
        <rect x="1070" y="490" width="60" height="60" rx="14" fill="#fd79a8"/>
        <rect x="1115" y="445" width="52" height="52" rx="12" fill="#74b9ff"/>
      </g>
    `;
  }

  return `
    <svg class="ec-world-bg" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="ecSkyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${t.skyTop}"/>
          <stop offset="100%" stop-color="${t.skyBot}"/>
        </linearGradient>
        <radialGradient id="ecSunGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff9db"/>
          <stop offset="65%" stop-color="#ffeaa7"/>
          <stop offset="100%" stop-color="#feca57" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#ecSkyGrad)"/>
      <circle cx="1110" cy="115" r="95" fill="url(#ecSunGrad)"/>
      <circle cx="1110" cy="115" r="46" fill="#ffeaa7"/>

      <g class="ec-cloud-drift" opacity="0.88">
        <rect x="0" y="72" width="150" height="46" rx="23" fill="#ffffff"/>
        <circle cx="48" cy="70" r="30" fill="#ffffff"/>
        <circle cx="102" cy="64" r="36" fill="#ffffff"/>
      </g>
      <g class="ec-cloud-drift-slow" opacity="0.72">
        <rect x="-240" y="145" width="126" height="38" rx="19" fill="#ffffff"/>
        <circle cx="-200" cy="142" r="24" fill="#ffffff"/>
        <circle cx="-158" cy="138" r="28" fill="#ffffff"/>
      </g>

      <ellipse cx="260" cy="640" rx="420" ry="185" fill="${t.hillBack}"/>
      <ellipse cx="1020" cy="650" rx="440" ry="195" fill="${t.hillBack}"/>
      <ellipse cx="640" cy="700" rx="760" ry="165" fill="${t.hillFront}"/>

      ${decorSvg}

      <g opacity="0.9">
        <circle cx="240" cy="645" r="9" fill="#ff7675"/>
        <circle cx="240" cy="645" r="4" fill="#ffeaa7"/>
        <circle cx="420" cy="672" r="8" fill="#fd79a8"/>
        <circle cx="420" cy="672" r="3.5" fill="#ffffff"/>
        <circle cx="880" cy="655" r="9" fill="#ffeaa7"/>
        <circle cx="880" cy="655" r="4" fill="#e17055"/>
        <circle cx="1040" cy="675" r="8" fill="#74b9ff"/>
        <circle cx="1040" cy="675" r="3.5" fill="#ffffff"/>
      </g>
    </svg>
  `;
}

export function renderMascotSVG(charId = "kiko", mood = "idle", size = 86) {
  const palettes = {
    kiko: {
      fur1: "#feca57",
      fur2: "#e67e22",
      belly: "#fff5e6",
      shirt1: "#54a0ff",
      shirt2: "#2e86de",
      ear: "#e67e22",
    },
    bobi: {
      fur1: "#d38b5d",
      fur2: "#8d5524",
      belly: "#ffeaa7",
      shirt1: "#ff6b6b",
      shirt2: "#ee5253",
      ear: "#8d5524",
    },
    cici: {
      fur1: "#ffffff",
      fur2: "#dcdde1",
      belly: "#ffeef8",
      shirt1: "#ff9ff3",
      shirt2: "#f368e0",
      ear: "#ff9ff3",
    },
    prof_panda: {
      fur1: "#ffffff",
      fur2: "#dfe6e9",
      belly: "#ffffff",
      shirt1: "#55efc4",
      shirt2: "#00b894",
      ear: "#2d3436",
    },
  };
  const p = palettes[charId] || palettes.kiko;

  const eyesSvg =
    mood === "happy" || mood === "celebrate"
      ? `<path d="M 41 56 Q 48 48 55 56" fill="none" stroke="#2c3e50" stroke-width="4" stroke-linecap="round"/>
         <path d="M 65 56 Q 72 48 79 56" fill="none" stroke="#2c3e50" stroke-width="4" stroke-linecap="round"/>`
      : mood === "confused"
        ? `<circle cx="48" cy="54" r="6" fill="#2c3e50"/><circle cx="50" cy="52" r="2" fill="#fff"/>
           <circle cx="72" cy="56" r="5" fill="#2c3e50"/><circle cx="74" cy="54" r="1.8" fill="#fff"/>
           <text x="90" y="34" font-size="22" font-weight="900" fill="#e67e22">?</text>`
        : `<circle cx="48" cy="55" r="6.2" fill="#2c3e50"/><circle cx="50" cy="52.5" r="2.2" fill="#fff"/>
           <circle cx="72" cy="55" r="6.2" fill="#2c3e50"/><circle cx="74" cy="52.5" r="2.2" fill="#fff"/>`;

  const mouthSvg =
    mood === "happy" || mood === "celebrate"
      ? `<path d="M 52 68 Q 60 79 68 68 Z" fill="#e84393" stroke="#2c3e50" stroke-width="2.5"/>`
      : mood === "confused"
        ? `<circle cx="60" cy="71" r="4" fill="#2c3e50"/>`
        : `<path d="M 53 68 Q 60 75 67 68" fill="none" stroke="#2c3e50" stroke-width="3" stroke-linecap="round"/>`;

  const armAngle = mood === "happy" || mood === "celebrate" ? -42 : 12;

  return `
    <div class="ec-mascot-anim ec-mood-${mood}" style="width:${size}px; height:${size}px;">
      <svg width="${size}" height="${size}" viewBox="0 0 120 120">
        <defs>
          <radialGradient id="ecFur_${charId}" cx="35%" cy="28%" r="70%">
            <stop offset="0%" stop-color="${p.fur1}"/>
            <stop offset="100%" stop-color="${p.fur2}"/>
          </radialGradient>
          <linearGradient id="ecShirt_${charId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${p.shirt1}"/>
            <stop offset="100%" stop-color="${p.shirt2}"/>
          </linearGradient>
        </defs>
        <ellipse cx="60" cy="112" rx="34" ry="7" fill="rgba(0,0,0,0.2)"/>
        <g transform="rotate(${armAngle} 32 82)">
          <rect x="16" y="74" width="22" height="14" rx="7" fill="url(#ecFur_${charId})" stroke="#2c3e50" stroke-width="3.5"/>
        </g>
        <g transform="rotate(${-armAngle} 88 82)">
          <rect x="82" y="74" width="22" height="14" rx="7" fill="url(#ecFur_${charId})" stroke="#2c3e50" stroke-width="3.5"/>
        </g>
        <rect x="36" y="74" width="48" height="34" rx="18" fill="url(#ecShirt_${charId})" stroke="#2c3e50" stroke-width="4"/>
        <ellipse cx="60" cy="92" rx="13" ry="11" fill="${p.belly}"/>
        <circle cx="34" cy="28" r="14" fill="${p.ear}" stroke="#2c3e50" stroke-width="4"/>
        <circle cx="86" cy="28" r="14" fill="${p.ear}" stroke="#2c3e50" stroke-width="4"/>
        <circle cx="34" cy="28" r="7" fill="#ffeaa7" opacity="0.7"/>
        <circle cx="86" cy="28" r="7" fill="#ffeaa7" opacity="0.7"/>
        <rect x="24" y="24" width="72" height="58" rx="28" fill="url(#ecFur_${charId})" stroke="#2c3e50" stroke-width="4"/>
        <ellipse cx="46" cy="34" rx="14" ry="6" fill="rgba(255,255,255,0.4)"/>
        <circle cx="38" cy="64" r="6" fill="#ff9ff3" opacity="0.65"/>
        <circle cx="82" cy="64" r="6" fill="#ff9ff3" opacity="0.65"/>
        <ellipse cx="60" cy="66" rx="14" ry="10" fill="${p.belly}"/>
        <ellipse cx="60" cy="61" rx="5" ry="3.5" fill="#2c3e50"/>
        ${eyesSvg}
        ${mouthSvg}
      </svg>
    </div>
  `;
}

export function spawnConfettiBurst(count = 20) {
  const symbols = ["⭐", "✨", "🎉", "💛", "🌈", "🎈"];
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "ec-particle";
    el.textContent = symbols[i % symbols.length];
    el.style.left = `${cx}px`;
    el.style.top = `${cy}px`;
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const dist = 120 + Math.random() * 240;
    el.style.setProperty("--dx", `${Math.round(Math.cos(angle) * dist)}px`);
    el.style.setProperty(
      "--dy",
      `${Math.round(Math.sin(angle) * dist - 60)}px`,
    );
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1050);
  }
}
