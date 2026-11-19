export function runMiniGameSortGroup({ container, activity, audio, onResult }) {
  const groups = activity.groups || [
    { id: 'buah', name: 'Buah-buahan 🍎', color: '#fadbd8' },
    { id: 'hewan', name: 'Hewan 🐶', color: '#d4efdf' }
  ];
  const items = [...(activity.items || [
    { icon: '🍎', group: 'buah' },
    { icon: '🍌', group: 'buah' },
    { icon: '🐶', group: 'hewan' },
    { icon: '🐱', group: 'hewan' }
  ])].sort(() => Math.random() - 0.5);

  let currentIdx = 0;

  const render = () => {
    const current = items[currentIdx];
    const binsHtml = groups.map((g) => `
      <button class="sg-bin" data-group="${g.id}" style="background:${g.color}; border:3px solid #2c3e50; border-radius:18px; padding:16px 22px; min-width:165px; font-weight:900; font-size:1rem; cursor:pointer; color:#2c3e50;">
        🧺 ${g.name}
      </button>
    `).join('');

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:14px;">
        <div style="font-weight:900; font-size:1.05rem; color:#2c3e50;">${activity.prompt} (${currentIdx + 1}/${items.length})</div>
        <div style="width:110px; height:110px; border-radius:24px; background:#fff; border:4px solid #f39c12; display:flex; align-items:center; justify-content:center; font-size:3.4rem; box-shadow:0 6px 0 rgba(0,0,0,0.1);">
          ${current.icon}
        </div>
        <div style="display:flex; gap:14px; flex-wrap:wrap; justify-content:center;">${binsHtml}</div>
      </div>
    `;

    container.querySelectorAll('.sg-bin').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.group === current.group) {
          audio.play('correct');
          currentIdx += 1;
          if (currentIdx >= items.length) {
            onResult(true, 'Hebat! Semua benda sudah masuk kelompok yang tepat!');
          } else {
            render();
          }
        } else {
          audio.play('wrong');
          btn.style.borderColor = '#e74c3c';
          setTimeout(() => { btn.style.borderColor = '#2c3e50'; }, 350);
        }
      });
    });
  };

  render();
  return () => {};
}

