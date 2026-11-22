// 골문 정면 화면 (슛 조준·다이빙 미니게임). 96x56 픽셀을 정수배로 키워 그린다.
(function () {
  const PX = window.PX;
  const GW = 96, GH = 56;
  const GOAL = { x0: 14, x1: 81, y0: 10, y1: 46 }; // 골대 안쪽
  PX.GOAL_VIEW = { w: GW, h: GH, goal: GOAL };

  // 구역 0~8의 중심 좌표
  PX.zoneCenter = function (z) {
    const c = z % 3, r = Math.floor(z / 3);
    const w = (GOAL.x1 - GOAL.x0) / 3, h = (GOAL.y1 - GOAL.y0) / 3;
    return [GOAL.x0 + w * (c + 0.5), GOAL.y0 + h * (r + 0.5)];
  };

  function back(ctx, crowd) {
    // 관중석: 머리 2x2가 두 줄. 환호하면 번갈아 튀어 오른다
    ctx.fillStyle = '#1F2E23'; ctx.fillRect(0, 0, GW, GH);
    const cols = (crowd && crowd.colors) || ['#C8352B', '#F2EBDD', '#1F4E9C', '#E0C341'];
    const t = (crowd && crowd.t) || 0, cheer = crowd && crowd.cheer;
    for (let row = 0; row < 2; row++)
      for (let x = (row ? 1 : 0); x < GW; x += 3) {
        const seed = (x * 31 + row * 17) % 97;
        const hop = cheer && ((Math.floor(t / 120) + seed) % 2 === 0) ? -1 : 0;
        ctx.fillStyle = cols[seed % cols.length];
        ctx.fillRect(x, 1 + row * 3 + hop, 2, 2);
        ctx.fillStyle = '#C9A27E';
        if (seed % 5 === 0) ctx.fillRect(x, 1 + row * 3 + hop - 1, 2, 1);
      }
    ctx.fillStyle = '#1E1E1E'; ctx.fillRect(0, 7, GW, 1);
    ctx.fillStyle = '#26402C'; ctx.fillRect(0, 8, GW, 38);
    for (let y = 46; y < GH; y++) { ctx.fillStyle = (y >> 1) % 2 ? '#367643' : '#2F6B3A'; ctx.fillRect(0, y, GW, 1); }
    // 그물
    ctx.fillStyle = '#1F3324'; ctx.fillRect(GOAL.x0, GOAL.y0, GOAL.x1 - GOAL.x0 + 1, GOAL.y1 - GOAL.y0);
    ctx.fillStyle = '#5E7A62';
    for (let y = GOAL.y0 + 1; y < GOAL.y1; y += 3) for (let x = GOAL.x0 + 1; x <= GOAL.x1; x++) if ((x + y) % 3 === 0) ctx.fillRect(x, y, 1, 1);
    for (let x = GOAL.x0 + 2; x <= GOAL.x1; x += 3) for (let y = GOAL.y0 + 1; y < GOAL.y1; y++) if ((x + y) % 2 === 0) ctx.fillRect(x, y, 1, 1);
    // 골대
    ctx.fillStyle = '#F2EBDD';
    ctx.fillRect(GOAL.x0 - 2, GOAL.y0 - 2, GOAL.x1 - GOAL.x0 + 5, 2);
    ctx.fillRect(GOAL.x0 - 2, GOAL.y0, 2, GOAL.y1 - GOAL.y0);
    ctx.fillRect(GOAL.x1 + 1, GOAL.y0, 2, GOAL.y1 - GOAL.y0);
    ctx.fillStyle = '#1E1E1E';
    ctx.fillRect(GOAL.x0 - 3, GOAL.y0 - 3, GOAL.x1 - GOAL.x0 + 7, 1);
    // 골라인
    ctx.fillStyle = '#E6E0CC'; ctx.fillRect(0, GOAL.y1, GW, 1);
  }

  const cache = {};
  function keeperCanvas(spec, key) {
    if (!cache[key]) cache[key] = PX.playerCanvas(spec, 1);
    return cache[key];
  }

  // state = { keeper: spec, gk: {x, y, dive: -1|0|1, up}, ball: [x, y, r] | null, zone: n | null, shake: 0..1 }
  PX.drawGoal = function (canvas, state, scale) {
    const base = document.createElement('canvas');
    base.width = GW; base.height = GH;
    const ctx = base.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    back(ctx, state.crowd);
    if (state.zone != null) {
      const w = (GOAL.x1 - GOAL.x0) / 3, h = (GOAL.y1 - GOAL.y0) / 3;
      const c = state.zone % 3, r = Math.floor(state.zone / 3);
      ctx.fillStyle = 'rgba(200,53,43,0.45)';
      ctx.fillRect(Math.round(GOAL.x0 + c * w) + 1, Math.round(GOAL.y0 + r * h) + 1, Math.round(w) - 1, Math.round(h) - 1);
    }
    if (state.shake) {
      ctx.fillStyle = 'rgba(242,235,221,' + (0.25 * state.shake) + ')';
      ctx.fillRect(GOAL.x0, GOAL.y0, GOAL.x1 - GOAL.x0, GOAL.y1 - GOAL.y0);
    }
    if (state.keeper) {
      const g = state.gk || { x: 48, y: 46, dive: 0 };
      const k = keeperCanvas(state.keeper, state.keeperKey || 'k');
      ctx.save();
      ctx.translate(Math.round(g.x), Math.round(g.y));
      if (g.dive) ctx.rotate(g.dive * Math.PI / 2 * Math.min(1, g.t || 1));
      const sc = g.scale || 1;
      ctx.drawImage(k, -12 * sc, -26 * sc, 24 * sc, 26 * sc);
      ctx.restore();
    }
    if (state.trail) {
      state.trail.forEach(([x, y], i) => {
        if (i % 2) return;
        ctx.fillStyle = '#1E1E1E'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
        ctx.fillStyle = '#F2EBDD'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      });
      if (state.trailEnd) {
        const [x, y] = state.trail[state.trail.length - 1];
        ctx.fillStyle = '#E0C341';
        ctx.fillRect(Math.round(x) - 2, Math.round(y), 5, 1); ctx.fillRect(Math.round(x), Math.round(y) - 2, 1, 5);
      }
    }
    if (state.shooter) ctx.drawImage(state.shooter, Math.round(state.shooterX || 30), GH - state.shooter.height + (state.shooterY || 8));
    if (state.ball) {
      const [x, y, r] = state.ball;
      const cx = Math.round(x), cy = Math.round(y), R = Math.max(1, Math.round(r));
      const disc = (rad, col) => {
        ctx.fillStyle = col;
        for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) if (i * i + j * j <= rad * rad + rad * 0.6) ctx.fillRect(cx + i, cy + j, 1, 1);
      };
      disc(R + 1, '#141414');
      disc(R, '#FAF7F0');
      if (R >= 2) { ctx.fillStyle = '#6B675F'; ctx.fillRect(cx - 1, cy - 1, 1, 1); ctx.fillRect(cx + 1, cy, 1, 1); }
    }
    canvas.width = GW * scale; canvas.height = GH * scale;
    const out = canvas.getContext('2d');
    out.imageSmoothingEnabled = false;
    out.drawImage(base, 0, 0, GW * scale, GH * scale);
  };
})();
