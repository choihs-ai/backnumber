// 경기 시뮬레이션과 장면 선택.
(function (root) {
  const SIM = root.SIM;
  const { rnd, ri, pick, chance, gauss, poisson, clamp, sig } = SIM;


  // ── 평점
  SIM.rate = function (G, res) {
    if (!res.mins) return null;
    const p = G.p;
    let r = 6.45 + res.goals * 0.9 + res.assists * 0.6;
    r += res.gm > res.go ? 0.3 : res.gm < res.go ? -0.3 : 0;
    r += (SIM.ovr(p) - res.fx.myStr) / 20 - Math.max(0, p.fatigue - 40) / 60 + gauss(G) * 0.4 + res.ratingAdj;
    if (p.pos === 'DF') r += res.go === 0 ? 0.6 : -0.2 * res.go;
    if (p.pos === 'GK') r += (res.go === 0 ? 0.6 : -0.25 * res.go) + res.saves * 0.18;
    if (res.role === 'sub') r = 6.4 + (r - 6.4) * 0.6;
    return Math.round(clamp(r, 4, 10) * 10) / 10;
  };

  // ── 경기 한 판
  SIM.playMatch = async function (G, fx, role, io) {
    const p = G.p;
    const ovr = SIM.ovr(p);
    const onPitch = role === 'start' || role === 'sub';
    let my = fx.myStr;
    if (role === 'start') my += (ovr - my) * 0.15;
    if (role === 'start' && SIM.has && SIM.has(G, 'leader')) my += 1;
    const homeMul = fx.home ? 1.1 : 0.92;
    // 한 시즌에 장면이 너무 많으면 지친다: 결승·데뷔전·대표팀 대회는 늘, 나머지는 시즌 예산 안에서만
    const S = G.season;
    const must = fx.final || fx.tag === '데뷔전' || fx.comp === 'tour';
    if (S && S.sceneBudget === undefined) S.sceneBudget = 2;
    // 장면 예산은 '기회' 개수 기준. 결승·데뷔전·대표팀 대회는 예산과 별개
    let nScenes = 0;
    if (fx.important && onPitch) {
      const want = role === 'start' && fx.comp !== 'tour' && fx.tag !== '데뷔전' ? 2 : 1;
      nScenes = must ? want : Math.min(want, S ? S.sceneBudget : 0);
      if (!must && S) S.sceneBudget -= nScenes;
    }
    const scenes = nScenes > 0;
    // 장면에서 나오는 골·실점만큼 자동 득점 기대값을 미리 덜어 둔다 (포지션마다 장면 종류가 달라서 따로)
    // 기준: 장면 평균 2.4번일 때 장면 득실을 뺀 값 (tools/chances.js로 잰 평균 수준 플레이 기준)
    const full = { FW: [0.45, 0.95], MF: [0.65, 0.85], DF: [0.9, 0.65], GK: [1, 0.3] }[p.pos];
    const cut = full.map((x) => 1 - (1 - x) * (nScenes / 2.4));
    const lm = 1.3 * Math.exp((my - fx.oppStr) / 15) * homeMul * cut[0];
    const lo = (1.3 * Math.exp((fx.oppStr - my) / 15)) / homeMul * cut[1];
    const res = { fx, role, mins: 0, gm: poisson(G, lm), go: poisson(G, lo), goals: 0, assists: 0, saves: 0, ratingAdj: 0, sceneN: 0, sceneOk: 0, notes: [] };
    res.mins = role === 'start' ? (chance(G, 0.22) ? ri(G, 62, 85) : 90) : role === 'sub' ? ri(G, 12, 30) : 0;

    if (onPitch) {
      const share = res.mins / 90;
      const rel = (k) => (p.attrs[k] - fx.myStr);
      let gShare = 0, aShare = 0;
      if (p.pos === 'FW') { gShare = clamp(0.18 + rel('sho') / 120, 0.08, 0.36); aShare = clamp(0.12 + rel('pas') / 150, 0.05, 0.22); }
      if (p.pos === 'MF') { gShare = clamp(0.08 + rel('sho') / 160, 0.03, 0.18); aShare = clamp(0.2 + rel('pas') / 110, 0.08, 0.34); }
      if (p.pos === 'DF') { gShare = 0.035; aShare = 0.06; }
      if (p.pos === 'GK') { aShare = 0.005; }
      for (let i = 0; i < res.gm; i++) {
        if (chance(G, gShare * share)) res.goals++;
        else if (chance(G, aShare * share)) res.assists++;
      }
      if (p.pos === 'GK') res.saves = poisson(G, (1 + lo * 1.4) * share);
    }

    if (scenes) {
      const mins = [];
      for (let i = 0; i < nScenes; i++) mins.push(role === 'sub' ? ri(G, 75, 90) : ri(G, 8, 88));
      mins.sort((a, b) => a - b);
      const base = [res.gm, res.go];
      for (const m of mins) {
        // 장면 시점의 점수: 자동 점수를 시간 비율로 나누고, 앞선 장면 결과를 더한다
        const shown = { gm: Math.round(base[0] * m / 90) + (res.gm - base[0]), go: Math.round(base[1] * m / 90) + (res.go - base[1]) };
        await SIM.runChance(G, fx, res, m, { ask: (t, d) => io.ask(t, Object.assign(d, { score: [shown.gm, shown.go] })), show: io.show });
      }
      if (p.flags.videoBonus > 0) p.flags.videoBonus--;
    }
    res.rating = SIM.rate(G, res);
    res.result = res.gm > res.go ? 'W' : res.gm < res.go ? 'L' : 'D';
    return res;
  };
})(typeof window !== 'undefined' ? window : globalThis);
