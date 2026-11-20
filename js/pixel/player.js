// 24x26 도트 선수. 기본 몸은 손으로 찍은 외곽선을 쓰고 머리·팔 부품은 채우기만 한 뒤 outline()으로 두른다.
(function () {
  const PX = window.PX;
  const W = 24, H = 26, OY = 2; // 위쪽 2칸은 높이 솟은 머리와 들어 올린 팔 자리

  PX.SKIN = [
    { name: '밝은', S: '#F3CDA6', s: '#D9A57C', m: '#B4775A' },
    { name: '보통', S: '#E2AE80', s: '#C48D60', m: '#9A6444' },
    { name: '구릿빛', S: '#B9805A', s: '#986243', m: '#71432C' },
    { name: '어두운', S: '#7D5038', s: '#603B28', m: '#40251A' },
  ];

  PX.HAIR_COLORS = [
    { name: '검정', H: '#2E2824', h: '#1B1714', L: '#4D433C' },
    { name: '흑갈색', H: '#4B3123', h: '#311F17', L: '#6E4B36' },
    { name: '갈색', H: '#7B4D2B', h: '#58361E', L: '#A06C42' },
    { name: '금발', H: '#D3AA55', h: '#A9843A', L: '#EDD089' },
    { name: '적갈색', H: '#8F3D22', h: '#682B17', L: '#B85D38' },
    { name: '탈색', H: '#D3CEC3', h: '#A7A194', L: '#F1EDE4' },
  ];

  const BASE = [
    '........................',
    '........oooooooo........',
    '.......oSSSSSSSSo.......',
    '......oSSSSSSSSSSo......',
    '......oSSSSSSSSSSo......',
    '......oSSSSSSSSSSo......',
    '......oSSeSSSSeSSo......',
    '......oSSeSSSSeSSo......',
    '.....osSSSSSSSSSSso.....',
    '.......osSSmmSSso.......',
    '........oossssoo........',
    '....oooooCssssCooooo....',
    '...oJJJJJJCssCJJJJJJo...',
    '...oJJjJJJJCCJJJJjJJo...',
    '...oJJjJJJJJJJJJJjJJo...',
    '...oFFojJJJJJJJJjoFFo...',
    '....oooJJJJJJJJJJooo....',
    '......oPPPPPPPPPpo......',
    '......oPPPpooPPPpo......',
    '.......oSSo..oSso.......',
    '.......oKKo..oKKo.......',
    '.......oKko..oKko.......',
    '......oBBBo..oBBBo......',
    '......ooooo..ooooo......',
  ];

  // 머리 모양. 0행이 기본 몸 0행과 같은 높이.
  PX.HAIR_STYLES = [
    {
      name: '짧은 머리',
      rows: [
        '........................',
        '........HHHHHHHH........',
        '.......HHLLHHHHHh.......',
        '......HHHHHHHHHHhh......',
        '......HHHh....hHhh......',
        '......HH........hh......',
      ],
    },
    {
      name: '앞머리',
      rows: [
        '........................',
        '........HHHHHHHH........',
        '.......HHLLLHHHHh.......',
        '......HHHHHHHHHHhh......',
        '......HHHHHHHHHHhh......',
        '......HHhHHhHHHhHh......',
        '......H..........h......',
        '......H..........h......',
      ],
    },
    {
      name: '올린 머리',
      rows: [
        '.........HHHHHH.........',
        '........HHLLHHHH........',
        '.......HHHLHHHHHh.......',
        '......hHHHHHHHHHHh......',
        '......h..........h......',
        '......h..........h......',
      ],
    },
    {
      name: '곱슬',
      rows: [
        '.......HH.HHH.HH........',
        '......HHHHHLHHHHHH......',
        '.....HHHLLHHHHHHHHh.....',
        '.....HHHHHHHHHHHHhh.....',
        '.....HHhHhHHhHHhHhh.....',
        '.....HH..........hh.....',
        '.....hH..........hh.....',
        '......h..........h......',
      ],
    },
    {
      name: '장발',
      rows: [
        '........................',
        '........HHHHHHHH........',
        '.......HHLLHHHHHh.......',
        '......HHHHHHHHHHhh......',
        '......HHHHhh..hhHh......',
        '......HHh.......hh......',
        '......HH.........h......',
        '......HH.........h......',
        '.....HHH........hhh.....',
        '......HH........hh......',
        '......HH........hh......',
      ],
    },
    {
      name: '삭발',
      rows: [
        '........................',
        '........hhhhhhhh........',
        '.......hhHHhhhhhh.......',
        '......hhhhhhhhhhhh......',
        '......hh........hh......',
      ],
    },
  ];

  PX.KIT_PATTERNS = ['solid', 'vstripe', 'hstripe', 'half'];

  function baseGrid() {
    const g = PX.grid(W, H);
    PX.stamp(g, PX.fromRows(BASE), 0, OY);
    return g;
  }

  const at = (g, x, y, k) => PX.set(g, x, y + OY, k);
  const fill = (g, x, y, w, h, k) => PX.rect(g, x, y + OY, w, h, k);

  // side: 1 = 오른쪽 팔(화면 기준), -1 = 왼쪽 팔. 왼쪽은 좌우 반전 좌표로 그린다.
  function armLayer(kind, side, dy) {
    const a = PX.grid(W, H);
    const R = (x, y, w, h, k) => {
      const xs = side === 1 ? x : W - x - w;
      fill(a, xs, y, w, h, k);
    };
    if (kind === 'up') {
      R(17, 11, 3, 2, 'J');
      R(19, 9 + dy, 2, 3 - dy, 'J');
      R(19, 5 + dy, 2, 4, 'S');
      R(18, 2 + dy, 4, 3, 'F');
      R(side === 1 ? 21 : 18, 3 + dy, 1, 2, 'f');
    } else if (kind === 'out') {
      R(17, 11 + dy, 4, 2, 'J');
      R(21, 11 + dy, 2, 2, 'F');
    } else if (kind === 'sky') {
      R(17, 11, 3, 2, 'J');
      R(19, 9 + dy, 2, 3 - dy, 'J');
      R(19, 6 + dy, 2, 3, 'S');
      R(19, 4 + dy, 2, 2, 'F');
      R(20, 1 + dy, 1, 3, 'F');
    }
    return a;
  }

  function eraseArm(g, side) {
    for (let y = 11; y <= 16; y++)
      for (let x = 18; x <= 21; x++) at(g, side === 1 ? x : W - 1 - x, y, '.');
    for (let y = 12; y <= 16; y++) at(g, side === 1 ? 17 : 6, y, 'o');
  }

  // pose: stand | fist | plane | sky,  frame: 0 | 1
  PX.playerGrid = function (spec) {
    const g = baseGrid();
    const hair = PX.HAIR_STYLES[spec.hairStyle || 0];
    PX.stamp(g, PX.fromRows(hair.rows), 0, OY);

    const pose = spec.pose || 'stand';
    const frame = spec.frame || 0;

    if (pose === 'stand' && frame === 1) {
      // 눈 깜빡임
      at(g, 9, 6, 'S'); at(g, 14, 6, 'S');
    }
    if (pose !== 'stand') {
      at(g, 11, 9, 'e'); at(g, 12, 9, 'e'); // 소리치는 입
    }
    const arms = [];
    if (pose === 'fist') arms.push(['up', 1, frame]);
    if (pose === 'plane') arms.push(['out', 1, frame], ['out', -1, frame]);
    if (pose === 'sky') arms.push(['sky', 1, frame], ['sky', -1, frame]);
    arms.forEach(([kind, side, dy]) => {
      eraseArm(g, side);
      PX.stamp(g, armLayer(kind, side, dy));
    });
    PX.outline(g);
    return g;
  };

  PX.playerColors = function (spec) {
    const skin = PX.SKIN[spec.skin || 0];
    const hair = PX.HAIR_COLORS[spec.hairColor || 0];
    const kit = spec.kit;
    const gk = !!spec.gk;
    const glove = { F: '#E7E1D2', f: '#B9B2A2' };
    const dark = (c) => PX.mix(c, '#1E1E1E', 0.28);
    const second = kit.secondary === kit.primary ? PX.UI.paper : kit.secondary;

    const jersey = (x, y) => {
      const bx = x, by = y - OY;
      switch (kit.pattern) {
        case 'vstripe': return ((bx - 4) >> 1) % 2 === 0 ? kit.primary : second;
        case 'hstripe': return (by >> 1) % 2 === 0 ? second : kit.primary;
        case 'half': return bx < 12 ? kit.primary : second;
        default: return kit.primary;
      }
    };
    const map = {
      S: skin.S, s: skin.s, m: skin.m, e: '#1E1E1E',
      H: hair.H, h: hair.h, L: hair.L,
      F: gk ? glove.F : skin.S, f: gk ? glove.f : skin.s,
      C: second,
      P: kit.shorts, p: dark(kit.shorts),
      K: kit.socks, k: dark(kit.socks),
      B: kit.boots || '#4A4440',
    };
    return (k, x, y) => {
      if (k === 'J') return jersey(x, y);
      if (k === 'j') return dark(jersey(x, y));
      return map[k];
    };
  };

  PX.playerCanvas = function (spec, scale = 4) {
    return PX.toCanvas(PX.playerGrid(spec), PX.playerColors(spec), scale, !!spec.flip);
  };

  PX.PLAYER_SIZE = { w: W, h: H };
})();
