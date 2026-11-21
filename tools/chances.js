// 장면 검증: 선택과 미니게임 실력이 결과를 얼마나 바꾸는지 포지션·실력차별로 본다.
const { SIM, makeIO } = require('./load');
(async () => {
  const N = +process.argv[2] || 400;
  for (const pos of ['FW', 'MF', 'DF', 'GK']) {
    for (const gap of [-6, 0, 6]) {
      const row = [];
      for (const [beat, mini] of [['random', 'random'], ['random', 'human'], ['smart', 'human']]) {
        const G = SIM.newGame({ seed: 777 + gap * 13 + pos.length, pos, name: 't' });
        const o = SIM.ovr(G.p);
        SIM.attrKeys(G.p).forEach((k) => (G.p.attrs[k] += 70 + gap - o));
        G.p.mental = 55;
        const io = makeIO(G, { beat, mini });
        let gf = 0, ga = 0, ok = 0;
        for (let i = 0; i < N; i++) {
          const res = { gm: 0, go: 0, goals: 0, assists: 0, saves: 0, ratingAdj: 0, sceneN: 0, sceneOk: 0 };
          await SIM.runChance(G, { oppStr: 70, myStr: 70, opp: 'X' }, res, 50, io);
          gf += res.gm; ga += res.go; ok += res.sceneOk;
        }
        row.push(`${beat}/${mini} 득${(gf / N).toFixed(2)} 실${(ga / N).toFixed(2)} 성공${Math.round(ok / N * 100)}%`);
      }
      console.log(`${pos} ${String(gap).padStart(2)} | ${row.join(' | ')}`);
    }
  }
})();
