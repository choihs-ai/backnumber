// 도트 그리기 공통 도구.
// 그림은 문자 격자로 다룬다. '.'은 투명, 'o'는 외곽선, 나머지 문자는 색 슬롯.
// 외곽선을 직접 그리지 않고 outline()으로 나중에 두르면 팔·머리 같은 부품을 겹쳐도 선이 깔끔하게 이어진다.
(function () {
  const PX = (window.PX = window.PX || {});

  PX.UI = { paper: '#F2EBDD', ink: '#1E1E1E', grass: '#2F6B3A', red: '#C8352B' };
  PX.OUTLINE = '#1E1A17';

  PX.grid = function (w, h) {
    return Array.from({ length: h }, () => Array(w).fill('.'));
  };

  PX.fromRows = function (rows) {
    return rows.map((r) => r.split(''));
  };

  // 왼쪽 절반만 그리고 좌우 대칭으로 펼친다.
  PX.mirror = function (halfRows) {
    return halfRows.map((r) => (r + r.split('').reverse().join('')).split(''));
  };

  // src를 dst의 (ox, oy)에 찍는다. '.'은 건너뛰고 '_'는 지운다.
  PX.stamp = function (dst, src, ox = 0, oy = 0) {
    for (let y = 0; y < src.length; y++) {
      for (let x = 0; x < src[y].length; x++) {
        const k = src[y][x];
        if (k === '.') continue;
        const gx = x + ox, gy = y + oy;
        if (gy < 0 || gy >= dst.length || gx < 0 || gx >= dst[0].length) continue;
        dst[gy][gx] = k === '_' ? '.' : k;
      }
    }
    return dst;
  };

  PX.rect = function (g, x, y, w, h, k) {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++)
        if (g[j] && g[j][i] !== undefined) g[j][i] = k;
    return g;
  };

  PX.disc = function (g, cx, cy, r, k) {
    for (let j = 0; j < g.length; j++)
      for (let i = 0; i < g[0].length; i++) {
        const dx = i + 0.5 - cx, dy = j + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) g[j][i] = k;
      }
    return g;
  };

  PX.set = function (g, x, y, k) {
    if (g[y] && g[y][x] !== undefined) g[y][x] = k;
  };

  // 투명 칸 중에서 상하좌우로 채워진 칸과 닿은 곳에 외곽선을 두른다.
  PX.outline = function (g, key = 'o') {
    const h = g.length, w = g[0].length;
    const filled = (x, y) => y >= 0 && y < h && x >= 0 && x < w && g[y][x] !== '.' && g[y][x] !== key;
    const marks = [];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (g[y][x] === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)))
          marks.push([x, y]);
    marks.forEach(([x, y]) => (g[y][x] = key));
    return g;
  };

  // 금속 광택: 가로로 이어진 같은 색 구간마다 오른쪽 30%는 그림자, 왼쪽 1/4 지점에 하이라이트 한 칸.
  PX.shadeRuns = function (g, base, shadow, light) {
    const w = g[0].length;
    g.forEach((row) => {
      let x = 0;
      while (x < w) {
        if (row[x] !== base) { x++; continue; }
        let end = x;
        while (end + 1 < w && row[end + 1] === base) end++;
        const len = end - x + 1;
        if (len >= 4) {
          const cut = x + Math.ceil(len * 0.7);
          for (let i = cut; i <= end; i++) row[i] = shadow;
          if (light) row[x + Math.floor(len * 0.22)] = light;
        } else if ((x + end) / 2 > w / 2) {
          for (let i = x; i <= end; i++) row[i] = shadow;
        }
        x = end + 1;
      }
    });
    return g;
  };

  PX.mix = function (a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (p, s) => (p >> s) & 255;
    const m = (s) => Math.round(ch(pa, s) * (1 - t) + ch(pb, s) * t);
    return '#' + ((1 << 24) | (m(16) << 16) | (m(8) << 8) | m(0)).toString(16).slice(1);
  };

  PX.luma = function (hex) {
    const p = parseInt(hex.slice(1), 16);
    return 0.299 * ((p >> 16) & 255) + 0.587 * ((p >> 8) & 255) + 0.114 * (p & 255);
  };

  // colors는 {문자: 색} 또는 (문자, x, y) => 색 함수.
  PX.draw = function (ctx, g, colors, ox = 0, oy = 0, scale = 1, flip = false) {
    const w = g[0].length;
    const get = typeof colors === 'function' ? colors : (k) => colors[k];
    for (let y = 0; y < g.length; y++)
      for (let x = 0; x < w; x++) {
        const k = g[y][x];
        if (k === '.') continue;
        const c = k === 'o' && !(typeof colors === 'object' && colors.o) ? PX.OUTLINE : get(k, x, y);
        if (!c) continue;
        ctx.fillStyle = c;
        const dx = flip ? w - 1 - x : x;
        ctx.fillRect(ox + dx * scale, oy + y * scale, scale, scale);
      }
  };

  PX.toCanvas = function (g, colors, scale = 1, flip = false) {
    const c = document.createElement('canvas');
    c.width = g[0].length * scale;
    c.height = g.length * scale;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    PX.draw(ctx, g, colors, 0, 0, scale, flip);
    return c;
  };
})();
