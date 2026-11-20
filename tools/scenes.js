// 장면 선택 검증: 같은 장면에서 선택지마다 기대 득실이 얼마나 다른지, 힌트대로 고르면 이득인지.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
['data/clubs.js', 'data/names.js', 'data/events.js', 'js/sim/core.js', 'js/sim/match.js', 'js/sim/season.js', 'js/sim/events.js']
  .forEach((f) => vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), 'utf8')));
const SIM = globalThis.SIM;

function smart(s, G) {
  if (s.kind === 'attack') {
    if (s.freeMate && (s.press === 2 || s.dist === 'far' || (s.dist === 'near' && s.side !== 'center'))) return 0;
    if (s.dist === 'far' && !s.gkOut) return s.press === 0 ? 1 : 0;
    if (s.tip === 'slowDef' && G.p.flags.videoBonus) return 1;
    if (s.press === 0) return s.dist === 'near' ? 2 : 1;
    return 2;
  }
  if (s.kind === 'defend') return s.inBox ? 1 : s.type === 'cross' ? 2 : 0;
  if (s.type === '1v1') return { long: 0, calm: 1, fast: 2 }[s.variant];
  if (s.type === 'pk') return s.centerLover ? 1 : s.foot === 'R' ? 2 : 0;
  return s.variant === 'crowded' ? 0 : 1;
}

function value(out) { return (out.goal ? 1 : 0) + (out.assist ? 1 : 0) - (out.conceded ? 1 : 0) + (out.save ? 0.6 : 0); }

for (const pos of ['FW', 'MF', 'DF', 'GK']) {
  for (const gap of [-6, 0, 6]) {
    const G = SIM.newGame({ seed: 4242 + gap, pos, name: 't' });
    const ovr = SIM.ovr(G.p);
    const oppStr = 70;
    SIM.attrKeys(G.p).forEach((k) => (G.p.attrs[k] += 70 + gap - ovr));
    G.p.mental = 55;
    const fx = { oppStr, myStr: 70, opp: 'X' };
    const tot = { rand: 0, smart: 0, best: 0, worst: 0 }, N = 4000;
    let spread = 0;
    for (let i = 0; i < N; i++) {
      G.p.flags.videoBonus = i % 2;
      const res = { gm: 0, go: 0, goals: 0, assists: 0, saves: 0, ratingAdj: 0, sceneN: 0, sceneOk: 0 };
      const sc = SIM.makeScene(G, fx, res, 50);
      // 같은 난수 상태에서 선택지 3개를 모두 시험해 기대값을 본다
      const evs = [0, 1, 2].map((c) => {
        let sum = 0;
        const save = G.rng;
        for (let k = 0; k < 30; k++) { const r = Object.assign({}, res); sum += value(SIM.resolveScene(G, fx, sc, c, r)); }
        G.rng = save + 977;
        return sum / 30;
      });
      tot.rand += (evs[0] + evs[1] + evs[2]) / 3;
      tot.smart += evs[smart(sc, G)];
      tot.best += Math.max(...evs);
      tot.worst += Math.min(...evs);
      spread += Math.max(...evs) - Math.min(...evs);
    }
    const f = (x) => (x / N).toFixed(3);
    console.log(`${pos} 실력차 ${String(gap).padStart(2)}  무작위 ${f(tot.rand)}  힌트봇 ${f(tot.smart)}  최선 ${f(tot.best)}  최악 ${f(tot.worst)}  선택지 간 차이 ${f(spread)}`);
  }
}
