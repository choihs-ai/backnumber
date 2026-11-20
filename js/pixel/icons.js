// 16x16 아이콘. 채우기만 그리고 외곽선은 outline()으로 두른다.
(function () {
  const PX = window.PX;

  const COLORS = {
    w: '#F2EBDD', v: '#D9D0BD', r: '#C8352B', g: '#2F6B3A', i: '#3A3631',
    l: '#BDB5A6', y: '#D2A640', Y: '#9E7A2A', L: '#F3DA8C',
    n: '#D9B48F', m: '#B8936E', z: '#F2EBDD',
  };
  PX.ICON_COLORS = COLORS;

  const rows = (list) => () => PX.fromRows(list);

  const make = {
    train: rows([
      '................', '................', '.......rr.......', '.......rr.......',
      '......rrrr......', '......wwww......', '.....rrrrrr.....', '.....rrrrrr.....',
      '....wwwwwwww....', '....rrrrrrrr....', '...rrrrrrrrrr...', '...rrrrrrrrrr...',
      '.iiiiiiiiiiiiii.', '.iiiiiiiiiiiiii.', '................', '................',
    ]),
    focus: () => {
      const g = PX.grid(16, 16);
      [[7, 'r'], [5.6, 'w'], [4.1, 'r'], [2.6, 'w'], [1.2, 'r']].forEach(([r, k]) => PX.disc(g, 8, 8, r, k));
      return g;
    },
    rest: () => {
      const g = PX.grid(16, 16);
      PX.disc(g, 7, 9.5, 6, 'y');
      PX.disc(g, 10, 7.5, 5, '.');
      PX.stamp(g, PX.fromRows(['zzzz', '..z.', '.z..', 'zzzz']), 10, 1);
      return g;
    },
    video: rows([
      '................', '................', '.iiiiiiiiiiiiii.', '.iggggggggggggi.',
      '.iggggrgggggggi.', '.iggggrrggggggi.', '.iggggrrrgggggi.', '.iggggrrrrggggi.',
      '.iggggrrrgggggi.', '.iggggrrggggggi.', '.iggggrgggggggi.', '.iggggggggggggi.',
      '.iiiiiiiiiiiiii.', '................', '................', '................',
    ]),
    sns: rows([
      '................', '...iiiiiiiiiii..', '...iwwwwwwwwwi..', '...iwwwwwwwwwi..',
      '...iwwrrwrrwwi..', '...iwrrrrrrrwi..', '...iwrrrrrrrwi..', '...iwwrrrrrwwi..',
      '...iwwwrrrwwwi..', '...iwwwwrwwwwi..', '...iwwwwwwwwwi..', '...iwwwwwwwwwi..',
      '...iiiiiiiiiii..', '................', '................', '................',
    ]),
    injury: () => {
      const g = PX.grid(16, 16);
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          const dx = x - 7.5, dy = y - 7.5;
          const u = (dx - dy) / Math.SQRT2, v = (dx + dy) / Math.SQRT2;
          if (Math.abs(u) <= 6.6 && Math.abs(v) <= 2.6) {
            const pad = Math.abs(u) <= 2.3;
            g[y][x] = pad ? ((x + y) % 2 === 0 ? 'm' : 'v') : 'n';
          }
        }
      return g;
    },
    trophy: () => {
      const g = PX.fromRows([
        '................', '................', '...yyyyyyyyyy...', '.yyyyyyyyyyyyyy.',
        '.y.yyyyyyyyyy.y.', '.y.yyyyyyyyyy.y.', '..yyyyyyyyyyyy..', '....yyyyyyyy....',
        '.....yyyyyy.....', '......yyyy......', '.......yy.......', '.......yy.......',
        '.....yyyyyy.....', '....iiiiiiii....', '....iiiiiiii....', '................',
      ]);
      return PX.shadeRuns(g, 'y', 'Y', 'L');
    },
    ball: () => {
      const g = PX.grid(16, 16);
      PX.disc(g, 8, 8, 6.6, 'w');
      const ink = (x, y, w, h) => {
        for (let j = y; j < y + h; j++)
          for (let i = x; i < x + w; i++) if (g[j][i] === 'w') g[j][i] = 'i';
      };
      ink(7, 6, 2, 1); ink(6, 7, 4, 2); ink(7, 9, 2, 1);
      ink(7, 1, 2, 2); ink(12, 4, 2, 3); ink(2, 4, 2, 3); ink(4, 12, 3, 2); ink(9, 12, 3, 2);
      return g;
    },
    glove: () => {
      const g = PX.grid(16, 16);
      PX.rect(g, 4, 3, 2, 6, 'w');
      PX.rect(g, 6, 2, 2, 7, 'v');
      PX.rect(g, 8, 2, 2, 7, 'w');
      PX.rect(g, 10, 3, 2, 6, 'v');
      PX.rect(g, 4, 8, 8, 4, 'w');
      PX.rect(g, 2, 7, 2, 4, 'v');
      PX.rect(g, 1, 8, 1, 2, 'v');
      PX.rect(g, 4, 12, 8, 2, 'r');
      return g;
    },
    number: () => {
      const g = PX.fromRows([
        '................', '...rrrr..rrrr...', '..rrrrrrrrrrrr..', '.rrrrrrrrrrrrrr.',
        '.rrrrrrrrrrrrrr.', '.rr.rrrrrrrr.rr.', '....rrrrrrrr....', '....rrrrrrrr....',
        '....rrrrrrrr....', '....rrrrrrrr....', '....rrrrrrrr....', '....rrrrrrrr....',
        '....rrrrrrrr....', '....rrrrrrrr....', '................', '................',
      ]);
      PX.FONT3x5[9].forEach((row, y) =>
        row.split('').forEach((c, x) => { if (c === '#') g[6 + y][6 + x] = 'w'; }));
      return g;
    },
  };

  PX.ICONS = {
    train: '기본 훈련', focus: '집중 훈련', rest: '휴식', video: '영상 분석', sns: 'SNS',
    injury: '부상', trophy: '트로피', ball: '공', glove: '장갑', number: '등번호',
  };

  const cache = {};
  PX.iconGrid = function (name) {
    if (!cache[name]) cache[name] = PX.outline(make[name]());
    return cache[name];
  };
  PX.iconCanvas = function (name, scale = 2) {
    return PX.toCanvas(PX.iconGrid(name), COLORS, scale);
  };
})();
