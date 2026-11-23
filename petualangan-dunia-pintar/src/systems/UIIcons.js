const SVG_PATHS = {
  play: '<polygon points="6 4 21 12 6 20 6 4" fill="#0ea5e9" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>',
  compass:
    '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><polygon points="16.5 7.5 14 14 7.5 16.5 10 10 16.5 7.5" fill="currentColor"/>',
  swords:
    '<path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M9.5 6.5L18 3h3v3l-8.5 8.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="9" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2.2"/>',
  settings:
    '<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" fill="none" stroke="currentColor" stroke-width="1.9"/>',
  gamepad:
    '<rect x="2" y="6" width="20" height="12" rx="4" fill="none" stroke="currentColor" stroke-width="2.2"/><line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><line x1="8" y1="10" x2="8" y2="14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="15.5" cy="11" r="1.2" fill="currentColor"/><circle cx="18" cy="13" r="1.2" fill="currentColor"/>',
  shield:
    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
  info: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="8" r="1.2" fill="currentColor"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
  home: '<path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
  pause:
    '<rect x="6" y="4" width="4" height="16" rx="1.5" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1.5" fill="currentColor"/>',
  coin: '<circle cx="12" cy="12" r="9" fill="#fbbf24" stroke="#b45309" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="#fef3c7" stroke-width="1.6"/>',
  star: '<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.7 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2" fill="#facc15" stroke="#b45309" stroke-width="1.6" stroke-linejoin="round"/>',
  gem: '<polygon points="12 2 21 9 12 22 3 9 12 2" fill="#38bdf8" stroke="#0369a1" stroke-width="1.8" stroke-linejoin="round"/>',
  heart:
    '<path d="M12 21s-7.5-4.8-9.5-9.2C1 8.5 3.2 5 6.8 5c2.1 0 3.7 1.1 5.2 2.9C13.5 6.1 15.1 5 17.2 5 20.8 5 23 8.5 21.5 11.8 19.5 16.2 12 21 12 21z" fill="#ef4444" stroke="#991b1b" stroke-width="1.4"/>',
  heartEmpty:
    '<path d="M12 21s-7.5-4.8-9.5-9.2C1 8.5 3.2 5 6.8 5c2.1 0 3.7 1.1 5.2 2.9C13.5 6.1 15.1 5 17.2 5 20.8 5 23 8.5 21.5 11.8 19.5 16.2 12 21 12 21z" fill="rgba(15,23,42,0.35)" stroke="rgba(255,255,255,0.45)" stroke-width="1.8"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5V5a2 2 0 0 1 2-2h14v18H6.5A2.5 2.5 0 0 1 4 19.5z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
  graduation:
    '<polygon points="12 3 2 8 12 13 22 8 12 3" fill="#1e293b" stroke="#facc15" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5" fill="none" stroke="#facc15" stroke-width="2" stroke-linecap="round"/>',
  trophy:
    '<path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4zM7 6H4a2 2 0 0 0 2 4h1M17 6h3a2 2 0 0 1-2 4h-1" fill="#facc15" stroke="#92400e" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  flag: '<path d="M4 21V4h13l-2.5 4.5L17 13H4" fill="#22c55e" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>',
  boss: '<path d="M5 10l2-5 5 3 5-3 2 5v5a7 7 0 0 1-14 0v-5z" fill="#ef4444" stroke="#fef08a" stroke-width="1.8"/><circle cx="9.5" cy="13" r="1.4" fill="#fef08a"/><circle cx="14.5" cy="13" r="1.4" fill="#fef08a"/>',
  check:
    '<polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke="currentColor" stroke-width="2.2"/>',
  sparkle:
    '<path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2L12 2z" fill="currentColor"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 4 13C4 7 10 3 20 3c0 10-4 17-9 17z" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M4 20l8-8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  calculator:
    '<rect x="4" y="2" width="16" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><line x1="8" y1="6" x2="16" y2="6" stroke="currentColor" stroke-width="2.2"/><circle cx="8" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="16" cy="12" r="1.2" fill="currentColor"/><circle cx="8" cy="16" r="1.2" fill="currentColor"/><circle cx="12" cy="16" r="1.2" fill="currentColor"/><circle cx="16" cy="16" r="1.2" fill="currentColor"/>',
  globe:
    '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="1.8"/>',
  palette:
    '<path d="M12 3a9 9 0 1 0 0 18h1.5a2.5 2.5 0 0 0 0-5H12a2 2 0 0 1 0-4h4a5 5 0 0 0-4-9z" fill="none" stroke="currentColor" stroke-width="2.2"/>',
  activity:
    '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  puzzle:
    '<path d="M19 11h-2a2 2 0 1 1 0-4h2V5a1 1 0 0 0-1-1h-4v2a2 2 0 1 1-4 0V4H6a1 1 0 0 0-1 1v4h2a2 2 0 1 1 0 4H5v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
};

export const uiIcons = {
  get(name, size = 20) {
    const path = SVG_PATHS[name] || SVG_PATHS.sparkle;
    return `<span class="pdp-icon" style="width:${size}px;height:${size}px;"><svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg></span>`;
  },

  forSubject(subjectId) {
    const map = {
      matematika: "calculator",
      ipas: "leaf",
      bahasa_indonesia: "book",
      bahasa_inggris: "globe",
      pendidikan_pancasila: "shield",
      seni_rupa: "palette",
      pai: "sparkle",
      bahasa_madura: "compass",
      pjok: "activity",
    };
    return this.get(map[subjectId] || "book", 26);
  },

  renderHearts(current, max) {
    const total = Math.max(1, Number(max) || 4);
    const filled = Math.max(0, Math.min(total, Number(current) || 0));
    let html = "";
    for (let i = 0; i < total; i++) {
      html += this.get(i < filled ? "heart" : "heartEmpty", 18);
    }
    return `<span class="hud-pill-hearts">${html}</span>`;
  },
};
