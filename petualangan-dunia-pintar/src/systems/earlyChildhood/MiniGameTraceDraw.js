export function runMiniGameTraceDraw({ container, activity, audio, onResult }) {
  const symbol = activity.symbol || '1';
  const points = activity.points || [
    { x: 180, y: 55 },
    { x: 180, y: 115 },
    { x: 180, y: 175 }
  ];
  const hitSet = new Set();
  let drawing = false;
  let completed = false;

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px;">
      <div style="font-weight:900; font-size:1.25rem; color:#2c3e50;">${activity.prompt}</div>
      <canvas id="td-canvas" width="540" height="330" style="background:#fffdf7; border:5px solid #9b59b6; border-radius:22px; touch-action:none; cursor:crosshair; max-width:92%; max-height:48vh;"></canvas>
      <div style="font-size:0.95rem; font-weight:800; color:#576574;">Tebalkan semua titik kuning mengikuti bentuk "${symbol}"!</div>
    </div>
  `;

  const canvas = document.getElementById('td-canvas');
  const ctx = canvas.getContext('2d');

  const drawGuide = () => {
    ctx.font = 'bold 230px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(155, 89, 182, 0.16)';
    ctx.fillText(symbol, 270, 175);

    points.forEach((pt, i) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = hitSet.has(i) ? '#2ecc71' : '#f1c40f';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#2c3e50';
      ctx.stroke();
    });
  };

  drawGuide();

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const paintAt = (pos) => {
    if (completed) return;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#8e44ad';
    ctx.fill();

    points.forEach((pt, idx) => {
      if (!hitSet.has(idx) && Math.hypot(pos.x - pt.x, pos.y - pt.y) < 26) {
        hitSet.add(idx);
        audio.play('click');
        drawGuide();
      }
    });

    if (hitSet.size >= points.length) {
      completed = true;
      audio.play('correct');
      setTimeout(() => onResult(true, `Bagus sekali! Kamu berhasil menebalkan "${symbol}"!`), 300);
    }
  };

  const start = (e) => { e.preventDefault(); drawing = true; paintAt(getPos(e)); };
  const move = (e) => { if (!drawing) return; e.preventDefault(); paintAt(getPos(e)); };
  const end = () => { drawing = false; };

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start);
  canvas.addEventListener('touchmove', move);
  window.addEventListener('touchend', end);

  return () => {
    window.removeEventListener('mouseup', end);
    window.removeEventListener('touchend', end);
  };
}

