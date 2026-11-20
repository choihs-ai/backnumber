// 장면 선택 화면의 미니 피치. 상대 골대가 위쪽에 오는 공격 1/3 지역만 내려다본다.
// 좌표는 피치 픽셀 기준 (가로 96, 세로 72). 화면에 그릴 때 정수배로 키운다.
(function () {
  const PX = window.PX;
  const PW = 96, PH = 72;
  const C = {
    grassA: '#2F6B3A', grassB: '#367643', line: '#E6E0CC',
    net: '#BFB9A7', netDark: '#264F2E', post: '#F2EBDD',
    mate: '#F2EBDD', opp: '#1E1E1E', oppGk: '#E0C341', me: '#C8352B',
    ball: '#FAF7F0', out: '#141414', trail: '#F2EBDD',
  };
  PX.PITCH = { w: PW, h: PH, colors: C };

  const GOAL_Y = 8; // 골라인

  function px(ctx, x, y, c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); }
  function hline(ctx, x0, x1, y, c) { ctx.fillStyle = c; ctx.fillRect(x0, y, x1 - x0 + 1, 1); }
  function vline(ctx, x, y0, y1, c) { ctx.fillStyle = c; ctx.fillRect(x, y0, 1, y1 - y0 + 1); }

  function field(ctx) {
    for (let y = 0; y < PH; y += 6) {
      ctx.fillStyle = (y / 6) % 2 ? C.grassB : C.grassA;
      ctx.fillRect(0, y, PW, 6);
    }
    // 골라인과 터치라인 일부
    hline(ctx, 2, PW - 3, GOAL_Y, C.line);
    vline(ctx, 2, GOAL_Y, PH - 1, C.line);
    vline(ctx, PW - 3, GOAL_Y, PH - 1, C.line);
    // 페널티 박스 (가로 60, 깊이 24)
    const bx0 = 18, bx1 = 77, by1 = GOAL_Y + 24;
    vline(ctx, bx0, GOAL_Y, by1, C.line); vline(ctx, bx1, GOAL_Y, by1, C.line);
    hline(ctx, bx0, bx1, by1, C.line);
    // 골 에어리어
    const gx0 = 34, gx1 = 61, gy1 = GOAL_Y + 8;
    vline(ctx, gx0, GOAL_Y, gy1, C.line); vline(ctx, gx1, GOAL_Y, gy1, C.line);
    hline(ctx, gx0, gx1, gy1, C.line);
    // 페널티 스폿
    px(ctx, 47, GOAL_Y + 16, C.line); px(ctx, 48, GOAL_Y + 16, C.line);
    // 페널티 아크: 박스 밖으로 나온 부분만
    for (let a = 0; a <= Math.PI; a += 0.02) {
      const x = Math.round(47.5 + Math.cos(a) * 10);
      const y = Math.round(GOAL_Y + 16 + Math.sin(a) * 10);
      if (y > by1) px(ctx, x, y, C.line);
    }
    // 하프라인 쪽 센터서클 윗부분
    for (let a = Math.PI; a <= Math.PI * 2; a += 0.02) {
      const x = Math.round(47.5 + Math.cos(a) * 12);
      const y = Math.round(PH + 4 + Math.sin(a) * 12);
      if (y < PH) px(ctx, x, y, C.line);
    }
    // 골대와 그물
    const nx0 = 40, nx1 = 55;
    ctx.fillStyle = C.netDark; ctx.fillRect(nx0, 2, nx1 - nx0 + 1, GOAL_Y - 2);
    for (let y = 2; y < GOAL_Y; y++)
      for (let x = nx0; x <= nx1; x++)
        if ((x + y) % 2 === 0) px(ctx, x, y, C.net);
    hline(ctx, nx0 - 1, nx1 + 1, 1, C.post);
    vline(ctx, nx0 - 1, 1, GOAL_Y, C.post);
    vline(ctx, nx1 + 1, 1, GOAL_Y, C.post);
  }

  // 5x5 둥근 마커 + 1px 외곽선
  const DOT = ['.###.', '#####', '#####', '#####', '.###.'];
  function marker(ctx, cx, cy, fill, inner) {
    const x0 = Math.round(cx) - 2, y0 = Math.round(cy) - 2;
    const g = PX.grid(7, 7);
    PX.stamp(g, PX.fromRows(DOT.map((r) => r.replace(/#/g, 'A'))), 1, 1);
    if (inner) PX.set(g, 3, 3, 'B');
    PX.outline(g);
    PX.draw(ctx, g, { A: fill, B: inner, o: C.out }, x0 - 1, y0 - 1, 1);
  }

  function ball(ctx, cx, cy) {
    const x = Math.round(cx), y = Math.round(cy);
    ctx.fillStyle = C.out; ctx.fillRect(x - 2, y - 1, 5, 3); ctx.fillRect(x - 1, y - 2, 3, 5);
    ctx.fillStyle = C.ball; ctx.fillRect(x - 1, y - 1, 3, 3);
    px(ctx, x, y, '#6B675F');
  }

  // 점선 궤적. 두 칸 찍고 두 칸 쉰다.
  function trail(ctx, pts) {
    let step = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let s = 0; s <= n; s++, step++) {
        if (step % 4 > 1) continue;
        px(ctx, Math.round(x0 + ((x1 - x0) * s) / n), Math.round(y0 + ((y1 - y0) * s) / n), C.trail);
      }
    }
  }

  // scene = { me:[x,y], mates:[[x,y]], opps:[[x,y]], gk:[x,y], ball:[x,y], trail:[[x,y]...] }
  PX.drawPitch = function (canvas, scene, scale) {
    const base = document.createElement('canvas');
    base.width = PW; base.height = PH;
    const ctx = base.getContext('2d');
    field(ctx);
    if (scene.trail) trail(ctx, scene.trail);
    (scene.opps || []).forEach(([x, y]) => marker(ctx, x, y, C.opp));
    if (scene.gk) marker(ctx, scene.gk[0], scene.gk[1], C.oppGk);
    (scene.mates || []).forEach(([x, y]) => marker(ctx, x, y, C.mate));
    if (scene.me) marker(ctx, scene.me[0], scene.me[1], C.me, C.mate);
    if (scene.ball) ball(ctx, scene.ball[0], scene.ball[1]);

    scale = scale || Math.max(1, Math.floor(canvas.width / PW));
    canvas.width = PW * scale; canvas.height = PH * scale;
    const out = canvas.getContext('2d');
    out.imageSmoothingEnabled = false;
    out.drawImage(base, 0, 0, PW * scale, PH * scale);
    return canvas;
  };
})();
