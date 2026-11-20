// 주차·시즌·이적·대표팀·시상·병역·은퇴.
(function (root) {
  const SIM = root.SIM;
  const D = root.DATA;
  const { ri, pick, chance, gauss, clamp, sig } = SIM;

  const WEEKS = (SIM.WEEKS = 12);
  const MIL_WEEKS = 18; // 1시즌 반

  SIM.isPro = (G) => !['school', 'univ'].includes(SIM.club(G.p.club).league);
  SIM.avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  // ── 국가 전력
  const NATIONS_A = { 일본: 77, 이란: 74, 호주: 73, 사우디아라비아: 69, 우즈베키스탄: 68, 카타르: 67, 이라크: 66, 요르단: 66, 아랍에미리트: 65, 중국: 64,
    브라질: 85, 아르헨티나: 86, 프랑스: 87, 잉글랜드: 85, 스페인: 87, 독일: 84, 포르투갈: 84, 네덜란드: 83, 이탈리아: 82, 크로아티아: 80,
    벨기에: 81, 모로코: 80, 우루과이: 80, 콜롬비아: 79, 미국: 77, 멕시코: 77, 세네갈: 77, 스위스: 78, 덴마크: 78, 캐나다: 75, 에콰도르: 76, 가나: 73 };
  const ASIA = ['일본', '이란', '호주', '사우디아라비아', '우즈베키스탄', '카타르', '이라크', '요르단', '아랍에미리트', '중국'];
  const NATIONS_U23 = { 일본: 66, 우즈베키스탄: 63, 사우디아라비아: 61, 이란: 62, 카타르: 60, 이라크: 60, 태국: 56, 베트남: 57, 중국: 58, 호주: 62,
    스페인: 72, 프랑스: 72, 브라질: 72, 아르헨티나: 71, 이집트: 63, 모로코: 66, 미국: 65, 말리: 63, 파라과이: 64 };
  const KOREA = { A: 75, U23: 64, U20: 60 };

  function nationFx(G, pool, names, round, comp, important) {
    const name = pick(G, names);
    return { comp, opp: name, oppStr: pool[name] + gauss(G) * 1.5, myStr: null, home: chance(G, 0.4), round, important, intl: true };
  }

  // ── 상대 고르기
  const FAKE_OPPS = {
    univ: ['청림대학', '남강대학', '동해대학', '백운대학', '송현대학', '서해대학', '가람대학'],
    k3: ['여울FC', '바람시민축구단', '강변FC', '들녘FC', '한내FC', '솔뫼시민축구단'],
  };
  function leaguePool(club) {
    if (club.league === 'school') return D.SCHOOLS.map((s) => D.CLUBS[s[0]]).filter((c) => c.id !== club.id);
    if (FAKE_OPPS[club.league]) {
      return FAKE_OPPS[club.league].map((n, i) => ({ id: null, name: n, short: '', str: club.str + ((i * 7) % 7) - 3, rep: 5, league: club.league }));
    }
    return D.clubsIn(club.league).filter((c) => c.id !== club.id && c.id !== D.MILITARY_CLUB);
  }
  function countryPool(club) {
    const country = D.LEAGUES[club.league].country;
    return Object.values(D.CLUBS).filter((c) => !c.fake && c.id !== club.id && D.LEAGUES[c.league].country === country);
  }
  function contPool(club) {
    const cont = D.LEAGUES[club.league].cont;
    return Object.values(D.CLUBS).filter((c) => !c.fake && c.id !== club.id && D.LEAGUES[c.league].cont === cont && c.str >= 66);
  }
  function qualifiesCont(club) {
    const lg = D.LEAGUES[club.league];
    if (!lg.cont) return false;
    const ranked = D.clubsIn(club.league).sort((a, b) => b.str - a.str || b.rep - a.rep);
    return ranked.findIndex((c) => c.id === club.id) < lg.contSlots;
  }

  const CUP_WEEKS = { pro: { 3: '16강', 6: '8강', 9: '4강', 11: '결승' }, school: { 9: '16강', 10: '8강', 11: '4강', 12: '결승' }, univ: { 4: '16강', 6: '8강', 8: '4강', 10: '결승' } };
  const CONT_WEEKS = { 2: '조별리그', 4: '조별리그', 5: '조별리그', 7: '조별리그', 8: '16강', 9: '8강', 10: '4강', 12: '결승' };
  const INTL_WINDOWS = [3, 7, 10];

  function cupKey(club) { return club.league === 'school' ? 'school' : club.league === 'univ' ? 'univ' : 'pro'; }

  // ── 시즌 시작
  SIM.startSeason = function (G) {
    const p = G.p;
    const club = SIM.club(p.club);
    G.week = 1;
    G.phase = 'week';
    const incumbent = club.league === 'school' ? 53 + ri(G, 0, 4) : club.str + ri(G, -2, 4);
    const S = (G.season = {
      year: G.year, club: club.id, league: club.league, form: gauss(G) * 1.2, spot: incumbent,
      apps: 0, starts: 0, mins: 0, goals: 0, assists: 0, ratings: [], cs: 0, saves: 0, sceneN: 0, sceneOk: 0,
      lg: { gp: 0, w: 0, d: 0, l: 0, pts: 0, gf: 0, ga: 0 },
      cup: { alive: true, round: '', won: false },
      cont: qualifiesCont(club) ? { alive: true, gp: 0, pts: 0, stage: '조별리그', won: false } : null,
      intl: { caps: 0, goals: 0 },
      trophies: [], awards: [], log: [], bigLeft: 2, firstMatch: !!p.flags.newClub, called: false,
      prevNo: p.squadNo,
    });
    p.flags.newClub = false;
    assignNumber(G);
    return S;
  };

  function assignNumber(G) {
    const p = G.p, S = G.season;
    const lead = SIM.ovr(p) - S.spot;
    const iconic = SIM.ICONIC[p.pos];
    if (lead >= 3 || (lead >= 0 && chance(G, 0.5))) {
      if (!iconic.includes(p.squadNo)) p.squadNo = iconic[0] === 1 || chance(G, 0.6) ? iconic[0] : pick(G, iconic);
    } else if (lead < -6 && iconic.includes(p.squadNo) && chance(G, 0.5)) {
      p.squadNo = ri(G, 13, 35);
    }
  }

  SIM.weekPlan = function (G, w = G.week) {
    const p = G.p, S = G.season, club = SIM.club(S.club), lg = D.LEAGUES[club.league];
    const plan = [];
    plan.push({ comp: 'league', n: lg.perWeek, label: `${lg.name} ${lg.perWeek}경기` });
    const cw = CUP_WEEKS[cupKey(club)];
    if (cw[w] && S.cup.alive) plan.push({ comp: 'cup', n: 1, label: `${lg.cup} ${cw[w]}` });
    if (S.cont && S.cont.alive && CONT_WEEKS[w]) {
      const st = CONT_WEEKS[w];
      if (st === '조별리그' ? S.cont.stage === '조별리그' : S.cont.stage !== '조별리그')
        plan.push({ comp: 'cont', n: 1, label: `${D.CONTINENTAL[lg.cont].short} ${st}` });
    }
    if (S.called && INTL_WINDOWS.includes(w)) plan.push({ comp: 'intl', n: 2, label: '대표팀 평가전 2경기' });
    return plan;
  };

  function provisionalRank(G) {
    const S = G.season, club = SIM.club(S.club);
    const pool = leaguePool(club);
    const avgStr = SIM.avg(pool.map((c) => c.str).concat(club.str));
    const ahead = pool.filter((c) => clamp(1.37 + (c.str - avgStr) * 0.09, 0.5, 2.4) * S.lg.gp > S.lg.pts).length;
    return 1 + ahead;
  }

  function buildFixtures(G) {
    const p = G.p, S = G.season, club = SIM.club(S.club), lg = D.LEAGUES[club.league];
    const w = G.week, out = [];
    const myStr = club.str + S.form;
    const pool = leaguePool(club);
    const top = pool.slice().sort((a, b) => b.str - a.str).slice(0, 3).map((c) => c.name);
    const race = w === WEEKS && provisionalRank(G) <= 2 && SIM.isPro(G);
    for (let i = 0; i < lg.perWeek; i++) {
      const o = pick(G, pool);
      const fx = { comp: 'league', opp: o.name, oppId: o.id, oppStr: o.str + gauss(G) * 1.5, myStr, home: chance(G, 0.5), round: `${lg.name}`, important: false };
      if (S.bigLeft > 0 && top.includes(o.name) && o.str >= club.str - 1 && chance(G, 0.35) && SIM.isPro(G)) { fx.important = true; fx.tag = '빅매치'; S.bigLeft--; }
      if (race && i === lg.perWeek - 1) { fx.important = true; fx.tag = '우승 경쟁'; }
      out.push(fx);
    }
    const cw = CUP_WEEKS[cupKey(club)];
    if (cw[w] && S.cup.alive) {
      const round = cw[w];
      const cpool = club.league === 'school' ? pool : countryPool(club);
      const lift = { '16강': 0, '8강': 2, '4강': 3, '결승': 4 }[round];
      const o = SIM.weighted(G, cpool, (c) => Math.exp((c.str - myStr + lift) / 4));
      out.push({ comp: 'cup', opp: o.name, oppId: o.id, oppStr: o.str + gauss(G), myStr, home: chance(G, 0.5), round: `${lg.cup} ${round}`, ko: true, final: round === '결승',
        important: round === '4강' || round === '결승', tag: round === '결승' ? '결승' : round === '4강' ? '4강' : undefined });
    }
    if (S.cont && S.cont.alive && CONT_WEEKS[w]) {
      const st = CONT_WEEKS[w];
      const isGroup = st === '조별리그';
      if (isGroup === (S.cont.stage === '조별리그')) {
        const o = SIM.weighted(G, contPool(club), (c) => Math.exp((c.str - myStr + (isGroup ? -2 : 3)) / 4));
        const name = D.CONTINENTAL[lg.cont].short;
        out.push({ comp: 'cont', opp: o.name, oppId: o.id, oppStr: o.str + gauss(G), myStr, home: chance(G, 0.5), round: `${name} ${st}`, ko: !isGroup, final: st === '결승',
          important: !isGroup, tag: !isGroup ? `${name} ${st}` : undefined });
      }
    }
    if (S.called && INTL_WINDOWS.includes(w)) {
      for (let i = 0; i < 2; i++) {
        const fx = nationFx(G, NATIONS_A, Object.keys(NATIONS_A), '평가전', 'intl', i === 0);
        fx.myStr = KOREA.A; fx.tag = i === 0 ? 'A매치' : undefined;
        out.push(fx);
      }
    }
    return out;
  }

  // ── 출전 판정
  SIM.selectRole = function (G, spot, trust) {
    const p = G.p;
    if (p.injury > 0) return 'out';
    const school = SIM.club(p.club).league === 'school';
    const score = SIM.ovr(p) - spot + (trust - 50) / 10 - Math.max(0, p.fatigue - 30) / 15 + gauss(G) * 1.5;
    if (score >= 0) return 'start';
    if (score >= -4) return chance(G, 0.6) ? 'sub' : 'bench';
    if (score >= -9 || school) return chance(G, school ? 0.25 : 0.3) ? 'sub' : 'bench';
    return 'out';
  };

  // ── 훈련
  const FATIGUE = { train: 6, focus: 14, rest: -30, video: 2, sns: 2 };
  SIM.ACTIONS = {
    train: { name: '기본 훈련', icon: 'train', desc: '포지션에 맞게 고르게 성장' },
    focus: { name: '집중 훈련', icon: 'focus', desc: '능력치 하나를 크게. 피로가 많이 쌓인다' },
    rest: { name: '휴식', icon: 'rest', desc: '피로 회복, 부상 회복 두 배' },
    video: { name: '영상 분석', icon: 'video', desc: '멘탈 상승, 다음 큰 경기에서 힌트 추가' },
    sns: { name: 'SNS·미디어', icon: 'sns', desc: '인기 상승. 가끔 논란이 생긴다', pro: true },
  };

  function grow(G, action, focusKey, minsRatio) {
    const p = G.p;
    const ovr = SIM.ovr(p);
    const age = p.age;
    const ageC = age <= 19 ? 1 : age <= 23 ? 0.8 : age <= 27 ? 0.4 : age <= 30 ? 0.12 : 0;
    const gap = clamp((p.pot - ovr) / 20, 0.08, 1);
    const base = 0.4 * ageC * gap * (1 + 0.5 * minsRatio);
    const w = SIM.WEIGHTS[p.pos];
    const keys = SIM.attrKeys(p);
    let gains = {};
    keys.forEach((k) => {
      let m = 0;
      if (action === 'train') m = 0.6 + 2.4 * w[k];
      else if (action === 'focus') m = k === focusKey ? 2.4 : 0.3;
      else if (action === 'video' || action === 'sns') m = 0.3 * (0.6 + 2.4 * w[k]);
      // 경기만 뛰어도 조금은 큰다
      m += 0.25 * minsRatio;
      const g = base * m * (0.85 + 0.3 * SIM.rnd(G));
      if (g > 0) { SIM.addAttr(p, k, g); gains[k] = g; }
    });
    return gains;
  }

  function decline(G) {
    const p = G.p;
    if (p.age < 31) return;
    const hard = p.age >= 34 ? 1.8 : 1;
    const care = p.flags.bodyCare ? 0.75 : 1;
    SIM.attrKeys(p).forEach((k) => {
      const fast = ['spd', 'phy', 'ref', 'one'].includes(k);
      SIM.addAttr(p, k, -(fast ? 1.6 + SIM.rnd(G) * 1.6 : 0.4 + SIM.rnd(G)) * hard * care);
    });
  }

  // ── 기록
  function record(G, res) {
    const p = G.p, S = G.season, fx = res.fx;
    const played = res.mins > 0;
    const lgLevel = SIM.league(S.club).level;
    if (fx.intl) {
      if (played) {
        if (fx.youth) p.intl.youthCaps++; else { p.intl.caps++; S.intl.caps++; }
        p.intl.goals += fx.youth ? 0 : res.goals;
        S.intl.goals += fx.youth ? 0 : res.goals;
        p.pop += res.goals * 3 + (res.rating >= 7.5 ? 1 : 0);
      }
    } else if (played) {
      S.apps++; if (res.role === 'start') S.starts++;
      S.mins += res.mins; S.goals += res.goals; S.assists += res.assists;
      S.ratings.push(res.rating);
      if ((p.pos === 'GK' || p.pos === 'DF') && res.role === 'start' && res.go === 0) S.cs++;
      S.saves += res.saves;
      p.trust = clamp(p.trust + (res.rating - 6.5) * 3, 0, 100);
      p.pop += res.goals * (0.3 + lgLevel) + (res.rating >= 8 ? 1 : 0);
    }
    if (played) {
      S.sceneN += res.sceneN; S.sceneOk += res.sceneOk;
      if (fx.important) p.mental = clamp(p.mental + 0.4, 0, 99);
      p.fatigue = clamp(p.fatigue + (res.role === 'start' ? 3 : 1), 0, 100);
      if (SIM.isPro(G) && !fx.intl) p.debut = true;
      const risk = 0.005 + Math.max(0, p.fatigue - 55) * 0.0012;
      if (chance(G, risk)) {
        const wks = chance(G, 0.8) ? ri(G, 1, 3) : ri(G, 4, 8);
        p.injury = Math.max(p.injury, wks + 1);
        res.injured = wks;
        p.flags.lastInjury = wks;
      }
    }
    // 승부차기
    if (fx.ko && res.gm === res.go) {
      res.pens = chance(G, sig((fx.myStr - fx.oppStr) / 10)) ? 'W' : 'L';
    }
    const won = res.gm > res.go || res.pens === 'W';
    if (fx.comp === 'league') {
      const L = S.lg;
      L.gp++; L.gf += res.gm; L.ga += res.go;
      if (res.gm > res.go) { L.w++; L.pts += 3; } else if (res.gm === res.go) { L.d++; L.pts++; } else L.l++;
    } else if (fx.comp === 'cup') {
      if (!won) S.cup.alive = false;
      else if (fx.final) { S.cup.won = true; S.cup.alive = false; }
      S.cup.round = fx.round;
    } else if (fx.comp === 'cont') {
      const C = S.cont;
      if (!fx.ko) {
        C.gp++; C.pts += res.gm > res.go ? 3 : res.gm === res.go ? 1 : 0;
        if (C.gp === 4) {
          if (C.pts >= 7 || (C.pts >= 5 && chance(G, 0.5))) C.stage = '토너먼트';
          else C.alive = false;
        }
      } else {
        if (!won) C.alive = false;
        else if (fx.final) { C.won = true; C.alive = false; }
      }
      C.last = fx.round;
    }
    S.log.push({ w: G.week, comp: fx.comp, opp: fx.opp, gm: res.gm, go: res.go, pens: res.pens, role: res.role, g: res.goals, a: res.assists, r: res.rating, tag: fx.tag });
  }

  // ── 한 주
  SIM.playWeek = async function (G, action, io, focusKey) {
    const p = G.p, S = G.season;
    if (p.injury > 0 && (action === 'train' || action === 'focus')) action = 'rest';
    if (action === 'sns' && !SIM.isPro(G)) action = 'train';
    p.fatigue = clamp(p.fatigue + FATIGUE[action], 0, 100);
    if (action === 'video') { p.mental = clamp(p.mental + 1.5, 0, 99); p.flags.videoBonus = 2; }
    if (action === 'sns') { p.pop += 3; if (chance(G, 0.1)) p.flags.pendingControversy = true; }

    // 대표팀 소집 (A매치 주간)
    if (INTL_WINDOWS.includes(G.week) && SIM.isPro(G)) {
      const was = S.called;
      S.called = aCallScore(G) >= 70 || p.flags.surpriseCall;
      if (S.called && p.flags.surpriseCall) p.flags.surpriseCall = false;
      if (S.called && !was && p.injury === 0) await io.show('callup', { kind: 'A', first: p.intl.caps === 0 });
      if (p.injury > 0) S.called = false;
    }

    const fixtures = buildFixtures(G);
    const results = [];
    let mins = 0, possible = 0;
    for (const fx of fixtures) {
      let role = fx.intl ? SIM.selectRole(G, KOREA.A + 1, 55) : SIM.selectRole(G, S.spot, p.trust);
      const on = role === 'start' || role === 'sub';
      if (on && !fx.intl && SIM.isPro(G) && !p.debut) { fx.important = true; fx.tag = '데뷔전'; }
      if (on && S.firstMatch && !fx.intl) { fx.important = true; fx.tag = fx.tag || '이적 후 첫 경기'; S.firstMatch = false; }
      if (fx.intl) fx.myStr = KOREA.A;
      const res = await SIM.playMatch(G, fx, role, io);
      record(G, res);
      results.push(res);
      if (!fx.intl) { mins += res.mins; possible += 90; }
    }
    const gains = grow(G, action, focusKey, possible ? mins / possible : 0);

    await SIM.maybeEvent(G, io);
    await io.show('week', { week: G.week, results, action, gains });

    p.fatigue = clamp(p.fatigue - 12, 0, 100);
    p.trust += (50 - p.trust) * 0.03;
    if (p.injury > 0) p.injury = Math.max(0, p.injury - (action === 'rest' ? 2 : 1));
    p.pop = clamp(p.pop * 0.985, 0, 100);

    if (p.military) {
      p.military.weeksLeft--;
      if (p.military.weeksLeft <= 0) {
        const from = p.military.from;
        p.military = null; p.militaryDone = true;
        await io.show('message', { title: '전역', text: `복무를 마쳤다. ${SIM.club(from).name}(으)로 돌아간다.` });
        changeClubMidSeason(G, from);
      }
    }
    if (G.week === 6 && !p.military) await transferWindow(G, io, 'winter');

    G.week++;
    if (G.week > WEEKS) G.phase = 'seasonEnd';
  };

  function aCallScore(G) {
    const p = G.p;
    const avg = SIM.avg(G.season.ratings) || 6.6;
    return SIM.ovr(p) + (avg - 6.8) * 4 + p.pop * 0.03 + (p.intl.caps > 5 ? 1.5 : 0) - Math.max(0, p.age - 31) * 1.5;
  }

  function seasonRecord(G, partial) {
    const p = G.p, S = G.season, club = SIM.club(S.club);
    return {
      year: S.year, age: p.age, club: club.id, clubName: club.name, league: SIM.league(club.id).name, partial: !!partial,
      apps: S.apps, starts: S.starts, goals: S.goals, assists: S.assists, cs: S.cs,
      avg: Math.round(SIM.avg(S.ratings) * 100) / 100, rank: S.rank || null,
      trophies: S.trophies.slice(), awards: S.awards.slice(), squadNo: p.squadNo, ovr: SIM.ovr(p),
      caps: S.intl.caps, intlGoals: S.intl.goals, loan: !!p.loan, military: club.id === D.MILITARY_CLUB,
    };
  }

  function changeClubMidSeason(G, clubId) {
    const p = G.p;
    p.career.push(seasonRecord(G, true));
    const week = G.week;
    p.club = clubId;
    p.flags.newClub = true;
    SIM.startSeason(G);
    G.week = week;
    G.season.cup.alive = false; // 시즌 중 이적하면 컵은 이미 다른 팀으로 뛰었다고 친다
    if (G.season.cont) G.season.cont.alive = week < 8 && G.season.cont.alive;
    G.season.midJoin = true;
  }

  // ── 이적
  function playerValue(G) {
    const p = G.p;
    const avg = SIM.avg(G.season.ratings) || 6.6;
    return SIM.ovr(p) + (avg - 6.7) * 6 + p.pop * 0.04 - Math.max(0, p.age - 28) * 1.5 + (p.age <= 21 ? 2 : 0);
  }

  function roleFor(ovr, club) {
    const d = ovr - club.str;
    return d >= 3 ? '핵심' : d >= -2 ? '주전 경쟁' : '로테이션';
  }

  function makeOffer(G, c, kind) {
    const p = G.p, ovr = SIM.ovr(p);
    const role = roleFor(ovr, c);
    const iconic = SIM.ICONIC[p.pos];
    const number = role === '핵심' && chance(G, 0.8) ? iconic[0] : role === '주전 경쟁' && chance(G, 0.4) ? pick(G, iconic) : ri(G, 13, 39);
    const years = kind === 'loan' ? 1 : p.age >= 31 ? ri(G, 1, 2) : ri(G, 2, 5);
    return { kind, club: c.id, role, number, years };
  }

  SIM.makeOffers = function (G, when) {
    const p = G.p, cur = SIM.club(p.club);
    const value = playerValue(G) + (p.flags.agent ? 1.5 : 0);
    const avg = SIM.avg(G.season.ratings) || 0;
    const minsRatio = G.season.mins / Math.max(1, G.week * 90 * SIM.league(p.club).perWeek);
    if (when === 'winter' && (G.season.firstMatch !== false && p.flags.joinedYear === G.year)) return [];
    if (when === 'winter' && !(avg >= 7.6 || (minsRatio < 0.15 && SIM.ovr(p) >= cur.str - 3) || p.flags.wantLoan)) return [];
    const pool = Object.values(D.CLUBS).filter((c) => !c.fake && c.id !== cur.id && c.id !== D.MILITARY_CLUB && c.id !== (p.loan && p.loan.from)
      && value >= c.str - 4 && value <= c.str + 14);
    const scored = pool.map((c) => ({ c, s: c.rep + gauss(G) * 10 + (value - c.str) * 1.5 })).sort((a, b) => b.s - a.s);
    const hot = avg >= 7.1 || value >= cur.str + 3;
    const n = when === 'winter' ? ri(G, 1, 2) : hot ? ri(G, 2, 4) : ri(G, 0, 2);
    const out = [], leagues = {};
    for (const { c } of scored) {
      if (out.length >= n) break;
      if (leagues[c.league] >= 2) continue;
      if (c.league === 'sa' && !(p.flags.saudi || p.age >= 29)) continue;
      leagues[c.league] = (leagues[c.league] || 0) + 1;
      out.push(makeOffer(G, c, 'transfer'));
    }
    if (p.flags.saudi && !out.some((o) => SIM.club(o.club).league === 'sa')) {
      const sa = D.clubsIn('sa');
      out.push(makeOffer(G, pick(G, sa), 'transfer'));
      p.flags.saudi = false;
    }
    // 임대: 21세 이하가 큰 팀에서 못 뛸 때
    if (p.age <= 21 && !p.loan && (minsRatio < 0.35 || p.flags.wantLoan) && cur.str >= 72) {
      const lp = Object.values(D.CLUBS).filter((c) => !c.fake && c.str <= cur.str - 3 && c.str >= SIM.ovr(p) - 3 && c.str <= SIM.ovr(p) + 4 && c.id !== D.MILITARY_CLUB);
      if (lp.length) out.push(makeOffer(G, pick(G, lp), 'loan'));
    }
    p.flags.wantLoan = false;
    return out;
  };

  async function transferWindow(G, io, when) {
    const p = G.p;
    if (p.military) return;
    if (when === 'winter' && p.loan) return;
    const offers = SIM.makeOffers(G, when);
    const cur = SIM.club(p.club);
    let canStay = true;
    if (when === 'summer') {
      if (p.contract > 0) p.contract--;
      if (p.contract <= 0) {
        const wants = playerValue(G) >= cur.str - 6 && p.age < 37;
        if (wants) offers.unshift(Object.assign(makeOffer(G, cur, 'renew'), { years: p.age >= 31 ? 1 : ri(G, 2, 4) }));
        canStay = false;
      }
    }
    if (when === 'winter' && !offers.length) return;
    const choices = offers.slice();
    if (canStay) choices.unshift({ kind: 'stay', club: cur.id });
    if (when === 'summer' && p.age >= 33) choices.push({ kind: 'retire' });
    if (!choices.length || (choices.length === 1 && choices[0].kind === 'retire' && false)) choices.push({ kind: 'retire' });
    if (when === 'summer' && !choices.some((c) => c.kind !== 'retire')) {
      if (p.age >= 30) { await retire(G, io, '찾아온 팀이 없었다.'); return; }
      const k3 = pick(G, ['k3_harbor', 'k3_valley']);
      choices.push(makeOffer(G, SIM.club(k3), 'transfer'));
    }
    const idx = await io.ask('offers', { when, offers: choices, current: cur.id, contract: p.contract });
    await applyOffer(G, io, choices[idx], when);
  }

  async function applyOffer(G, io, o, when) {
    const p = G.p;
    if (!o || o.kind === 'stay') return;
    if (o.kind === 'retire') { await retire(G, io, '스스로 내린 결정이었다.'); return; }
    if (o.kind === 'renew') { p.contract = o.years; return; }
    if (o.kind === 'loan') p.loan = { from: p.club, contract: p.contract };
    else { p.contract = o.years; if (p.loan) p.loan = null; }
    p.squadNo = o.number;
    p.flags.joinedYear = when === 'winter' ? G.year : G.year + 1;
    if (when === 'winter') changeClubMidSeason(G, o.club);
    else { p.club = o.club; p.flags.newClub = true; }
  }

  // ── 고교 졸업·대학
  async function schoolExit(G, io, from) {
    const p = G.p;
    const S = G.season;
    const value = SIM.ovr(p) + ((SIM.avg(S.ratings) || 6.5) - 6.7) * 5 + (S.cup.won ? 3 : 0) + p.pop * 0.05 + (from === 'univ' ? 2 : 0);
    const offers = [];
    const kclubs = Object.values(D.CLUBS).filter((c) => (c.league === 'k1' || c.league === 'k2') && c.id !== D.MILITARY_CLUB && value >= c.str - 9);
    kclubs.sort((a, b) => b.rep + gauss(G) * 8 - a.rep).slice(0, 3).forEach((c) => offers.push(makeOffer(G, c, 'transfer')));
    if (value >= 66) {
      const eu = Object.values(D.CLUBS).filter((c) => ['be', 'nl', 'pt'].includes(c.league) && c.str <= 76);
      offers.push(makeOffer(G, pick(G, eu), 'transfer'));
    }
    if (value >= 64) offers.push(makeOffer(G, pick(G, D.clubsIn('j1')), 'transfer'));
    offers.forEach((o) => { o.years = ri(G, 3, 5); o.role = '로테이션'; o.number = ri(G, 25, 39); });
    if (from === 'school') offers.push({ kind: 'univ', club: pick(G, ['u_hanguk', 'u_seonghwa']), role: '주전 경쟁', number: ri(G, 7, 20), years: 2 });
    else if (p.univYears < 2) offers.push({ kind: 'stay', club: p.club });
    if (!offers.some((o) => o.kind === 'transfer')) offers.push({ kind: 'transfer', club: pick(G, ['k3_harbor', 'k3_valley']), role: '주전 경쟁', number: ri(G, 7, 30), years: 2 });
    const idx = await io.ask('offers', { when: from === 'school' ? 'graduate' : 'univ', offers, current: p.club });
    const o = offers[idx];
    if (o.kind === 'stay') return;
    if (o.kind === 'univ') { p.univYears = 0; }
    p.club = o.club; p.contract = o.years; p.squadNo = o.number; p.flags.newClub = true;
  }

  // ── 시상
  function leagueRank(G) {
    const S = G.season, club = SIM.club(S.club);
    const pool = leaguePool(club);
    const avgStr = SIM.avg(pool.map((c) => c.str).concat(club.str));
    let ahead = 0;
    pool.forEach((c) => {
      const pts = clamp(1.37 + (c.str - avgStr) * 0.09, 0.5, 2.4) * S.lg.gp + gauss(G) * 4;
      if (pts > S.lg.pts) ahead++;
    });
    return 1 + ahead;
  }

  function trophy(G, name) {
    G.season.trophies.push(name);
    G.p.trophies.push({ year: G.year, name });
    G.p.pop = clamp(G.p.pop + 6, 0, 100);
  }
  function award(G, name) {
    G.season.awards.push(name);
    G.p.awards.push({ year: G.year, name });
    G.p.pop = clamp(G.p.pop + 4, 0, 100);
  }

  function leagueAwards(G) {
    const p = G.p, S = G.season, club = SIM.club(S.club), lg = SIM.league(club.id);
    if (S.midJoin) return;
    const top = lg.topGoals || 10;
    const avg = SIM.avg(S.ratings);
    if (S.goals >= Math.round(top + gauss(G) * 2.5)) award(G, `${lg.name} 득점왕`);
    if (S.assists >= Math.round(top * 0.6 + gauss(G) * 2)) award(G, `${lg.name} 도움왕`);
    if (SIM.isPro(G) && avg >= 7.35 && S.rank <= 3 && S.apps >= S.lg.gp * 0.6) award(G, `${lg.name} MVP`);
    if (lg.country === 'KR' && SIM.isPro(G) && p.age <= 23 && avg >= 7.0 && S.apps >= 15) award(G, '영플레이어상');
    if (!SIM.isPro(G) && avg >= 7.2 && S.apps >= 8) award(G, `${lg.name} 베스트 11`);
  }

  // ── 대표팀 대회 (시즌이 끝난 뒤)
  function tournamentsFor(G) {
    const y = G.year, p = G.p, T = [];
    const age = p.age;
    if (y % 2 === 1 && age >= 18 && age <= 20) T.push({ id: 'u20', name: 'U-20 월드컵', team: 'U20', youth: true, pool: NATIONS_U23, groupNeed: 4, ko: ['16강', '8강', '4강', '결승'], scale: -4 });
    if (y % 4 === 2) T.push({ id: 'wc', name: '월드컵', team: 'A', pool: NATIONS_A, groupNeed: 4, ko: ['32강', '16강', '8강', '4강', '결승'] });
    if (y % 4 === 2) T.push({ id: 'ag', name: '아시안게임', team: 'U23', youth: true, pool: NATIONS_U23, asia: true, groupNeed: 4, ko: ['16강', '8강', '4강', '결승'], bronze: true });
    if (y % 4 === 3) T.push({ id: 'ac', name: '아시안컵', team: 'A', pool: NATIONS_A, asia: true, groupNeed: 4, ko: ['16강', '8강', '4강', '결승'] });
    if (y % 4 === 0) T.push({ id: 'oly', name: '올림픽', team: 'U23', youth: true, pool: NATIONS_U23, groupNeed: 4, ko: ['8강', '4강', '결승'], bronze: true });
    return T;
  }

  function selected(G, t) {
    const p = G.p, ovr = SIM.ovr(p);
    if (p.injury > 2) return false;
    if (t.team === 'A') return aCallScore(G) >= (t.id === 'wc' ? 72 : 70);
    if (t.team === 'U20') return ovr >= 60 + (SIM.isPro(G) ? -2 : 0);
    if (t.team === 'U23') {
      if (p.age < 19) return false;
      if (p.age <= 23) return ovr >= 64 + (SIM.isPro(G) ? -1 : 0);
      return !p.exempt && !p.militaryDone && ovr >= 73 && chance(G, 0.6); // 와일드카드
    }
    return false;
  }

  async function playTournament(G, io, t) {
    const p = G.p;
    const kStr = KOREA[t.team === 'A' ? 'A' : t.team];
    const names = Object.keys(t.pool).filter((n) => !t.asia || ASIA.includes(n) || ['태국', '베트남'].includes(n));
    const S = G.season;
    const log = [];
    const used = new Set();
    let goals = 0, apps = 0, medal = null, finish = '조별리그 탈락';
    const playOne = async (round, important, lift) => {
      const pool = {};
      names.forEach((n) => (pool[n] = t.pool[n] + (t.scale || 0)));
      const sorted = names.slice().sort((a, b) => pool[a] - pool[b]);
      const cut = Math.floor(sorted.length * clamp(0.2 + lift * 0.15, 0, 0.7));
      let cand = sorted.slice(cut).filter((n) => !used.has(n));
      if (!cand.length) cand = sorted.filter((n) => !used.has(n));
      if (!cand.length) cand = sorted;
      const fx = nationFx(G, pool, cand, `${t.name} ${round}`, 'tour', important);
      used.add(fx.opp);
      fx.myStr = kStr; fx.youth = !!t.youth; fx.tag = important ? `${t.name} ${round}` : undefined; fx.ko = round !== '조별리그';
      fx.final = round === '결승';
      const role = SIM.selectRole(G, kStr + (t.team === 'A' ? 1 : -1), 55);
      const res = await SIM.playMatch(G, fx, role, io);
      record(G, res);
      if (res.mins) { apps++; goals += res.goals; }
      log.push({ round, opp: fx.opp, gm: res.gm, go: res.go, pens: res.pens, g: res.goals, a: res.assists, r: res.rating, role });
      return res;
    };
    let pts = 0;
    for (let i = 0; i < 3; i++) {
      const r = await playOne('조별리그', i === 0, 0);
      pts += r.gm > r.go ? 3 : r.gm === r.go ? 1 : 0;
    }
    if (pts >= t.groupNeed || (pts === 3 && chance(G, 0.35))) {
      for (let i = 0; i < t.ko.length; i++) {
        const round = t.ko[i];
        const r = await playOne(round, true, i + 1);
        const won = r.gm > r.go || r.pens === 'W';
        if (round === '결승') { medal = won ? '금' : '은'; finish = won ? '우승' : '준우승'; break; }
        if (!won) {
          finish = `${round} 탈락`;
          if (round === '4강' && t.bronze) {
            const b = await playOne('동메달 결정전', true, i + 1);
            const bw = b.gm > b.go || b.pens === 'W';
            if (bw) { medal = '동'; finish = '동메달'; } else finish = '4위';
          }
          break;
        }
      }
    }
    const summary = { t, log, goals, apps, medal, finish };
    if (medal === '금') trophy(G, t.name + ' 우승');
    if (medal && t.id !== 'wc' && t.id !== 'ac') S.awards.push(`${t.name} ${medal}메달`), G.p.awards.push({ year: G.year, name: `${t.name} ${medal}메달` });
    if ((t.id === 'ag' && medal === '금') || (t.id === 'oly' && medal)) {
      if (!p.exempt && !p.militaryDone) { p.exempt = true; summary.exempt = true; }
    }
    p.pop = clamp(p.pop + apps + goals * 2 + (medal ? 8 : 0), 0, 100);
    S.tour = S.tour || [];
    S.tour.push({ id: t.id, finish, goals });
    await io.show('tournament', summary);
  }

  // ── 발롱도르
  const NATS = ['ES', 'EN', 'FR', 'BR', 'AR', 'DE', 'PT', 'IT', 'NL', 'NO', 'NG', 'JP'];
  const BIG = ['realmadrid', 'barcelona', 'mancity', 'arsenal', 'liverpool', 'bayern', 'psg', 'inter', 'chelsea', 'atletico', 'dortmund', 'napoli', 'milan', 'juventus', 'leverkusen', 'manutd'];
  function ballonScore(G) {
    const p = G.p, S = G.season;
    const lg = SIM.league(S.club);
    const avg = SIM.avg(S.ratings) || 6;
    const appsRatio = clamp(S.apps / Math.max(1, S.lg.gp), 0, 1);
    const posW = { FW: 1, MF: 1.3, DF: 2, GK: 0 }[p.pos];
    let s = (avg - 6.6) * 40 * appsRatio + (S.goals + S.assists) * posW * lg.level * 0.9;
    if (p.pos === 'GK') s += S.cs * 2.2 * lg.level;
    const tw = { league: 15, cont: 25 };
    S.trophies.forEach((t) => {
      if (t.includes('월드컵')) s += 30;
      else if (t.includes('아시안컵')) s += 12;
      else if (t.includes('챔피언스리그')) s += tw.cont * (t.includes('UEFA') ? 1 : 0.5);
      else if (t.includes('우승') && t.includes(lg.name)) s += tw.league * lg.level;
      else s += 4;
    });
    (S.tour || []).forEach((t) => { if (t.id === 'wc') s += t.goals * 3; });
    s += S.sceneOk * 1.0 + p.pop / 20;
    return Math.round(s * 10) / 10;
  }

  async function ballon(G, io) {
    const p = G.p;
    const mine = ballonScore(G);
    const list = [];
    for (let i = 0; i < 30; i++) {
      const nat = pick(G, NATS);
      const c = SIM.club(pick(G, BIG));
      list.push({ name: SIM.worldName(G, nat), club: c.name, score: 126 - i * 2.0 + gauss(G) * 4 });
    }
    list.sort((a, b) => b.score - a.score);
    const rank = 1 + list.filter((x) => x.score > mine).length;
    const S = G.season;
    if (p.pos === 'GK' && mine >= 70) award(G, '올해의 골키퍼');
    if (p.age <= 21 && mine >= 55) award(G, '21세 이하 최고 선수상');
    if (rank <= 30) {
      const me = { name: p.name, club: SIM.club(S.club).name, score: mine, me: true };
      list.splice(rank - 1, 0, me);
      list.length = 30;
      p.ballon.push({ year: G.year, rank });
      if (rank === 1) { trophy(G, '발롱도르'); }
      await io.show('ballon', { list, rank, year: G.year });
    }
  }

  // ── 라이벌
  function rivalProgress(G) {
    const r = G.p.rival;
    if (!r || r.retired) return;
    const age = G.p.age;
    const ageC = age <= 19 ? 1 : age <= 23 ? 0.8 : age <= 27 ? 0.4 : age <= 30 ? 0.1 : -0.5;
    r.ovr = Math.round(clamp(r.ovr + (ageC > 0 ? ageC * clamp((r.pot - r.ovr) / 20, 0.08, 1) * 6 * (0.6 + SIM.rnd(G) * 0.8) : ageC * 3), 40, 95));
    if (age >= 18) {
      const fit = Object.values(D.CLUBS).filter((c) => !c.fake && c.id !== D.MILITARY_CLUB && Math.abs(c.str - (r.ovr - 1)) <= 3);
      if (fit.length && (chance(G, 0.4) || D.CLUBS[r.club].fake)) r.club = pick(G, fit).id;
    }
    if (age >= 35 && chance(G, 0.4)) r.retired = true;
  }

  // ── 은퇴
  async function retire(G, io, why) {
    const p = G.p;
    G.phase = 'retired';
    const sum = (k) => p.career.reduce((a, c) => a + (c[k] || 0), 0);
    const clubs = [];
    p.career.forEach((c) => { if (!SIM.club(c.club).fake && !clubs.includes(c.clubName)) clubs.push(c.clubName); });
    const best = p.ballon.length ? Math.min(...p.ballon.map((b) => b.rank)) : null;
    G.hall = {
      name: p.name, pos: p.pos, look: p.look, from: 2027, to: G.year, age: p.age, why,
      apps: sum('apps'), goals: sum('goals'), assists: sum('assists'), caps: p.intl.caps, intlGoals: p.intl.goals,
      clubs, trophies: p.trophies.length, trophyList: p.trophies.slice(-12), awards: p.awards.length, ballonBest: best,
      ballonWins: p.ballon.filter((b) => b.rank === 1).length, exempt: p.exempt, peak: Math.max(...p.career.map((c) => c.ovr)),
    };
    await io.show('retire', G.hall);
  }

  // ── 시즌 끝
  SIM.endSeason = async function (G, io) {
    const p = G.p, S = G.season;
    const club = SIM.club(S.club), lg = SIM.league(club.id);
    if (!S.midJoin || S.lg.gp >= 10) S.rank = leagueRank(G);
    if (S.rank === 1) trophy(G, `${lg.name} 우승`);
    if (S.cup.won) trophy(G, `${lg.cup} 우승`);
    if (S.cont && S.cont.won) trophy(G, `${D.CONTINENTAL[lg.cont].name} 우승`);
    leagueAwards(G);

    await io.show('seasonEnd', { rec: seasonRecord(G), S, rival: p.rival });

    for (const t of tournamentsFor(G)) {
      if (selected(G, t)) {
        await io.show('callup', { kind: t.team, tour: t.name, first: t.team === 'A' && p.intl.caps === 0 });
        await playTournament(G, io, t);
      }
    }
    if (SIM.isPro(G) && p.age >= 18) await ballon(G, io);
    p.career.push(seasonRecord(G));
    rivalProgress(G);

    // 병역
    const enlist = !p.exempt && !p.militaryDone && !p.military && (p.age >= 27 || p.flags.enlistNow);
    p.age++;
    decline(G);
    p.mental = clamp(p.mental, 0, 99);

    if (p.age >= 39) { await retire(G, io, '서른아홉. 몸이 먼저 말했다.'); return; }

    if (enlist) {
      p.flags.enlistNow = false;
      p.military = { from: p.loan ? p.loan.from : p.club, weeksLeft: MIL_WEEKS };
      p.loan = null;
      await io.show('message', { title: '입대', text: `병역 면제를 받지 못했다. 다음 시즌부터 1년 반 동안 ${SIM.club(D.MILITARY_CLUB).name}에서 뛴다. 그동안 이적 제의는 받을 수 없다.` });
      p.club = D.MILITARY_CLUB; p.squadNo = ri(G, 13, 33); p.flags.newClub = true;
    } else if (club.league === 'school') {
      if (p.grade < 3) { p.grade++; }
      else await schoolExit(G, io, 'school');
    } else if (club.league === 'univ') {
      p.univYears = (p.univYears || 0) + 1;
      await schoolExit(G, io, 'univ');
    } else if (!p.military) {
      if (p.loan) {
        const back = p.loan.from;
        p.contract = p.loan.contract;
        p.loan = null;
        await io.show('message', { title: '임대 복귀', text: `임대가 끝났다. ${SIM.club(back).name}(으)로 돌아간다.` });
        p.club = back;
      }
      await transferWindow(G, io, 'summer');
    }
    if (G.phase === 'retired') return;
    G.year++;
    SIM.startSeason(G);
  };

  SIM._internal = { leaguePool, playerValue, ballonScore, aCallScore };
})(typeof window !== 'undefined' ? window : globalThis);
