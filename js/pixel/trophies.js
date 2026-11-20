// 32x32 트로피. 실제 대회 트로피 모양은 따라 하지 않고 일반적인 형태로 만든다.
(function () {
  const PX = window.PX;

  const COLORS = {
    Y: '#D2A640', y: '#9E7A2A', W: '#F3DA8C', K: '#7F5E1E',
    V: '#C9C6BE', v: '#8F8B82', U: '#F4F2EC',
    D: '#6B4630', d: '#4E3222', w: '#E9E2CC', r: '#C8352B',
  };
  PX.TROPHY_COLORS = COLORS;

  const pad = (rows) => {
    const out = rows.slice();
    while (out.length < 32) out.push('................');
    return out;
  };

  const PLINTH = [
    '......DDDDDDDDDD', '......DDDDDDDDDD', '......DDDDwwwwww',
    '......DDDDwwwwww', '......DDDDDDDDDD', '.....DDDDDDDDDDD',
  ];

  const lidded = pad([
    '................', '..............YY', '.............YYY', '..............YY',
    '............YYYY', '..........YYYYYY', '........YYYYYYYY', '......YYYYYYYYYY',
    '.......YYYYYYYYY', '...YYY.YYYYYYYYY', '..Y...YYYYYYYYYY', '..Y...YYYYYYYYYY',
    '...Y..YYYYYYYYYY', '....YYYYYYYYYYYY', '.......YYYYYYYYY', '........YYYYYYYY',
    '..........YYYYYY', '............YYYY', '...........rrrrr', '..........rr.YYY',
    '.........rr..YYY', '.........r..YYYY', '...........YYYYY', '........YYYYYYYY',
    ...PLINTH,
  ]);

  const twoHandle = (k) => pad([
    '................', '................', '................', '......KKKKKKKKKK',
    '...KKKKKKKKKKKKK', '..KK..KKKKKKKKKK', '.KK...KKKKKKKKKK', '.K....KKKKKKKKKK',
    '.K....KKKKKKKKKK', '.KK...KKKKKKKKKK', '..KK...KKKKKKKKK', '...KKKKKKKKKKKKK',
    '.......KKKKKKKKK', '........KKKKKKKK', '.........KKKKKKK', '...........KKKKK',
    '.............KKK', '.............KKK', '...........KKKKK', '.............KKK',
    '............KKKK', '..........KKKKKK', '........KKKKKKKK', ...PLINTH,
  ].map((r) => r.replace(/K/g, k)));

  const goblet = pad([
    '................', '................', '................', '...YYYYYYYYYYYYY',
    '..Y..YYYYYYYYYYY', '..Y...YYYYYYYYYY', '..Y...YYYYYYYYYY', '...Y...YYYYYYYYY',
    '....Y..YYYYYYYYY', '.....Y..YYYYYYYY', '......YY.YYYYYYY', '........YYYYYYYY',
    '.............YYY', '.............YYY', '.............YYY', '...........YYYYY',
    '.............YYY', '.............YYY', '.............YYY', '...........YYYYY',
    '.........YYYYYYY', '.......YYYYYYYYY', '.......YYYYYYYYY', ...PLINTH,
  ]);

  function finish(g, metal) {
    if (metal === 'V') PX.shadeRuns(g, 'V', 'v', 'U');
    else PX.shadeRuns(g, 'Y', 'y', 'W');
    PX.shadeRuns(g, 'D', 'd');
    return g;
  }

  const make = {
    league: () => finish(PX.mirror(lidded)),
    cup: () => finish(PX.mirror(twoHandle('V')), 'V'),
    continental: () => finish(PX.mirror(goblet)),
    asiancup: () => {
      const g = finish(PX.mirror(twoHandle('Y')));
      [6, 7].forEach((y) => { for (let x = 0; x < 32; x++) if ('YyW'.includes(g[y][x]) && x > 5 && x < 26) g[y][x] = 'r'; });
      return g;
    },
    worldcup: () => {
      const g = PX.grid(32, 32);
      PX.disc(g, 16, 9, 7.2, 'Y');
      const cone = [[16, 14, 17], [17, 13, 18], [18, 12, 19], [19, 11, 20], [20, 10, 21], [21, 10, 21]];
      cone.forEach(([y, a, b]) => PX.rect(g, a, y, b - a + 1, 1, 'Y'));
      PX.rect(g, 8, 22, 16, 5, 'D');
      PX.rect(g, 7, 27, 18, 1, 'D');
      PX.rect(g, 12, 24, 8, 2, 'w');
      finish(g);
      // 대륙 모양 얼룩
      [[11, 5, 3, 2], [12, 7, 2, 3], [17, 4, 4, 2], [18, 6, 3, 3], [16, 11, 2, 2], [20, 10, 2, 2], [13, 12, 2, 1], [10, 9, 1, 2]]
        .forEach(([x, y, w, h]) => {
          for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if ('YyW'.includes(g[j][i])) g[j][i] = 'K';
        });
      return g;
    },
    ballon: () => {
      const g = PX.grid(32, 32);
      PX.disc(g, 16, 10, 8.2, 'Y');
      PX.rect(g, 14, 18, 4, 2, 'Y');
      PX.rect(g, 11, 20, 10, 2, 'Y');
      PX.rect(g, 8, 22, 16, 5, 'D');
      PX.rect(g, 7, 27, 18, 1, 'D');
      PX.rect(g, 12, 23, 8, 2, 'w');
      finish(g);
      const patch = (x, y, w, h) => {
        for (let j = y; j < y + h; j++)
          for (let i = x; i < x + w; i++) if ('YyW'.includes(g[j][i])) g[j][i] = 'K';
      };
      patch(15, 8, 2, 1); patch(14, 9, 4, 2); patch(15, 11, 2, 1);
      patch(15, 2, 2, 2); patch(8, 7, 2, 3); patch(22, 7, 2, 3); patch(10, 15, 3, 2); patch(19, 15, 3, 2);
      return g;
    },
    keeper: () => {
      const g = PX.grid(32, 32);
      PX.rect(g, 9, 6, 3, 8, 'Y');
      PX.rect(g, 13, 4, 3, 10, 'Y');
      PX.rect(g, 17, 4, 3, 10, 'Y');
      PX.rect(g, 21, 6, 3, 8, 'Y');
      PX.rect(g, 9, 12, 15, 7, 'Y');
      PX.rect(g, 6, 11, 3, 4, 'Y');
      PX.rect(g, 5, 12, 1, 2, 'Y');
      PX.rect(g, 9, 19, 15, 2, 'r');
      PX.rect(g, 8, 22, 17, 5, 'D');
      PX.rect(g, 7, 27, 19, 1, 'D');
      PX.rect(g, 12, 23, 9, 2, 'w');
      return finish(g);
    },
  };

  PX.TROPHIES = {
    league: '리그 우승', cup: '컵 대회', continental: '대륙 대회', asiancup: '아시안컵',
    worldcup: '월드컵', ballon: '발롱도르', keeper: '골키퍼상',
  };

  const cache = {};
  PX.trophyGrid = function (name) {
    if (!cache[name]) cache[name] = PX.outline(make[name]());
    return cache[name];
  };
  PX.trophyCanvas = function (name, scale = 2) {
    return PX.toCanvas(PX.trophyGrid(name), COLORS, scale);
  };
})();
