// 숫자가 깨지지 않는지(NaN·Infinity·범위), 모든 이벤트가 한 번 이상 나오는지, 세이브를 중간에 다시 불러와도 이어지는지 확인
const { SIM, D, makeIO } = require('./load');
function bad(o, p = '') {
  if (typeof o === 'number') return Number.isFinite(o) ? null : p;
  if (o && typeof o === 'object') for (const k in o) { const r = bad(o[k], p + '.' + k); if (r) return r; }
  return null;
}
(async () => {
  const seen = {}, problems = [];
  const N = +process.argv[2] || 150;
  for (let i = 0; i < N; i++) {
    let G = SIM.newGame({ seed: 31337 + i * 6151, name: 't', pos: ['FW', 'MF', 'DF', 'GK'][i % 4] });
    const io = makeIO(G, { beat: 'random', mini: 'random' });
    let g = 0;
    while (G.phase !== 'retired' && g++ < 900) {
      if (G.phase === 'week') {
        if (SIM.canTalk(G) && SIM.chance(G, 0.3)) { const o = SIM.talkOptions(G); SIM.talk(G, SIM.pick(G, o).key); }
        await SIM.playWeek(G, SIM.pick(G, Object.keys(SIM.ACTIONS)), io, SIM.pick(G, SIM.attrKeys(G.p)));
      }
      else await SIM.endSeason(G, io);
      // 저장했다가 다시 불러온 것처럼 이어 간다
      if (g % 17 === 0) { G = JSON.parse(JSON.stringify(G)); io.rebind && io.rebind(G); }
      const b = bad(G);
      if (b) { problems.push(`${i}: ${b}`); break; }
      const p = G.p;
      SIM.attrKeys(p).forEach((k) => { if (p.attrs[k] < 1 || p.attrs[k] > 99) problems.push(`${i}: attr ${k}=${p.attrs[k]}`); });
      if (p.fatigue < 0 || p.fatigue > 100 || p.trust < 0 || p.trust > 100 || p.pop < 0 || p.pop > 100) problems.push(`${i}: 범위 ${p.fatigue}/${p.trust}/${p.pop}`);
      if (!D.CLUBS[p.club]) problems.push(`${i}: 없는 클럽 ${p.club}`);
    }
    if (G.phase !== 'retired') problems.push(`${i}: 은퇴하지 않고 멈춤 (나이 ${G.p.age})`);
    Object.keys(G.p.seenEvents).forEach((k) => (seen[k] = (seen[k] || 0) + 1));
  }
  const never = D.EVENTS.filter((e) => !seen[e.id]).map((e) => e.id);
  console.log('문제', problems.length ? problems.slice(0, 10) : '없음');
  console.log('한 번도 안 나온 이벤트', never.length ? never : '없음');
  console.log('이벤트 등장 커리어 수', Object.entries(seen).sort((a, b) => a[1] - b[1]).slice(0, 8).map(([k, v]) => `${k}:${v}`).join(' '));
})();
