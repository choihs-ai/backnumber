// 테스트 도구 공통: 시뮬레이션 파일을 읽고, 화면 대신 대답해 주는 봇을 만든다.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const FILES = ['data/clubs.js', 'data/names.js', 'data/events.js', 'data/events2.js', 'js/sim/core.js', 'js/sim/match.js', 'js/sim/chains.js', 'js/sim/season.js', 'js/sim/events.js'];
FILES.forEach((f) => vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f }));
const SIM = globalThis.SIM, D = globalThis.DATA;

const clone = (x) => JSON.parse(JSON.stringify(x));
const gaussOf = (G) => SIM.gauss(G);

// 사람 수준의 미니게임 입력
function humanTiming(G, skill = 0.2) { return Math.max(0, 1 - Math.abs(gaussOf(G) * skill)); }
function randomTiming(G) { return SIM.rnd(G); }
function humanAim(G, spec) {
  if (spec.type === 'chip') return 1;
  if (spec.gkOut) return SIM.pick(G, [6, 8, 3, 5]);
  return SIM.weighted(G, [0, 1, 2, 3, 4, 5, 6, 7, 8], (z) => [0.6, 0.2, 0.6, 0.8, 0.2, 0.8, 1.6, 0.3, 1.6][z]);
}
function humanDive(G, spec) {
  const b = spec.bias || [1, 0.6, 1, 0.8, 0.25, 0.8, 1.2, 0.6, 1.2];
  if (SIM.chance(G, 0.5)) return b.indexOf(Math.max(...b));
  return SIM.weighted(G, [0, 1, 2, 3, 4, 5, 6, 7, 8], (z) => b[z]);
}
function miniInput(G, kind, spec, human) {
  if (kind === 'shot') return { aim: human ? humanAim(G, spec) : Math.floor(SIM.rnd(G) * 9), timing: human ? humanTiming(G) : randomTiming(G) };
  if (kind === 'dive') return { zone: human ? humanDive(G, spec) : Math.floor(SIM.rnd(G) * 9), timing: human ? humanTiming(G) : randomTiming(G) };
  return { timing: human ? humanTiming(G) : randomTiming(G) };
}

// 한 장면을 끝까지 굴려서 득실을 본다 (이후 선택은 무작위, 미니게임은 사람 수준)
function rollout(G, c, id, k, depth = 0) {
  const b = SIM.chanceBeat(G, c, id);
  const r = b.options[Math.min(k, b.options.length - 1)].go(G, c);
  let end;
  if (r.to === 'shot' || r.to === 'dive' || r.to === 'tackle') end = SIM.chanceMini(G, r, miniInput(G, r.to, r, true)).end;
  else if (r.to === 'end' || depth > 3) end = r.to === 'end' ? r : { ok: true, small: true };
  else return rollout(G, c, r.to, Math.floor(SIM.rnd(G) * 4), depth + 1);
  const res = { gm: 0, go: 0, goals: 0, assists: 0, saves: 0, ratingAdj: 0, sceneN: 0, sceneOk: 0 };
  const v = SIM.chanceApply(G, res, end, null);
  return v + res.ratingAdj * 0.3;
}

// 선택 방식: random(아무거나), first(늘 첫 번째), smart(몇 번 굴려 보고 기대값이 큰 쪽)
function makeIO(G0, opts = {}) {
  let G = G0;
  const beatMode = opts.beat || 'smart';
  const human = opts.mini !== 'random';
  let lastBeat = null;
  return {
    async ask(t, d) {
      if (t === 'beat') {
        lastBeat = d;
        const n = d.beat.options.length;
        if (beatMode === 'random') return Math.floor(SIM.rnd(G) * n);
        if (beatMode === 'first') return 0;
        // smart: 상태를 복사해서 선택지마다 굴려 본다 (진짜 게임 난수는 건드리지 않는다)
        let best = 0, bv = -1e9;
        for (let k = 0; k < n; k++) {
          let sum = 0;
          for (let i = 0; i < (opts.rollouts || 10); i++) {
            const G2 = { rng: (G.rng + 7919 * (i + 1) + k) | 0, season: G.season, p: Object.assign({}, G.p, { attrs: Object.assign({}, G.p.attrs), flags: Object.assign({}, G.p.flags) }) };
            const c2 = clone(d.ctx || {});
            sum += rollout(G2, Object.assign({ fx: d.fx, opp: d.fx.oppStr, atk: d.fx.oppStr + 2, flags: {} }, c2), d.id, k);
          }
          if (sum > bv) { bv = sum; best = k; }
        }
        return best;
      }
      if (t === 'shot' || t === 'dive' || t === 'tackle') return miniInput(G, t, d.spec, human);
      if (t === 'event' || t === 'negotiate') return Math.floor(SIM.rnd(G) * d.choices.length);
      if (t === 'offers') return opts.offer ? opts.offer(G, d.offers, d) : Math.floor(SIM.rnd(G) * d.offers.length);
      if (t === 'choice') return opts.choice ? opts.choice(G, d) : Math.floor(SIM.rnd(G) * d.choices.length);
      return 0;
    },
    async show() {},
    rebind(g) { G = g; },
  };
}

module.exports = { SIM, D, makeIO, clone, miniInput, rollout };
