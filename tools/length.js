// 한 판에 화면이 몇 번 뜨는지 센다 (턴 단위 진행 기준: 6주에 한 번 훈련을 고른다)
const { SIM, makeIO } = require('./load');
(async () => {
  const N = +process.argv[2] || 30;
  const tot = {};
  for (let i = 0; i < N; i++) {
    const G = SIM.newGame({ seed: 4000 + i * 37, name: 't', pos: ['FW', 'MF', 'DF', 'GK'][i % 4] });
    const base = makeIO(G, { beat: 'random', offer: (G, o) => 0 });
    const cnt = {};
    const io = { async ask(t, d) { cnt[t] = (cnt[t] || 0) + 1; return base.ask(t, d); }, async show(t, d) { cnt[t] = (cnt[t] || 0) + 1; } };
    let turns = 0;
    while (G.phase !== 'retired') {
      if (G.phase === 'week') {
        const school = !SIM.isPro(G);
        const len = 6;
        if ((G.week - 1) % len === 0) turns++;
        await SIM.playWeek(G, G.p.fatigue > 60 ? 'rest' : 'train', io);
      } else await SIM.endSeason(G, io);
    }
    cnt.turn = turns;
    cnt.seasons = G.p.career.filter((c) => !c.partial).length;
    for (const k in cnt) tot[k] = (tot[k] || 0) + cnt[k];
  }
  const avg = {};
  for (const k in tot) avg[k] = Math.round((tot[k] / N) * 10) / 10;
  // 화면 수 추정: 턴마다 허브+요약 2장, 장면은 단계+미니게임+결과, 이벤트는 2장
  const screens = avg.turn * 2 + (avg.beat || 0) + (avg.shot || 0) + (avg.dive || 0) + (avg.tackle || 0) + (avg.chanceEnd || 0)
    + (avg.event || 0) * 2 + (avg.offers || 0) + (avg.negotiate || 0) + (avg.seasonEnd || 0) + (avg.tournament || 0) + (avg.ballon || 0)
    + (avg.unlock || 0) + (avg.awaken || 0) + (avg.message || 0) + (avg.callup || 0) + (avg.signed || 0) + 1;
  console.log(avg);
  console.log('한 판 화면 수 추정', Math.round(screens), '· 장면(기회) 수', avg.chanceEnd, '· 시즌', avg.seasons);
})();
