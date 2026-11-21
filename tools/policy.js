// 훈련 방식·이적 방식별 커리어 결과 비교
const { SIM, D, makeIO } = require('./load');
const BIG5 = ['epl', 'liga', 'seriea', 'bund', 'ligue1'];

const TRAIN = {
  train: (G) => (G.p.injury ? 'rest' : G.p.fatigue > 60 ? 'rest' : 'train'),
  focus: (G) => (G.p.injury ? 'rest' : G.p.fatigue > 60 ? 'rest' : 'focus'),
  smart: (G) => (G.p.injury ? 'rest' : G.p.fatigue >= 60 ? 'rest' : G.p.fatigue >= 45 ? 'recovery' : G.week % 6 === 0 ? 'video' : G.week % 6 === 3 ? 'special' : G.week % 6 === 4 && G.p.age >= 19 ? 'setpiece' : 'train'),
  random: (G) => SIM.pick(G, ['train', 'focus', 'rest', 'video', 'sns', 'train']),
  lazy: (G) => SIM.pick(G, ['rest', 'sns', 'video', 'rest']),
};
const OFFER = {
  role: (G, o) => { let b = 0, bs = -1e9; o.forEach((x, i) => { if (x.kind === 'retire') return; const c = SIM.club(x.club); const s = ({ 핵심: 30, '주전 경쟁': 22, 로테이션: 0 }[x.role] ?? 12) + c.rep * 0.3 + (x.kind === 'univ' && SIM.ovr(G.p) < 56 ? 20 : 0); if (s > bs) { bs = s; b = i; } }); return b; },
  smart: (G, o) => {
    const ok = o.map((x, i) => [x, i]).filter(([x]) => x.kind !== 'retire');
    const good = ok.filter(([x]) => x.role && x.role !== '로테이션' || x.kind === 'loan');
    const pool = good.length ? good : ok;
    if (!pool.length) return 0;
    let b = pool[0][1], bs = -1e9;
    pool.forEach(([x, i]) => { const s = SIM.club(x.club).rep + (x.role === '핵심' ? 6 : 0) + (x.kind === 'univ' && SIM.ovr(G.p) < 56 ? 50 : 0); if (s > bs) { bs = s; b = i; } });
    return b;
  },
  rep: (G, o) => { let b = 0, bs = -1e9; o.forEach((x, i) => { if (x.kind === 'retire') return; const s = SIM.club(x.club).rep; if (s > bs) { bs = s; b = i; } }); return b; },
  random: (G, o) => { const ok = o.map((x, i) => i).filter((i) => o[i].kind !== 'retire'); return SIM.pick(G, ok.length ? ok : [0]); },
};
async function run(n, train, offer, scene, pos) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const G = SIM.newGame({ seed: 9001 + i * 104729, name: 't', pos: pos || ['FW', 'MF', 'DF', 'GK'][i % 4] });
    const io = makeIO(G, { beat: scene === 'smart' ? 'smart' : 'random', mini: scene === 'smart' ? 'human' : 'random', rollouts: 6, offer: (G, o) => OFFER[offer](G, o) });
    let g = 0;
    while (G.phase !== 'retired' && g++ < 900) {
      if (G.phase === 'week') await SIM.playWeek(G, TRAIN[train](G), io, SIM.mainAttrs(G.p.pos)[G.week % 2]);
      else await SIM.endSeason(G, io);
    }
    const p = G.p, c = p.career.filter((x) => !x.partial);
    out.push({
      peak: G.hall.peak, pot: p.pot,
      pro: c.some((x) => !SIM.club(x.club).fake),
      abroad: c.some((x) => D.LEAGUES[SIM.club(x.club).league].country !== 'KR'),
      big5start: c.some((x) => BIG5.includes(SIM.club(x.club).league) && x.starts >= 20),
      top30: p.ballon.length > 0, win: G.hall.ballonWins > 0, exempt: p.exempt,
      goals: G.hall.goals, caps: G.hall.caps, trophies: G.hall.trophies,
    });
  }
  const pct = (k) => String(Math.round((out.filter((o) => o[k]).length / n) * 100)).padStart(3) + '%';
  const mean = (k) => (out.reduce((a, o) => a + o[k], 0) / n).toFixed(1);
  return `프로${pct('pro')} 해외${pct('abroad')} 빅5주전${pct('big5start')} 발롱30${pct('top30')} 발롱수상${pct('win')} 면제${pct('exempt')} | 최고OVR ${mean('peak')} 골 ${mean('goals')} A매치 ${mean('caps')} 트로피 ${mean('trophies')}`;
}

(async () => {
  const n = +process.argv[2] || 80;
  const combos = (process.argv[3] || 'smart/role/smart,random/random/random,train/role/smart,focus/role/smart,lazy/random/random,smart/rep/smart').split(',');
  for (const c of combos) {
    const [t, o, s] = c.split('/');
    console.log(c.padEnd(22), await run(n, t, o, s, process.argv[4]));
  }
})();
