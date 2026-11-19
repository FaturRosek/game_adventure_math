export function runMiniGamePuzzle({ container, activity, audio, onResult }) {
  const sequence = activity.sequence || ['🌱', '🌿', '🌳', '🍎'];
  const missingIdx = typeof activity.missingIdx === 'number' ? activity.missingIdx : sequence.length - 1;
  const correctPiece = sequence[missingIdx];
  const choices = activity.choices || [correctPiece, '🪨', '🎈', '🚗'];
  const shuffledChoices = [...choices].sort(() => Math.random() - 0.5);

  const boardHtml = sequence.map((tile, idx) => `
    <div id="${idx === missingIdx ? 'pz-slot' : ''}" style="width:76px; height:76px; border-radius:16px; border:3px ${idx === missingIdx ? 'dashed #e67e22' : 'solid #34495e'}; background:${idx === missingIdx ? '#fff9db' : '#eef9ff'}; display:flex; align-items:center; justify-content:center; font-size:2.3rem; font-weight:900;">
      ${idx === missingIdx ? '❓' : tile}
    </div>
  `).join('');

  const choicesHtml = shuffledChoices.map((ch) => `
    <button class="btn-cartoon btn-blue pz-choice" data-val="${ch}" style="font-size:2rem; padding:10px 20px;">
      ${ch}
    </button>
  `).join('');

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:14px;">
      <div style="font-weight:900; font-size:1.05rem; color:#2c3e50;">${activity.prompt}</div>
      <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">${boardHtml}</div>
      <div style="font-size:0.88rem; font-weight:800; color:#576574;">Pilih potongan yang tepat untuk melengkapi puzzle:</div>
      <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">${choicesHtml}</div>
    </div>
  `;

  let done = false;
  container.querySelectorAll('.pz-choice').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (done) return;
      if (btn.dataset.val === correctPiece) {
        done = true;
        audio.play('correct');
        const slot = document.getElementById('pz-slot');
        if (slot) {
          slot.textContent = correctPiece;
          slot.style.border = '3px solid #27ae60';
          slot.style.background = '#d4efdf';
        }
        setTimeout(() => onResult(true, 'Pintar! Puzzle berhasil dilengkapi!'), 350);
      } else {
        audio.play('wrong');
        btn.style.opacity = '0.45';
      }
    });
  });

  return () => {};
}

