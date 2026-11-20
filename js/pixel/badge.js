// 기본 클럽 배지. 실제 엠블럼 대신 방패 + 대표색 + 약자.
// emblems/클럽ID.png 가 있으면 그 이미지를 쓴다 (사용자가 직접 넣는 개인용 슬롯).
(function () {
  const PX = window.PX;

  // 3x5 도트 글꼴 (대문자, 숫자)
  const FONT = {
    A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'],
    C: ['.##', '#..', '#..', '#..', '.##'], D: ['##.', '#.#', '#.#', '#.#', '##.'],
    E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
    G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'],
    I: ['###', '.#.', '.#.', '.#.', '###'], J: ['..#', '..#', '..#', '#.#', '.#.'],
    K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
    M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'],
    O: ['.#.', '#.#', '#.#', '#.#', '.#.'], P: ['##.', '#.#', '##.', '#..', '#..'],
    Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
    S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'],
    U: ['#.#', '#.#', '#.#', '#.#', '###'], V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
    W: ['#.#', '#.#', '###', '###', '#.#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
    Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
    0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'],
    2: ['##.', '..#', '.#.', '#..', '###'], 3: ['##.', '..#', '.#.', '..#', '##.'],
    4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
    6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'],
    8: ['###', '#.#', '###', '#.#', '###'], 9: ['###', '#.#', '###', '..#', '##.'],
  };
  PX.FONT3x5 = FONT;

  // 방패 왼쪽 절반 (10칸) → 20칸
  const SHIELD = PX.mirror([
    '.AAAAAAAAA', 'AAAAAAAAAA', 'AAAAAAAAAA', 'AAAAAAAAAA', 'AAAAAAAAAA',
    'AAAAAAAAAA', 'AAAAAAAAAA', 'AAAAAAAAAA', 'AAAAAAAAAA', 'AAAAAAAAAA',
    'AAAAAAAAAA', 'AAAAAAAAAA', 'AAAAAAAAAA', '.AAAAAAAAA', '.AAAAAAAAA',
    '..AAAAAAAA', '...AAAAAAA', '....AAAAAA', '.....AAAAA', '.......AAA',
  ]);
  const SW = 20, SH = SHIELD.length;
  PX.BADGE_STYLES = ['band', 'half', 'diag', 'ring', 'stripes'];

  PX.badgeGrid = function (style, text) {
    const g = PX.grid(SW + 2, SH + 2);
    PX.stamp(g, SHIELD, 1, 1);
    const inShield = (x, y) => g[y] && g[y][x] === 'A';
    for (let y = 0; y < g.length; y++)
      for (let x = 0; x < g[0].length; x++) {
        if (!inShield(x, y)) continue;
        const sx = x - 1, sy = y - 1;
        let b = false;
        if (style === 'band') b = sy >= 7 && sy <= 13;
        if (style === 'half') b = sx >= 10;
        if (style === 'diag') b = Math.abs(sx - sy - 1) <= 3;
        if (style === 'stripes') b = sx % 6 >= 3;
        if (style === 'ring') {
          let edge = false;
          for (let d = 1; d <= 2 && !edge; d++)
            edge = !inShield(x - d, y) || !inShield(x + d, y) || !inShield(x, y - d) || !inShield(x, y + d);
          b = edge;
        }
        if (b) g[y][x] = 'B';
      }
    // 맨 윗줄은 진하게 눌러 방패 테두리처럼 보이게 한다.
    for (let x = 0; x < g[0].length; x++) if (g[1][x] !== '.') g[1][x] = 'D';

    // 줄무늬·사선 위에서는 글자가 묻히니 어두운 이름판을 깐다.
    if (style === 'stripes' || style === 'diag')
      for (let y = 8; y <= 16; y++) for (let x = 3; x <= 18; x++) if (g[y][x] !== '.') g[y][x] = 'X';

    // 약자 (최대 3자)
    const t = String(text || '').toUpperCase().slice(0, 3);
    const tw = t.length * 4 - 1;
    const tx = 1 + Math.floor((SW - tw) / 2), ty = 1 + 8;
    let cover = { A: 0, B: 0, X: 0 };
    for (let i = 0; i < t.length; i++) {
      const ch = FONT[t[i]];
      if (!ch) continue;
      ch.forEach((row, ry) =>
        row.split('').forEach((c, rx) => {
          if (c !== '#') return;
          const X = tx + i * 4 + rx, Y = ty + ry;
          if (g[Y][X] in cover) cover[g[Y][X]]++;
          g[Y][X] = 'T';
        }));
    }
    PX.outline(g);
    g.textOn = cover.X ? 'X' : cover.B > cover.A ? 'B' : 'A';
    return g;
  };

  // club = { short:'UHD', colors:[주색, 보조색], badge:'band' }
  PX.badgeCanvas = function (club, scale = 3) {
    const g = PX.badgeGrid(club.badge || 'band', club.short);
    const [a, b] = club.colors;
    const plate = PX.mix(PX.luma(a) < 70 ? b : a, '#1E1E1E', 0.55);
    const under = { A: a, B: b, X: plate }[g.textOn];
    const text = PX.luma(under) > 140 ? '#1E1E1E' : '#F2EBDD';
    const cmap = { A: a, B: b, D: PX.mix(a, '#1E1E1E', 0.35), T: text, X: plate };
    return PX.toCanvas(g, cmap, scale);
  };

  // 사용자 엠블럼이 있으면 교체한다. 없으면 기본 배지 그대로.
  PX.badgeElement = function (club, scale = 3) {
    const wrap = document.createElement('span');
    wrap.className = 'badge';
    const fallback = PX.badgeCanvas(club, scale);
    wrap.appendChild(fallback);
    if (club.id) {
      const img = new Image();
      img.onload = () => {
        img.width = fallback.width; img.height = fallback.height;
        img.style.objectFit = 'contain';
        wrap.replaceChild(img, fallback);
      };
      img.src = 'emblems/' + club.id + '.png';
    }
    return wrap;
  };
})();
