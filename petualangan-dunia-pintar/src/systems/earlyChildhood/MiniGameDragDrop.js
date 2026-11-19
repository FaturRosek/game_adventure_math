export function runMiniGameDragDrop({ container, activity, audio, onResult }) {
  const pairs = activity.pairs || [
    { id: 'p1', item: '🔴', label: 'Merah', targetLabel: 'Keranjang Merah', color: '#fadbd8' },
    { id: 'p2', item: '🔵', label: 'Biru', targetLabel: 'Keranjang Biru', color: '#d6eaf8' }
  ];

  let matchedCount = 0;
  let selectedId = null;

  const shuffledItems = [...pairs].sort(() => Math.random() - 0.5);

  const itemsHtml = shuffledItems.map((p) => `
    <div class="dd-item" draggable="true" data-id="${p.id}" style="background:#fff; border:3px solid #3498db; border-radius:16px; padding:12px 18px; font-size:2rem; cursor:grab; user-select:none; display:flex; flex-direction:column; align-items:center; min-width:96px;">
      <span>${p.item}</span>
      <span style="font-size:0.82rem; font-weight:800; color:#2c3e50;">${p.label}</span>
    </div>
  `).join('');

  const targetsHtml = pairs.map((p) => `
    <div class="dd-target" data-id="${p.id}" style="background:${p.color || '#fef9e7'}; border:3px dashed #34495e; border-radius:16px; padding:14px; min-width:130px; min-height:92px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-weight:900; color:#2c3e50;">
      <div style="font-size:0.92rem;">${p.targetLabel}</div>
      <div class="dd-slot" style="font-size:1.8rem; margin-top:4px;">⬇️</div>
    </div>
  `).join('');

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:14px;">
      <div style="font-weight:900; font-size:1.05rem; color:#2c3e50;">${activity.prompt}</div>
      <div style="font-size:0.85rem; font-weight:700; color:#576574;">Seret gambar ke kotak yang cocok (atau klik gambar lalu klik kotaknya).</div>
      <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:12px;">${itemsHtml}</div>
      <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:14px;">${targetsHtml}</div>
    </div>
  `;

  const tryMatch = (itemId, targetEl) => {
    if (!itemId || targetEl.dataset.done === 'true') return;
    if (targetEl.dataset.id === itemId) {
      targetEl.dataset.done = 'true';
      targetEl.style.borderStyle = 'solid';
      targetEl.style.borderColor = '#27ae60';
      const itemEl = container.querySelector(`.dd-item[data-id="${itemId}"]`);
      const pairObj = pairs.find((x) => x.id === itemId);
      if (itemEl) {
        itemEl.style.visibility = 'hidden';
        itemEl.setAttribute('draggable', 'false');
      }
      const slot = targetEl.querySelector('.dd-slot');
      if (slot && pairObj) slot.textContent = `${pairObj.item} ✅`;
      selectedId = null;
      matchedCount += 1;
      audio.play('correct');
      if (matchedCount >= pairs.length) {
        setTimeout(() => onResult(true, 'Keren! Semua pasangan cocok dengan tepat!'), 350);
      }
    } else {
      audio.play('wrong');
      targetEl.style.borderColor = '#e74c3c';
      setTimeout(() => { targetEl.style.borderColor = '#34495e'; }, 400);
    }
  };

  container.querySelectorAll('.dd-item').forEach((el) => {
    el.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', el.dataset.id);
      selectedId = el.dataset.id;
    });
    el.addEventListener('click', () => {
      audio.play('click');
      container.querySelectorAll('.dd-item').forEach((x) => { x.style.background = '#fff'; });
      el.style.background = '#fff9db';
      selectedId = el.dataset.id;
    });
  });

  container.querySelectorAll('.dd-target').forEach((tEl) => {
    tEl.addEventListener('dragover', (e) => e.preventDefault());
    tEl.addEventListener('drop', (e) => {
      e.preventDefault();
      const droppedId = e.dataTransfer.getData('text/plain') || selectedId;
      tryMatch(droppedId, tEl);
    });
    tEl.addEventListener('click', () => {
      if (selectedId) tryMatch(selectedId, tEl);
    });
  });

  return () => {};
}

