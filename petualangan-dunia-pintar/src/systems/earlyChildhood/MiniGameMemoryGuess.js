export function runMiniGameMemoryGuess({ container, activity, audio, onResult }) {
  const mode = activity.submode || 'memory';

  if (mode === 'odd_one_out') {
    const items = activity.items || ['🍎', '🍎', '🍌', '🍎'];
    const oddIdx = typeof activity.oddIdx === 'number' ? activity.oddIdx : 2;

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:14px;">
        <div style="font-weight:900; font-size:1.05rem; color:#2c3e50;">${activity.prompt}</div>
        <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">
          ${items.map((it, i) => `
            <button class="mg-odd-btn" data-idx="${i}" style="width:92px; height:92px; font-size:2.8rem; border-radius:18px; border:3px solid #3498db; background:#fff; cursor:pointer;">
              ${it}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('.mg-odd-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (Number(btn.dataset.idx) === oddIdx) {
          audio.play('correct');
          btn.style.background = '#d4efdf';
          btn.style.borderColor = '#27ae60';
          setTimeout(() => onResult(true, 'Jeli sekali! Kamu menemukan benda yang berbeda!'), 300);
        } else {
          audio.play('wrong');
          btn.style.background = '#fadbd8';
        }
      });
    });
    return () => {};
  }

  const icons = activity.icons || ['🐶', '🐱', '🐰'];
  const deck = [...icons, ...icons].sort(() => Math.random() - 0.5);
  let flipped = [];
  let matched = 0;
  let lock = false;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:12px;">
      <div style="font-weight:900; font-size:1.05rem; color:#2c3e50;">${activity.prompt}</div>
      <div style="display:grid; grid-template-columns:repeat(${icons.length}, 88px); gap:10px;">
        ${deck.map((ic, idx) => `
          <button class="mg-card" data-idx="${idx}" data-val="${ic}" style="height:84px; font-size:2.2rem; border-radius:16px; border:3px solid #2c3e50; background:#3498db; color:#fff; cursor:pointer; font-weight:900;">
            ❓
          </button>
        `).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.mg-card').forEach((card) => {
    card.addEventListener('click', () => {
      if (lock || card.dataset.open === 'true') return;
      audio.play('click');
      card.dataset.open = 'true';
      card.style.background = '#fff';
      card.textContent = card.dataset.val;
      flipped.push(card);

      if (flipped.length === 2) {
        lock = true;
        const [c1, c2] = flipped;
        if (c1.dataset.val === c2.dataset.val) {
          audio.play('correct');
          c1.style.borderColor = '#27ae60';
          c2.style.borderColor = '#27ae60';
          matched += 1;
          flipped = [];
          lock = false;
          if (matched >= icons.length) {
            setTimeout(() => onResult(true, 'Ingatanmu luar biasa! Semua pasangan ketemu!'), 350);
          }
        } else {
          audio.play('wrong');
          setTimeout(() => {
            c1.dataset.open = 'false';
            c2.dataset.open = 'false';
            c1.style.background = '#3498db';
            c2.style.background = '#3498db';
            c1.textContent = '❓';
            c2.textContent = '❓';
            flipped = [];
            lock = false;
          }, 650);
        }
      }
    });
  });

  return () => {};
}

