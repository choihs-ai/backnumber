// 화면 없이 커리어를 끝까지 돌린다.
// 사용법: node tools/qa.js [커리어 수] [봇: random|smart] [포지션]
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const FILES = ['data/clubs.js', 'data/names.js', 'data/events.js', 'js/sim/core.js', 'js/sim/match.js', 'js/sim/season.js', 'js/sim/events.js'];
FILES.forEach((f) => vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f }));
const SIM = globalThis.SIM;

function bot(kind, G) {
  const r = () => SIM.rnd(G);
  const smart = kind === 'smart';
  return {
    async ask(type, d) {
      if (type === 'scene') {
        if (!smart) return Math.floor(r() * 3);
        const s = d.scene;
        if (s.kind === 'attack') {
          if (s.freeMate && (s.press === 2 || s.dist === 'far' || (s.dist === 'near' && s.side !== 'center'))) return 0;
          if (s.dist === 'far' && !s.gkOut) return s.press === 0 ? 1 : 0;
          if (s.press === 0 || s.tip === 'slowDef') return s.dist === 'near' ? 2 : 1;
          return 2;
        }
        if (s.kind === 'defend') return s.inBox ? 1 : s.type === 'cross' ? 2 : s.tip === 'oneFoot' ? 0 : 1;
        if (s.type === '1v1') return { long: 0, calm: 1, fast: 2 }[s.variant];
        if (s.type === 'pk') return s.centerLover && G.p.flags.videoBonus >= 0 ? 1 : s.foot === 'R' ? 2 : 0;
        return s.variant === 'crowded' ? 0 : 1;
      }
      if (type === 'event') return Math.floor(r() * d.choices.length);
      if (type === 'offers') {
        const o = d.offers;
        if (!smart) return Math.floor(r() * o.length);
        // 성실 봇: 핵심·주전 경쟁 중 명성 높은 곳, 은퇴는 34세 이후 실력이 떨어지면
        let best = -1, bs = -1e9;
        o.forEach((x, i) => {
          if (x.kind === 'retire') { if (G.p.age >= 35) { best = i; bs = 1e9; } return; }
          const c = SIM.club(x.club);
          const roleS = { 핵심: 12, '주전 경쟁': 6, 로테이션: -10 }[x.role] || 0;
          const s = (x.kind === 'stay' ? 4 : 0) + c.rep * 0.4 + roleS + (x.kind === 'univ' && SIM.ovr(G.p) < 56 ? 10 : 0);
          if (s > bs) { bs = s; best = i; }
        });
        return Math.max(0, best);
      }
      return 0;
    },
    async show() {},
  };
}

function chooseAction(G, kind) {
  const p = G.p;
  if (kind !== 'smart') return SIM.pick(G, ['train', 'focus', 'rest', 'video', 'sns', 'train']);
  if (p.injury > 0) return 'rest';
  if (p.fatigue >= 62) return 'rest';
  if (G.week % 4 === 0) return 'video';
  return p.fatigue < 35 ? 'focus' : 'train';
}

async function career(seed, kind, pos) {
  const G = SIM.newGame({ seed, name: '테스트', pos: pos || ['FW', 'MF', 'DF', 'GK'][seed % 4] });
  const io = bot(kind, G);
  let guard = 0;
  while (G.phase !== 'retired' && guard++ < 1000) {
    if (G.phase === 'week') {
      const a = chooseAction(G, kind);
      const focus = SIM.mainAttrs(G.p.pos)[0];
      await SIM.playWeek(G, a, io, focus);
    } else if (G.phase === 'seasonEnd') {
      await SIM.endSeason(G, io);
    }
    JSON.stringify(G); // 저장 가능한 상태인지 매번 확인
  }
  return G;
}

(async () => {
  const n = +process.argv[2] || 20;
  const kind = process.argv[3] || 'smart';
  const pos = ['FW', 'MF', 'DF', 'GK'].includes(process.argv[4]) ? process.argv[4] : null;
  const out = [];
  for (let i = 0; i < n; i++) {
    const G = await career(1000 + i * 7919, kind, pos);
    const h = G.hall;
    const p = G.p;
    out.push({
      pos: p.pos, pot: p.pot, peak: h.peak, retireAge: h.age, apps: h.apps, goals: h.goals, assists: h.assists,
      pro: p.career.some((c) => !SIM.club(c.club).fake),
      abroad: p.career.some((c) => !['KR'].includes(globalThis.DATA.LEAGUES[SIM.club(c.club).league].country)),
      big5: p.career.some((c) => ['epl', 'liga', 'seriea', 'bund', 'ligue1'].includes(SIM.club(c.club).league)),
      big5Start: p.career.some((c) => ['epl', 'liga', 'seriea', 'bund', 'ligue1'].includes(SIM.club(c.club).league) && c.starts >= 20),
      ballonTop30: p.ballon.length > 0, ballonWin: h.ballonWins > 0, best: h.ballonBest,
      exempt: p.exempt, military: p.militaryDone, caps: h.caps, trophies: h.trophies, seasons: p.career.length,
      clubs: h.clubs.join(' > '),
    });
  }
  const pct = (k) => Math.round((out.filter((o) => o[k]).length / n) * 100) + '%';
  const mean = (k) => Math.round((out.reduce((a, o) => a + o[k], 0) / n) * 10) / 10;
  console.log(`봇=${kind} 커리어=${n}`);
  console.log(`프로 ${pct('pro')} · 해외 ${pct('abroad')} · 빅5 ${pct('big5')} · 빅5 주전 ${pct('big5Start')} · 발롱 30위 ${pct('ballonTop30')} · 발롱 수상 ${pct('ballonWin')} · 면제 ${pct('exempt')} · 군복무 ${pct('military')}`);
  console.log(`평균: 최고 OVR ${mean('peak')} · 은퇴 나이 ${mean('retireAge')} · 경기 ${mean('apps')} · 골 ${mean('goals')} · A매치 ${mean('caps')} · 트로피 ${mean('trophies')}`);
  if (process.argv.includes('-v')) out.forEach((o) => console.log(JSON.stringify(o)));
})().catch((e) => { console.error(e); process.exit(1); });
