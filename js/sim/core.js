// 시뮬레이션 공통: 난수, 능력치, 선수 생성. 화면 코드 없이 Node에서도 돈다.
(function (root) {
  const SIM = (root.SIM = root.SIM || {});
  const D = root.DATA;

  // ── 난수 (mulberry32). 상태를 G.rng에 저장해서 세이브를 불러와도 이어진다.
  SIM.rnd = function (G) {
    let a = (G.rng = (G.rng + 0x6d2b79f5) | 0);
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  SIM.ri = (G, a, b) => a + Math.floor(SIM.rnd(G) * (b - a + 1));
  SIM.pick = (G, arr) => arr[Math.floor(SIM.rnd(G) * arr.length)];
  SIM.chance = (G, p) => SIM.rnd(G) < p;
  SIM.gauss = (G) => {
    const u = Math.max(1e-9, SIM.rnd(G)), v = SIM.rnd(G);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  SIM.poisson = (G, l) => {
    const L = Math.exp(-l);
    let k = 0, p = 1;
    do { k++; p *= SIM.rnd(G); } while (p > L && k < 12);
    return k - 1;
  };
  SIM.clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  SIM.sig = (x) => 1 / (1 + Math.exp(-x));
  SIM.weighted = (G, items, wf) => {
    const ws = items.map(wf);
    const sum = ws.reduce((a, b) => a + b, 0);
    let r = SIM.rnd(G) * sum;
    for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  };

  // ── 능력치
  SIM.POS = { FW: '공격수', MF: '미드필더', DF: '수비수', GK: '골키퍼' };
  SIM.FIELD_ATTRS = ['sho', 'pas', 'dri', 'def', 'phy', 'spd'];
  SIM.GK_ATTRS = ['ref', 'pos', 'air', 'one', 'kic', 'cal'];
  SIM.ATTR_NAMES = {
    sho: '슈팅', pas: '패스', dri: '드리블', def: '수비', phy: '피지컬', spd: '스피드',
    ref: '반사신경', pos: '위치선정', air: '공중볼', one: '1대1', kic: '킥', cal: '침착함',
  };
  SIM.WEIGHTS = {
    FW: { sho: 0.32, pas: 0.12, dri: 0.2, def: 0.02, phy: 0.14, spd: 0.2 },
    MF: { sho: 0.14, pas: 0.32, dri: 0.2, def: 0.12, phy: 0.1, spd: 0.12 },
    DF: { sho: 0.02, pas: 0.14, dri: 0.06, def: 0.4, phy: 0.24, spd: 0.14 },
    GK: { ref: 0.24, pos: 0.16, air: 0.14, one: 0.24, kic: 0.1, cal: 0.12 },
  };
  SIM.ICONIC = { FW: [9, 10, 7, 11], MF: [8, 10, 6], DF: [4, 5, 3, 2], GK: [1] };

  SIM.attrKeys = (p) => (p.pos === 'GK' ? SIM.GK_ATTRS : SIM.FIELD_ATTRS);
  SIM.ovr = function (p) {
    const w = SIM.WEIGHTS[p.pos];
    let s = 0;
    for (const k in w) s += w[k] * p.attrs[k];
    return Math.round(s);
  };

  SIM.addAttr = function (p, k, n) {
    p.attrs[k] = SIM.clamp(p.attrs[k] + n, 1, 99);
  };

  // 포지션에서 가장 중요한 능력치 순서
  SIM.mainAttrs = (pos) => Object.entries(SIM.WEIGHTS[pos]).sort((a, b) => b[1] - a[1]).map((e) => e[0]);

  SIM.koName = (G) => SIM.pick(G, D.NAMES.krFamily) + SIM.pick(G, D.NAMES.krGiven);
  SIM.worldName = (G, nat) => {
    const pool = D.NAMES.world[nat] || D.NAMES.world.EN;
    return SIM.pick(G, pool[0]) + ' ' + SIM.pick(G, pool[1]);
  };

  SIM.club = (id) => D.CLUBS[id];
  SIM.league = (id) => D.LEAGUES[D.CLUBS[id].league];

  SIM.workComment = function (p) {
    const w = p.work || 0;
    if (w >= 3.5) return '코치: "훈련장에 제일 먼저 나와서 제일 늦게 간다."';
    if (w >= 1.5) return '코치: "성실하다. 이대로만 하면 된다."';
    if (w > -1.5) return '코치: "할 때는 하는데 들쭉날쭉하다."';
    if (w > -3.5) return '코치: "재능을 낭비하고 있다."';
    return '코치: "요즘 훈련장에서 얼굴 보기가 힘들다."';
  };

  SIM.potentialComment = function (p) {
    const gap = p.pot + (p.work || 0) - SIM.ovr(p);
    if (p.pot >= 90) return gap > 15 ? '스카우트: "이런 재능은 몇 년에 한 번 나온다."' : '스카우트: "완성형에 가까운 특급 선수."';
    if (p.pot >= 82) return gap > 12 ? '스카우트: "성장 폭이 커 보인다."' : '스카우트: "지금도 충분히 좋다."';
    if (p.pot >= 74) return '스카우트: "꾸준히 하면 프로에서 자리를 잡을 선수."';
    return '스카우트: "노력이 재능을 이겨야 한다."';
  };

  // ── 새 커리어
  SIM.newGame = function (opts) {
    const seed = (opts.seed || Date.now()) | 0;
    const G = { v: 1, seed, rng: seed, year: 2027, week: 1, phase: 'week' };
    const pos = opts.pos;
    const attrs = {};
    if (pos === 'GK') {
      SIM.GK_ATTRS.forEach((k) => (attrs[k] = 44 + SIM.ri(G, -3, 5)));
      attrs.ref += 4; attrs.one += 3;
    } else {
      const w = SIM.WEIGHTS[pos];
      SIM.FIELD_ATTRS.forEach((k) => (attrs[k] = Math.round(40 + w[k] * 40 + SIM.ri(G, -3, 5))));
    }
    const school = SIM.pick(G, D.SCHOOLS)[0];
    let rivalSchool;
    do { rivalSchool = SIM.pick(G, D.SCHOOLS)[0]; } while (rivalSchool === school);

    G.p = {
      name: opts.name || '이름없음',
      pos, foot: opts.foot || 'R',
      look: opts.look || { skin: 1, hairStyle: 0, hairColor: 0 },
      attrs,
      pot: SIM.clamp(Math.round(75 + SIM.gauss(G) * 7), 60, 94),
      mental: 50 + SIM.ri(G, -5, 5),
      fatigue: 10, trust: 40, pop: 2, work: 0, sp: 40 + SIM.ri(G, 0, 10),
      age: 16, grade: 1,
      club: school, school,
      squadNo: SIM.ri(G, 25, 33),
      contract: 0,
      injury: 0,
      exempt: false, militaryDone: false, military: null,
      loan: null,
      debut: false,
      flags: {},
      seenEvents: {},
      intl: { caps: 0, goals: 0, youthCaps: 0 },
      trophies: [], awards: [], ballon: [],
      career: [],
    };
    G.p.rival = {
      name: SIM.koName(G),
      ovr: SIM.ovr(G.p) + SIM.ri(G, 0, 3),
      pot: SIM.clamp(G.p.pot + SIM.ri(G, -6, 6), 66, 95),
      club: rivalSchool,
    };
    SIM.startSeason(G);
    return G;
  };
})(typeof window !== 'undefined' ? window : globalThis);
