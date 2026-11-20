// 나이별로 '벤치 시즌'(선발이 리그 경기의 30% 미만) 비율을 잰다.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
['data/clubs.js', 'data/names.js', 'data/events.js', 'js/sim/core.js', 'js/sim/match.js', 'js/sim/season.js', 'js/sim/events.js']
  .forEach((f) => vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), 'utf8')));
const SIM = globalThis.SIM;
(async () => {
  const N = +process.argv[2] || 60;
  const pickMode = process.argv[3] || 'mixed';
  const byAge = {};
  for (let i = 0; i < N; i++) {
    const G = SIM.newGame({ seed: 77 + i * 131, name: 't', pos: ['FW', 'MF', 'DF', 'GK'][i % 4] });
    const io = { async ask(t, d) {
      if (t === 'offers') {
        const o = d.offers;
        // 사람처럼: 절반은 명성 높은 곳, 절반은 출전이 보장되는 곳
        const rnd = SIM.rnd(G);
        let best = 0, bs = -1e9;
        o.forEach((x, k) => { if (x.kind === 'retire') return; const c = SIM.club(x.club);
          const s = pickMode === 'rep' || (pickMode === 'mixed' && rnd < 0.5) ? c.rep : ({ 핵심: 30, '주전 경쟁': 20, 로테이션: 0 }[x.role] || 15) + c.rep * 0.2;
          if (s > bs) { bs = s; best = k; } });
        return best;
      }
      return Math.floor(SIM.rnd(G) * (d.choices ? d.choices.length : 3)); }, async show() {} };
    let g = 0;
    while (G.phase !== 'retired' && g++ < 800) {
      if (G.phase === 'week') await SIM.playWeek(G, G.p.injury ? 'rest' : G.p.fatigue > 55 ? 'rest' : 'train', io, SIM.mainAttrs(G.p.pos)[0]);
      else await SIM.endSeason(G, io);
    }
    G.p.career.filter((c) => !c.partial).forEach((c) => {
      const lg = globalThis.DATA.LEAGUES[SIM.club(c.club).league];
      const games = 12 * lg.perWeek;
      const a = c.age;
      byAge[a] = byAge[a] || { n: 0, bench: 0, starts: 0 };
      byAge[a].n++; byAge[a].starts += c.starts / games;
      if (c.starts < games * 0.3) byAge[a].bench++;
    });
  }
  Object.keys(byAge).sort((a, b) => a - b).forEach((a) => {
    const b = byAge[a];
    console.log(`${a}세  벤치 시즌 ${String(Math.round(b.bench / b.n * 100)).padStart(3)}%  선발 비율 ${Math.round(b.starts / b.n * 100)}%`);
  });
})();
