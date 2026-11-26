
class QuestionVisualRenderer {
  render(visualId) {
    if (!visualId) return "";
    const svgContent = this.getSvgById(visualId);
    if (!svgContent) return "";
    return `
      <div class="pdp-quiz-visual-box" style="display:flex;justify-content:center;align-items:center;background:#ffffff;border:2px solid #e2e8f0;border-radius:14px;padding:10px;margin-bottom:10px;">
        ${svgContent}
      </div>
    `;
  }

  getSvgById(id) {
    const map = {

      sr_line_wavy: `
        <svg width="260" height="84" viewBox="0 0 260 84" aria-label="Garis bergelombang">
          <rect width="260" height="84" rx="10" fill="#eff6ff"/>
          <path d="M18 32 Q 42 10, 66 32 T 114 32 T 162 32 T 210 32 T 242 32" fill="none" stroke="#0284c7" stroke-width="5" stroke-linecap="round"/>
          <path d="M18 58 Q 42 36, 66 58 T 114 58 T 162 58 T 210 58 T 242 58" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
        </svg>`,
      sr_line_zigzag: `
        <svg width="260" height="84" viewBox="0 0 260 84" aria-label="Garis zig-zag">
          <rect width="260" height="84" rx="10" fill="#fef2f2"/>
          <polyline points="20,62 55,20 90,62 125,20 160,62 195,20 235,62" fill="none" stroke="#dc2626" stroke-width="5" stroke-linejoin="miter" stroke-linecap="round"/>
        </svg>`,
      sr_line_vertical: `
        <svg width="260" height="84" viewBox="0 0 260 84" aria-label="Garis lurus vertikal">
          <rect width="260" height="84" rx="10" fill="#f8fafc"/>
          <line x1="55" y1="12" x2="55" y2="72" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
          <line x1="105" y1="12" x2="105" y2="72" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
          <line x1="155" y1="12" x2="155" y2="72" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
          <line x1="205" y1="12" x2="205" y2="72" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
        </svg>`,
      sr_line_spiral: `
        <svg width="260" height="90" viewBox="0 0 260 90" aria-label="Garis spiral">
          <rect width="260" height="90" rx="10" fill="#fdf4ff"/>
          <path d="M130 45 m 0,0 a 6,6 0 1,1 12,0 a 12,12 0 1,1 -24,0 a 18,18 0 1,1 36,0 a 24,24 0 1,1 -48,0 a 30,30 0 1,1 60,0" fill="none" stroke="#9333ea" stroke-width="4.5" stroke-linecap="round"/>
        </svg>`,
      sr_shape_geometric: `
        <svg width="280" height="92" viewBox="0 0 280 92" aria-label="Bentuk geometris">
          <rect width="280" height="92" rx="10" fill="#f0fdf4"/>
          <rect x="24" y="20" width="52" height="52" fill="#3b82f6" stroke="#1e3a8a" stroke-width="3"/>
          <polygon points="140,16 174,74 106,74" fill="#f59e0b" stroke="#92400e" stroke-width="3"/>
          <circle cx="228" cy="46" r="28" fill="#ef4444" stroke="#991b1b" stroke-width="3"/>
        </svg>`,
      sr_shape_organic: `
        <svg width="280" height="92" viewBox="0 0 280 92" aria-label="Bentuk organik">
          <rect width="280" height="92" rx="10" fill="#ecfeff"/>
          <path d="M40 60 C25 60 22 40 38 36 C42 20 68 18 76 32 C92 32 94 58 76 60 Z" fill="#ffffff" stroke="#0284c7" stroke-width="3"/>
          <path d="M142 74 C122 50 132 18 164 16 C174 44 166 68 142 74 Z" fill="#22c55e" stroke="#166534" stroke-width="3"/>
          <path d="M210 66 C198 52 206 28 228 24 C252 22 264 46 250 64 C238 74 220 74 210 66 Z" fill="#94a3b8" stroke="#334155" stroke-width="3"/>
        </svg>`,

      sr_color_primary: `
        <svg width="260" height="86" viewBox="0 0 260 86" aria-label="Tiga warna primer">
          <rect width="260" height="86" rx="10" fill="#f8fafc"/>
          <circle cx="62" cy="43" r="26" fill="#ef4444" stroke="#991b1b" stroke-width="3"/>
          <circle cx="130" cy="43" r="26" fill="#facc15" stroke="#a16207" stroke-width="3"/>
          <circle cx="198" cy="43" r="26" fill="#2563eb" stroke="#1e3a8a" stroke-width="3"/>
        </svg>`,
      sr_color_mix_ry: `
        <svg width="270" height="82" viewBox="0 0 270 82" aria-label="Campuran merah dan kuning">
          <rect width="270" height="82" rx="10" fill="#fffbeb"/>
          <circle cx="52" cy="41" r="24" fill="#ef4444" stroke="#7f1d1d" stroke-width="2.5"/>
          <text x="90" y="49" font-size="24" font-weight="900" fill="#334155">+</text>
          <circle cx="132" cy="41" r="24" fill="#facc15" stroke="#854d0e" stroke-width="2.5"/>
          <text x="172" y="49" font-size="24" font-weight="900" fill="#334155">=</text>
          <circle cx="218" cy="41" r="24" fill="#e2e8f0" stroke="#64748b" stroke-width="2.5" stroke-dasharray="5,4"/>
          <text x="218" y="49" text-anchor="middle" font-size="22" font-weight="900" fill="#334155">?</text>
        </svg>`,
      sr_color_mix_yb: `
        <svg width="270" height="82" viewBox="0 0 270 82" aria-label="Campuran kuning dan biru">
          <rect width="270" height="82" rx="10" fill="#f0fdf4"/>
          <circle cx="52" cy="41" r="24" fill="#facc15" stroke="#854d0e" stroke-width="2.5"/>
          <text x="90" y="49" font-size="24" font-weight="900" fill="#334155">+</text>
          <circle cx="132" cy="41" r="24" fill="#2563eb" stroke="#1e3a8a" stroke-width="2.5"/>
          <text x="172" y="49" font-size="24" font-weight="900" fill="#334155">=</text>
          <circle cx="218" cy="41" r="24" fill="#e2e8f0" stroke="#64748b" stroke-width="2.5" stroke-dasharray="5,4"/>
          <text x="218" y="49" text-anchor="middle" font-size="22" font-weight="900" fill="#334155">?</text>
        </svg>`,
      sr_color_mix_rb: `
        <svg width="270" height="82" viewBox="0 0 270 82" aria-label="Campuran merah dan biru">
          <rect width="270" height="82" rx="10" fill="#faf5ff"/>
          <circle cx="52" cy="41" r="24" fill="#ef4444" stroke="#7f1d1d" stroke-width="2.5"/>
          <text x="90" y="49" font-size="24" font-weight="900" fill="#334155">+</text>
          <circle cx="132" cy="41" r="24" fill="#2563eb" stroke="#1e3a8a" stroke-width="2.5"/>
          <text x="172" y="49" font-size="24" font-weight="900" fill="#334155">=</text>
          <circle cx="218" cy="41" r="24" fill="#e2e8f0" stroke="#64748b" stroke-width="2.5" stroke-dasharray="5,4"/>
          <text x="218" y="49" text-anchor="middle" font-size="22" font-weight="900" fill="#334155">?</text>
        </svg>`,
      sr_color_wheel: `
        <svg width="160" height="124" viewBox="0 0 160 124" aria-label="Roda warna 6 bagian">
          <g transform="translate(80,62)">
            <path d="M0,0 L0,-52 A52,52 0 0,1 45,-26 Z" fill="#ef4444" stroke="#fff" stroke-width="2"/>
            <path d="M0,0 L45,-26 A52,52 0 0,1 45,26 Z" fill="#f97316" stroke="#fff" stroke-width="2"/>
            <path d="M0,0 L45,26 A52,52 0 0,1 0,52 Z" fill="#facc15" stroke="#fff" stroke-width="2"/>
            <path d="M0,0 L0,52 A52,52 0 0,1 -45,26 Z" fill="#22c55e" stroke="#fff" stroke-width="2"/>
            <path d="M0,0 L-45,26 A52,52 0 0,1 -45,-26 Z" fill="#2563eb" stroke="#fff" stroke-width="2"/>
            <path d="M0,0 L-45,-26 A52,52 0 0,1 0,-52 Z" fill="#9333ea" stroke="#fff" stroke-width="2"/>
            <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
          </g>
        </svg>`,

      sr_story_panels: `
        <svg width="290" height="94" viewBox="0 0 290 94" aria-label="Contoh gambar cerita 3 panel">
          <rect x="6" y="8" width="84" height="78" rx="8" fill="#e0f2fe" stroke="#0369a1" stroke-width="2.5"/>
          <circle cx="30" cy="30" r="10" fill="#facc15"/>
          <circle cx="52" cy="56" r="11" fill="#fb923c"/>
          <text x="48" y="80" text-anchor="middle" font-size="10" font-weight="800" fill="#0c4a6e">1. Pagi</text>
          <rect x="103" y="8" width="84" height="78" rx="8" fill="#fef3c7" stroke="#b45309" stroke-width="2.5"/>
          <rect x="122" y="42" width="44" height="24" rx="4" fill="#22c55e"/>
          <text x="145" y="80" text-anchor="middle" font-size="10" font-weight="800" fill="#78350f">2. Menanam</text>
          <rect x="200" y="8" width="84" height="78" rx="8" fill="#dcfce7" stroke="#15803d" stroke-width="2.5"/>
          <circle cx="242" cy="40" r="16" fill="#16a34a"/>
          <rect x="238" y="54" width="8" height="16" fill="#78350f"/>
          <text x="242" y="80" text-anchor="middle" font-size="10" font-weight="800" fill="#14532d">3. Tumbuh</text>
        </svg>`,
      sr_art_tools: `
        <svg width="270" height="82" viewBox="0 0 270 82" aria-label="Alat gambar cerita">
          <rect width="270" height="82" rx="10" fill="#fffbeb"/>
          <rect x="22" y="24" width="66" height="12" rx="3" fill="#facc15" stroke="#854d0e" stroke-width="2"/>
          <polygon points="88,24 102,30 88,36" fill="#fed7aa" stroke="#854d0e" stroke-width="2"/>
          <rect x="118" y="20" width="38" height="22" rx="5" fill="#f472b6" stroke="#9d174d" stroke-width="2"/>
          <rect x="174" y="18" width="76" height="16" rx="3" fill="#38bdf8" stroke="#0369a1" stroke-width="2"/>
          <line x1="186" y1="18" x2="186" y2="26" stroke="#0369a1" stroke-width="2"/>
          <line x1="202" y1="18" x2="202" y2="26" stroke="#0369a1" stroke-width="2"/>
          <line x1="218" y1="18" x2="218" y2="26" stroke="#0369a1" stroke-width="2"/>
          <line x1="234" y1="18" x2="234" y2="26" stroke="#0369a1" stroke-width="2"/>
          <text x="58" y="66" text-anchor="middle" font-size="11" font-weight="800" fill="#475569">Pensil</text>
          <text x="137" y="66" text-anchor="middle" font-size="11" font-weight="800" fill="#475569">Penghapus</text>
          <text x="212" y="66" text-anchor="middle" font-size="11" font-weight="800" fill="#475569">Penggaris</text>
        </svg>`,

      sr_comp_symmetric: `
        <svg width="260" height="96" viewBox="0 0 260 96" aria-label="Komposisi simetris">
          <rect width="260" height="96" rx="10" fill="#eff6ff"/>
          <line x1="130" y1="8" x2="130" y2="88" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5,4"/>
          <circle cx="72" cy="48" r="24" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2.5"/>
          <rect x="26" y="34" width="22" height="28" rx="4" fill="#f59e0b"/>
          <circle cx="188" cy="48" r="24" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2.5"/>
          <rect x="212" y="34" width="22" height="28" rx="4" fill="#f59e0b"/>
        </svg>`,
      sr_comp_asymmetric: `
        <svg width="260" height="96" viewBox="0 0 260 96" aria-label="Komposisi asimetris">
          <rect width="260" height="96" rx="10" fill="#fefce8"/>
          <line x1="130" y1="8" x2="130" y2="88" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5,4"/>
          <circle cx="68" cy="48" r="30" fill="#ef4444" stroke="#991b1b" stroke-width="2.5"/>
          <rect x="154" y="24" width="28" height="24" rx="4" fill="#22c55e"/>
          <polygon points="212,24 232,54 192,54" fill="#3b82f6"/>
          <circle cx="188" cy="70" r="12" fill="#f59e0b"/>
        </svg>`,
      sr_comp_radial: `
        <svg width="160" height="114" viewBox="0 0 160 114" aria-label="Komposisi radial">
          <rect width="160" height="114" rx="10" fill="#fdf4ff"/>
          <g transform="translate(80,57)">
            <ellipse cx="0" cy="-28" rx="10" ry="18" fill="#ec4899"/>
            <ellipse cx="0" cy="28" rx="10" ry="18" fill="#ec4899"/>
            <ellipse cx="-28" cy="0" rx="18" ry="10" fill="#a855f7"/>
            <ellipse cx="28" cy="0" rx="18" ry="10" fill="#a855f7"/>
            <circle cx="0" cy="0" r="14" fill="#facc15" stroke="#a16207" stroke-width="2.5"/>
          </g>
        </svg>`,

      sr_texture_compare: `
        <svg width="280" height="92" viewBox="0 0 280 92" aria-label="Perbandingan tekstur kasar dan halus">
          <rect x="12" y="10" width="118" height="72" rx="10" fill="#fed7aa" stroke="#9a3412" stroke-width="2.5"/>
          <path d="M24 28 L34 20 L44 28 L54 20 L64 28 L74 20 L84 28 L94 20 L104 28 L114 20" fill="none" stroke="#9a3412" stroke-width="2.5"/>
          <path d="M24 46 L34 38 L44 46 L54 38 L64 46 L74 38 L84 46 L94 38 L104 46 L114 38" fill="none" stroke="#9a3412" stroke-width="2.5"/>
          <text x="71" y="72" text-anchor="middle" font-size="11" font-weight="800" fill="#7c2d12">Benda A (Kulit Kayu)</text>
          <rect x="150" y="10" width="118" height="72" rx="10" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5"/>
          <line x1="168" y1="24" x2="210" y2="24" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
          <text x="209" y="72" text-anchor="middle" font-size="11" font-weight="800" fill="#075985">Benda B (Kaca)</text>
        </svg>`,
      sr_texture_frottage: `
        <svg width="260" height="88" viewBox="0 0 260 88" aria-label="Teknik gosok koin di bawah kertas">
          <rect width="260" height="88" rx="10" fill="#f8fafc"/>
          <rect x="52" y="14" width="156" height="60" rx="6" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
          <circle cx="115" cy="44" r="20" fill="#e2e8f0" stroke="#64748b" stroke-width="2" stroke-dasharray="3,2"/>
          <line x1="100" y1="36" x2="130" y2="36" stroke="#475569" stroke-width="2"/>
          <line x1="98" y1="44" x2="132" y2="44" stroke="#475569" stroke-width="2"/>
          <line x1="100" y1="52" x2="130" y2="52" stroke="#475569" stroke-width="2"/>
          <rect x="148" y="24" width="44" height="12" rx="3" fill="#f59e0b" transform="rotate(-25 148 24)"/>
        </svg>`,
      sr_texture_animals: `
        <svg width="280" height="88" viewBox="0 0 280 88" aria-label="Tekstur permukaan hewan">
          <rect x="10" y="10" width="80" height="68" rx="10" fill="#fef3c7" stroke="#b45309" stroke-width="2"/>
          <circle cx="50" cy="36" r="14" fill="#fb923c"/>
          <text x="50" y="68" text-anchor="middle" font-size="11" font-weight="800" fill="#78350f">Kucing</text>
          <rect x="100" y="10" width="80" height="68" rx="10" fill="#e0f2fe" stroke="#0369a1" stroke-width="2"/>
          <ellipse cx="140" cy="36" rx="18" ry="11" fill="#38bdf8"/>
          <text x="140" y="68" text-anchor="middle" font-size="11" font-weight="800" fill="#075985">Ikan</text>
          <rect x="190" y="10" width="80" height="68" rx="10" fill="#dcfce7" stroke="#15803d" stroke-width="2"/>
          <ellipse cx="230" cy="36" rx="18" ry="13" fill="#16a34a"/>
          <text x="230" y="68" text-anchor="middle" font-size="11" font-weight="800" fill="#14532d">Kura-kura</text>
        </svg>`,

      en_family_tree: `
        <svg width="280" height="96" viewBox="0 0 280 96" aria-label="Bagan keluarga sederhana">
          <rect width="280" height="96" rx="10" fill="#f0f9ff"/>
          <rect x="38" y="10" width="88" height="26" rx="8" fill="#38bdf8"/>
          <text x="82" y="27" text-anchor="middle" font-size="11" font-weight="800" fill="#ffffff">Father (Mr. Ali)</text>
          <rect x="154" y="10" width="88" height="26" rx="8" fill="#f472b6"/>
          <text x="198" y="27" text-anchor="middle" font-size="11" font-weight="800" fill="#ffffff">Mother (Mrs. Ani)</text>
          <line x1="126" y1="23" x2="154" y2="23" stroke="#475569" stroke-width="2"/>
          <line x1="140" y1="23" x2="140" y2="56" stroke="#475569" stroke-width="2"/>
          <line x1="82" y1="56" x2="198" y2="56" stroke="#475569" stroke-width="2"/>
          <rect x="44" y="56" width="76" height="26" rx="8" fill="#22c55e"/>
          <text x="82" y="73" text-anchor="middle" font-size="11" font-weight="800" fill="#ffffff">Raka (Me)</text>
          <rect x="160" y="56" width="76" height="26" rx="8" fill="#a855f7"/>
          <text x="198" y="73" text-anchor="middle" font-size="11" font-weight="800" fill="#ffffff">Lina (Girl)</text>
        </svg>`,
    };

    return map[id] || "";
  }
}

export const questionVisualRenderer = new QuestionVisualRenderer();
