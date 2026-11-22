// 커리어 후반에도 얻을 게 남도록: 특성(해금형 능력), 통산 이정표, 각성.
(function (root) {
  const SIM = root.SIM;
  const D = root.DATA;
  const { chance, clamp } = SIM;

  SIM.stat = (G, k, n = 1) => { const s = (G.p.stats = G.p.stats || {}); s[k] = (s[k] || 0) + n; };
  SIM.has = (G, id) => !!(G.p.traits && G.p.traits[id]);

  const total = (G, k) => G.p.career.reduce((a, c) => a + (c[k] || 0), 0) + (G.season ? G.season[k] || 0 : 0);
  const st = (G, k) => (G.p.stats && G.p.stats[k]) || 0;

  // 특성: 조건을 채우면 한 번 열리고, 게임 안에서 계속 효과가 있다
  SIM.TRAITS = [
    { id: 'clutch', name: '큰 경기의 사나이', desc: '토너먼트·결승에서 게이지가 넓어진다', when: (G) => st(G, 'koGoals') >= 3 },
    { id: 'goal_machine', name: '득점 기계', desc: '모든 슛 게이지가 조금 넓어진다', when: (G) => total(G, 'goals') >= 80 },
    { id: 'sniper', name: '저격수', desc: '먼 거리 슛이 덜 빗나간다', when: (G) => st(G, 'longGoals') >= 4 },
    { id: 'aerial', name: '공중 장악', desc: '헤더 게이지가 넓어진다', when: (G) => st(G, 'headGoals') >= 4 },
    { id: 'fk_master', name: '프리킥 장인', desc: '세트피스 +5, 프리킥 장면이 자주 나온다', when: (G) => st(G, 'fkGoals') >= 2, on: (G) => { G.p.sp = Math.min(99, (G.p.sp || 45) + 5); G.p.flags.taker = true; } },
    { id: 'pk_ice', name: '강심장', desc: '페널티킥 게이지가 넓어진다', when: (G) => st(G, 'pkGoals') >= 3 || st(G, 'pkSaves') >= 2 },
    { id: 'speedster', name: '폭주기관차', desc: '드리블 돌파가 더 잘 된다', when: (G) => G.p.pos !== 'GK' && G.p.attrs.spd >= 84 },
    { id: 'maestro', name: '지휘자', desc: '패스가 더 잘 통한다', when: (G) => (G.season && G.season.assists >= 12) || total(G, 'assists') >= 60 },
    { id: 'wall', name: '통곡의 벽', desc: '태클 게이지가 넓어진다', when: (G) => G.p.pos === 'DF' && (st(G, 'tackles') >= 8 || (G.season && G.season.cs >= 14)) },
    { id: 'cat', name: '고양이', desc: '다이빙 게이지가 넓어진다', when: (G) => G.p.pos === 'GK' && st(G, 'sceneSaves') >= 8 },
    { id: 'leader', name: '리더', desc: '선발로 뛰면 팀 전력이 오르고 감독 신뢰가 잘 안 떨어진다', when: (G) => st(G, 'captainSeasons') >= 2 },
    { id: 'iron', name: '강철 몸', desc: '부상 확률이 크게 줄어든다', when: (G) => st(G, 'cleanSeasons') >= 3 },
    { id: 'wonderkid', name: '원더키드', desc: '인기와 이적 시장 가치가 오른다', when: (G) => G.p.age <= 20 && SIM.ovr(G.p) >= 72, on: (G) => { G.p.pop = clamp(G.p.pop + 10, 0, 100); } },
    { id: 'late_bloomer', name: '대기만성', desc: '나이가 들어도 덜 떨어진다', when: (G) => G.p.age >= 25 && SIM.ovr(G.p) - (G.p.flags.ovrAt22 || 99) >= 8 },
    { id: 'journeyman', name: '저니맨', desc: '이적 제안이 더 많이 온다', when: (G) => new Set(G.p.career.map((c) => D.LEAGUES[SIM.club(c.club).league].country)).size >= 4 },
    { id: 'one_club', name: '원클럽맨', desc: '감독 신뢰가 높게 유지되고 은퇴하면 등번호가 영구결번된다', when: (G) => G.p.career.filter((c) => c.club === G.p.club && !c.partial).length >= 7 },
    { id: 'hero', name: '국민 영웅', desc: '인기가 40 밑으로 떨어지지 않는다', when: (G) => G.p.exempt || st(G, 'intlKoGoals') >= 2 },
    { id: 'phoenix', name: '불사조', desc: '멘탈 +5. 큰 부상을 이겨 냈다', when: (G) => st(G, 'bigInjuryComeback') >= 1, on: (G) => { G.p.mental = clamp(G.p.mental + 5, 0, 99); } },
  ];

  // 이정표
  const MS = [
    ['goals', [1, 50, 100, 150, 200, 300], (n) => (n === 1 ? '프로 첫 골' : `통산 ${n}골`)],
    ['assists', [50, 100, 150], (n) => `통산 ${n}도움`],
    ['apps', [100, 200, 300, 400, 500], (n) => `통산 ${n}경기`],
    ['caps', [1, 10, 50, 100], (n) => (n === 1 ? 'A매치 데뷔' : `A매치 ${n}경기`)],
    ['trophies', [1, 5, 10, 20], (n) => (n === 1 ? '첫 트로피' : `트로피 ${n}개`)],
  ];
  function msValue(G, k) {
    const p = G.p;
    if (k === 'caps') return p.intl.caps;
    if (k === 'trophies') return p.trophies.length;
    // 고교·대학 기록은 빼고 센다
    const pro = (c) => !SIM.club(c.club).fake;
    const past = p.career.filter(pro).reduce((a, c) => a + (c[k] || 0), 0);
    return past + (G.season && SIM.isPro(G) ? G.season[k] || 0 : 0);
  }

  SIM.checkLegacy = async function (G, io) {
    const p = G.p;
    p.traits = p.traits || {};
    p.ms = p.ms || {};
    if (p.age === 22 && !p.flags.ovrAt22) p.flags.ovrAt22 = SIM.ovr(p);
    for (const t of SIM.TRAITS) {
      if (p.traits[t.id] || !t.when(G)) continue;
      p.traits[t.id] = G.year;
      if (t.on) t.on(G);
      await io.show('unlock', { kind: 'trait', id: t.id, title: t.name, desc: t.desc });
    }
    for (const [k, steps, label] of MS) {
      const v = msValue(G, k);
      for (const n of steps) {
        const key = k + n;
        if (v >= n && !p.ms[key]) {
          p.ms[key] = G.year;
          p.pop = clamp(p.pop + (n >= 100 ? 4 : 2), 0, 100);
          await io.show('unlock', { kind: 'milestone', key, title: label(n), desc: `${G.year}년, ${SIM.club(p.club).name}` });
        }
      }
    }
  };

  // 다음 목표 이정표 (화면 진행 막대용)
  SIM.nextMilestones = function (G) {
    return MS.map(([k, steps, label]) => {
      const v = msValue(G, k);
      const n = steps.find((x) => x > v);
      if (!n) return null;
      const prev = steps.filter((x) => x <= v).pop() || 0;
      return { k, label: label(n), v, n, ratio: (v - prev) / (n - prev) };
    }).filter(Boolean);
  };

  // 각성: 아주 잘한 경기 뒤 가끔 능력치가 확 오른다
  SIM.maybeAwaken = async function (G, res, io) {
    const p = G.p;
    if (!res.rating || res.rating < 8.3 || p.age > 29 || G.season.awoke || !chance(G, 0.12)) return;
    G.season.awoke = true;
    const [a, b] = SIM.mainAttrs(p.pos);
    const before = SIM.ovr(p);
    const ga = 2 + SIM.rnd(G) * 1.5, gb = 1 + SIM.rnd(G);
    SIM.addAttr(p, a, ga); SIM.addAttr(p, b, gb);
    p.pot += 0.5;
    await io.show('awaken', { a, b, ga, gb, before, after: SIM.ovr(p), vs: res.fx.opp, rating: res.rating });
  };

  // 장면 미니게임에서 쓰는 특성 보너스
  SIM.traitWidth = function (G, kind, spec, fx) {
    let w = 0;
    if (SIM.has(G, 'clutch') && fx && (fx.ko || fx.final || fx.comp === 'tour')) w += 0.03;
    if (kind === 'shot') {
      if (SIM.has(G, 'goal_machine')) w += 0.02;
      if (spec.type === 'header' && SIM.has(G, 'aerial')) w += 0.04;
      if (spec.type === 'pk' && SIM.has(G, 'pk_ice')) w += 0.04;
    }
    if (kind === 'dive') { if (SIM.has(G, 'cat')) w += 0.03; if (spec.dist === 'pk' && SIM.has(G, 'pk_ice')) w += 0.04; }
    if (kind === 'tackle' && SIM.has(G, 'wall')) w += 0.03;
    return w;
  };
})(typeof window !== 'undefined' ? window : globalThis);
