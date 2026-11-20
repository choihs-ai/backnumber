// 주간 이벤트 고르기와 효과 도우미.
(function (root) {
  const SIM = root.SIM;
  const D = root.DATA;
  const { clamp, chance } = SIM;

  function helpers(G) {
    const p = G.p;
    const club = SIM.club(p.club);
    const lg = D.LEAGUES[club.league];
    const ratings = G.season.ratings;
    const recent = ratings.slice(-3);
    const iconic = SIM.ICONIC[p.pos];
    const rc = p.rival && D.CLUBS[p.rival.club];
    return {
      ovr: SIM.ovr(p), age: p.age,
      school: club.league === 'school', pro: SIM.isPro(G),
      abroad: SIM.isPro(G) && lg.country !== 'KR',
      level: lg.level, clubName: club.name,
      rivalGone: !p.rival || p.rival.retired,
      rivalClub: rc ? rc.name : '해외 구단',
      recentAvg: recent.length === 3 ? SIM.avg(recent) : null,
      seasonAvg: SIM.avg(ratings),
      iconic: iconic.includes(p.squadNo), iconicNo: iconic[0],
      chance: (q) => chance(G, q),
      trust: (n) => { p.trust = clamp(p.trust + n, 0, 100); },
      pop: (n) => { p.pop = clamp(p.pop + n, 0, 100); },
      mental: (n) => { p.mental = clamp(p.mental + n, 0, 99); },
      fat: (n) => { p.fatigue = clamp(p.fatigue + n, 0, 100); },
      attr: (k, n) => SIM.addAttr(p, k, n),
      main: (n) => { const [a, b] = SIM.mainAttrs(p.pos); SIM.addAttr(p, a, n); SIM.addAttr(p, b, n * 0.6); },
      injure: (w) => { p.injury = Math.max(p.injury, w + 1); },
    };
  }

  SIM.maybeEvent = async function (G, io) {
    const p = G.p;
    const forced = p.flags.pendingControversy;
    if (!forced && !chance(G, SIM.club(p.club).league === 'school' ? 0.3 : 0.25)) return;
    const X = helpers(G);
    const pool = D.EVENTS.filter((e) => (e.repeat || !p.seenEvents[e.id]) && (!p.lastEvent || p.lastEvent !== e.id) && e.when(G, X));
    if (!pool.length) return;
    const ev = forced && pool.find((e) => e.id === 'controversy') || SIM.weighted(G, pool, (e) => e.w || 1);
    p.seenEvents[ev.id] = (p.seenEvents[ev.id] || 0) + 1;
    p.lastEvent = ev.id;
    if (ev.onShow) ev.onShow(G);
    const X2 = helpers(G);
    const idx = await io.ask('event', { id: ev.id, title: ev.title, text: ev.text(G, X2), choices: ev.choices.map((c) => c.label) });
    const result = ev.choices[idx].go(G, X2);
    await io.show('eventResult', { title: ev.title, text: result });
  };
})(typeof window !== 'undefined' ? window : globalThis);
