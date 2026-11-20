// 경기 시뮬레이션과 장면 선택.
(function (root) {
  const SIM = root.SIM;
  const { rnd, ri, pick, chance, gauss, poisson, clamp, sig } = SIM;

  const SIDE_X = { left: 28, center: 48, right: 68 };
  const SIDE_KO = { left: '왼쪽', center: '가운데', right: '오른쪽' };

  // ── 장면 만들기
  function sceneKind(G) {
    const pos = G.p.pos;
    if (pos === 'GK') return 'gk';
    if (pos === 'FW') return 'attack';
    if (pos === 'MF') return chance(G, 0.7) ? 'attack' : 'defend';
    return chance(G, 0.15) ? 'attack' : 'defend';
  }

  SIM.makeScene = function (G, fx, res, minute) {
    const kind = sceneKind(G);
    const video = G.p.flags.videoBonus > 0;
    const sc = { kind, minute, score: [res.gm, res.go], opp: fx.opp, hints: [] };

    if (kind === 'attack') {
      const dist = SIM.weighted(G, ['near', 'edge', 'far'], (d) => ({ near: 4, edge: 4, far: 2 }[d]));
      const side = pick(G, ['left', 'center', 'right']);
      const press = SIM.weighted(G, [0, 1, 2], (n) => [3, 4, 3][n]);
      const freeMate = chance(G, 0.55);
      const gkOut = dist !== 'near' && chance(G, 0.25);
      const tip = chance(G, 0.55) ? pick(G, ['slowDef', 'gkLow', 'highLine']) : null;
      Object.assign(sc, { dist, side, press, freeMate, gkOut, tip });
      const where = {
        near: side === 'center' ? '페널티 박스 안 정면.' : `페널티 박스 안 ${SIDE_KO[side]} 깊숙한 곳.`,
        edge: `박스 바로 앞 ${SIDE_KO[side]}.`,
        far: '골대까지 25m 넘게 남았다.',
      }[dist];
      const lead = pick(G, ['공이 발밑에 떨어졌다.', '동료의 패스가 정확히 들어왔다.', '세컨드 볼이 내 앞으로 흘렀다.', '역습 상황. 공을 몰고 올라왔다.']);
      sc.text = `${lead} ${where}`;
      if (dist === 'near' && side !== 'center') sc.hints.push('각도가 좁다');
      if (dist === 'far') sc.hints.push('골대까지 멀다');
      if (press === 2) sc.hints.push('수비 둘이 바로 붙었다');
      if (press === 0) sc.hints.push('앞에 공간이 열려 있다');
      const mateSide = side === 'left' ? '오른쪽' : side === 'right' ? '왼쪽' : pick(G, ['왼쪽', '오른쪽']);
      sc.mateSide = mateSide;
      sc.hints.push(freeMate ? `${mateSide} 동료가 완전히 비었다` : '동료들이 모두 막혀 있다');
      if (gkOut) sc.hints.push('골키퍼가 앞으로 나와 있다');
      if (video && tip) sc.hints.push({ slowDef: '분석: 상대 센터백은 돌아서는 게 느리다', gkLow: '분석: 상대 골키퍼는 낮은 슛에 약하다', highLine: '분석: 상대 수비 라인이 높다' }[tip]);
      sc.options = ['패스', '드리블', '슛'];
      const mx = SIDE_X[side], my = { near: 22, edge: 35, far: 47 }[dist];
      const opps = [];
      for (let i = 0; i < press; i++) opps.push([mx + (i ? 7 : -7), my - 4]);
      opps.push([mx + (side === 'left' ? 22 : -22), my - 8], [48 + ri(G, -10, 10), 18]);
      const mates = [[mateSide === '오른쪽' ? Math.min(84, mx + 26) : Math.max(12, mx - 26), my - 7], [mx + ri(G, -16, 16), my + 15]];
      if (!freeMate) opps.push([mates[0][0] + 4, mates[0][1] - 3]);
      sc.pitch = { me: [mx, my], ball: [mx + 1, my - 4], mates, opps, gk: [48, gkOut ? 18 : 12],
        trail: null };
    } else if (kind === 'defend') {
      const type = pick(G, ['1v1', 'cross', 'through']);
      const inBox = chance(G, type === 'cross' ? 0.9 : 0.45);
      const tip = chance(G, 0.5) ? pick(G, ['oneFoot', 'tall']) : null;
      Object.assign(sc, { type, inBox, tip, atk: fx.oppStr + ri(G, -2, 6) });
      sc.text = {
        '1v1': '상대 윙어가 공을 몰고 1대1로 달려든다.',
        cross: '측면에서 크로스가 올라온다. 상대 공격수가 문전으로 뛰어든다.',
        through: '상대가 수비 뒷공간으로 패스를 찔렀다. 내가 가장 가깝다.',
      }[type];
      if (inBox) sc.hints.push('페널티 박스 안이다. 반칙하면 페널티킥');
      if (type === '1v1') sc.hints.push('상대가 속도를 붙였다');
      if (type === 'through') sc.hints.push('뒤에 받쳐 줄 동료가 없다');
      if (video && tip) sc.hints.push({ oneFoot: '분석: 이 공격수는 오른발만 쓴다', tall: '분석: 상대 공격수가 공중볼에 강하다' }[tip]);
      sc.options = type === 'cross' ? ['몸싸움', '자리 지키기', '헤더로 걷어내기'] : ['태클', '지연 수비', '걷어내기'];
      const ax = pick(G, [30, 48, 64]), ay = inBox ? 24 : 36;
      sc.pitch = { me: [ax + 6, ay - 3], ball: type === 'cross' ? [80, 20] : [ax - 1, ay + 3], opps: [[ax, ay + 4], [ax + 18, ay + 8]],
        mates: [[48, 12], [ax - 18, ay - 2]], gk: null, trail: type === 'cross' ? [[82, 22], [ax + 2, ay]] : null, ourGoal: true };
    } else {
      const type = SIM.weighted(G, ['1v1', 'pk', 'cross'], (t) => ({ '1v1': 5, pk: 2, cross: 3 }[t]));
      Object.assign(sc, { type, atk: fx.oppStr + ri(G, -2, 6) });
      if (type === '1v1') {
        sc.variant = pick(G, ['long', 'calm', 'fast']);
        sc.text = '수비가 뚫렸다. 상대 공격수와 1대1.';
        sc.hints.push({ long: '공격수가 공을 길게 쳤다', calm: '공격수가 고개를 들고 침착하게 다가온다', fast: '공격수가 빠르게 치고 들어온다' }[sc.variant]);
        sc.options = ['전진해서 각 좁히기', '기다리기', '먼저 다이빙'];
      } else if (type === 'pk') {
        sc.foot = chance(G, 0.8) ? 'R' : 'L';
        sc.centerLover = chance(G, 0.3);
        sc.text = '페널티킥. 키커가 공을 내려놓았다.';
        sc.hints.push(sc.foot === 'R' ? '키커는 오른발잡이' : '키커는 왼발잡이');
        if (video && sc.centerLover) sc.hints.push('분석: 이 키커는 큰 경기에서 가운데로 찬 적이 많다');
        sc.options = ['왼쪽으로', '가운데 버티기', '오른쪽으로'];
      } else {
        sc.variant = pick(G, ['crowded', 'floaty']);
        sc.text = '코너킥. 공이 문전으로 날아온다.';
        sc.hints.push(sc.variant === 'crowded' ? '문전이 선수들로 꽉 찼다' : '공이 높게 떴다. 떨어지는 데 시간이 있다');
        sc.options = ['펀칭', '잡기', '라인 지키기'];
      }
      sc.pitch = { me: [48, 11], ball: type === 'pk' ? [48, 24] : type === 'cross' ? [86, 9] : [50, 26],
        opps: type === 'pk' ? [[48, 28]] : [[48 + ri(G, -6, 6), 29], [40, 16], [56, 18]], mates: type === 'pk' ? [] : [[34, 20], [62, 22]],
        gk: null, trail: type === 'cross' ? [[86, 9], [70, 4], [52, 12]] : null, ourGoal: true };
    }
    return sc;
  };

  // ── 장면 결과
  SIM.resolveScene = function (G, fx, sc, choice, res) {
    const p = G.p, a = p.attrs, opp = fx.oppStr;
    const mental = (p.mental - 50) / 40;
    const out = { ok: false, text: '', delta: 0 };
    const goalFor = (t) => { res.gm++; res.goals++; out.goal = true; out.ok = true; out.text = t; out.delta += 0.2; };
    const goalAgainst = (t) => { res.go++; out.conceded = true; out.text = t; out.delta -= 0.3; };

    if (sc.kind === 'attack') {
      const distMod = { near: 0.6, edge: -0.2, far: -1.0 }[sc.dist];
      const angleMod = sc.side === 'center' ? 0.3 : sc.dist === 'near' ? -0.6 : -0.1;
      const shotX = (base) => (a.sho - (opp + 2)) / 8 + base + mental;
      if (choice === 2) {
        const x = shotX(distMod + angleMod - sc.press * 0.35 + (sc.tip === 'gkLow' ? 0.4 : 0) + (sc.gkOut && sc.dist !== 'near' ? 0.5 : 0));
        const prob = sig(x) * 0.62;
        if (chance(G, prob)) {
          goalFor(prob < 0.25 ? pick(G, ['말도 안 되는 각도에서 꽂아 넣었다. 관중석이 뒤집혔다.', '중거리 슛이 골대 구석을 찔렀다. 골키퍼는 손도 못 댔다.']) : pick(G, ['침착하게 밀어 넣었다. 골!', '골키퍼 다리 사이로 빠졌다. 골!', '반대편 구석으로 정확히 찼다. 골!']));
          if (prob < 0.25) { p.pop += 4; out.delta += 0.3; out.wonder = true; }
        } else {
          out.text = pick(G, ['슛이 골대를 살짝 벗어났다.', '골키퍼 정면이었다. 선방에 막혔다.', '수비 발에 맞고 굴절됐다.', '크로스바를 때리고 나왔다.']);
          out.delta -= 0.05;
        }
      } else if (choice === 0) {
        const px = sc.freeMate
          ? sig((a.pas - opp) / 8 + 1.2 - sc.press * 0.2 + (sc.tip === 'highLine' ? 0.5 : 0) + mental)
          : sig((a.pas - opp) / 8 + 0.3 - sc.press * 0.3 + (sc.tip === 'highLine' ? 0.5 : 0));
        if (chance(G, px)) {
          const conv = sc.freeMate ? 0.42 + (sc.dist === 'near' ? 0.12 : 0) : 0.15;
          if (chance(G, conv)) {
            res.gm++; res.assists++; out.assist = true; out.ok = true; out.delta += 0.25;
            out.text = sc.freeMate ? `${sc.mateSide}으로 내준 공을 동료가 그대로 밀어 넣었다. 도움!` : '어렵게 연결한 패스가 골로 이어졌다. 도움!';
          } else {
            out.ok = true; out.delta += 0.1;
            out.text = '패스는 정확했는데 동료의 슛이 막혔다.';
          }
        } else {
          out.text = '패스가 수비 발에 걸렸다.';
          out.delta -= 0.15;
          if (chance(G, 0.1)) goalAgainst('공을 뺏긴 뒤 역습으로 실점했다.');
        }
      } else {
        const px = sig(((a.dri + a.spd) / 2 - opp) / 8 + 0.3 - sc.press * 0.5 + (sc.tip === 'slowDef' ? 0.5 : 0) + mental);
        if (chance(G, px)) {
          if (chance(G, 0.15)) {
            const pk = sig((a.sho - opp) / 10 + 1.2 + mental);
            if (chance(G, pk)) goalFor('수비를 제치다 넘어졌다. 페널티킥을 직접 차서 넣었다!');
            else { out.text = '페널티킥을 얻어 냈지만 직접 찬 공이 막혔다.'; out.delta -= 0.2; }
          } else {
            const prob = sig(shotX(0.6 + 0.3)) * 0.7;
            if (chance(G, prob)) goalFor(pick(G, ['수비 둘을 연달아 제치고 마무리까지. 골!', '한 번 접고 들어가서 감아 찼다. 골!']));
            else { out.ok = true; out.delta += 0.1; out.text = '수비를 제쳤지만 마지막 슛이 골키퍼에게 걸렸다.'; }
          }
        } else {
          out.text = '드리블이 길었다. 수비에게 걸렸다.';
          out.delta -= 0.15;
          if (chance(G, 0.1)) goalAgainst('뺏긴 공이 그대로 역습으로 이어져 실점했다.');
        }
      }
    } else if (sc.kind === 'defend') {
      const atk = sc.atk;
      let px, failGoal;
      if (choice === 0) {
        px = sig((a.def - atk) / 7 + (sc.type === '1v1' ? 0.2 : -0.3) + (sc.tip === 'oneFoot' ? 0.5 : 0) + mental);
        failGoal = sc.inBox ? 0.6 : 0.35;
      } else if (choice === 1) {
        px = sig(((a.def + a.phy) / 2 - atk) / 9 + 0.9 + mental);
        failGoal = 0.22;
      } else {
        px = sig((a.phy - atk) / 8 + (sc.type === 'cross' ? 0.7 : -0.3) - (sc.tip === 'tall' ? 0.4 : 0));
        failGoal = 0.3;
      }
      if (chance(G, px)) {
        out.ok = true; out.delta += choice === 0 ? 0.35 : 0.2;
        out.text = [
          pick(G, ['깔끔한 태클로 공만 빼냈다.', '정확한 타이밍의 태클. 관중이 박수를 쳤다.']),
          pick(G, ['끝까지 붙어서 슛 각도를 지웠다.', '버티고 버텨서 동료가 돌아올 시간을 벌었다.']),
          pick(G, ['머리로 멀리 걷어냈다.', '몸을 던져 공을 밖으로 걷어냈다.']),
        ][choice];
      } else if (choice === 0 && sc.inBox && chance(G, 0.5)) {
        if (chance(G, 0.75)) goalAgainst('태클이 늦었다. 페널티킥을 내줬고 실점했다.');
        else { out.text = '페널티킥을 내줬지만 키커가 실축했다. 살았다.'; out.delta -= 0.3; }
      } else if (chance(G, failGoal)) {
        goalAgainst(pick(G, ['한 발 늦었다. 그대로 실점.', '공격수가 먼저 발을 댔다. 실점.']));
      } else {
        out.text = '막지 못했지만 슛이 골대를 벗어났다.';
        out.delta -= 0.15;
      }
    } else {
      const atk = sc.atk;
      let save;
      if (sc.type === '1v1') {
        const v = sc.variant;
        const x = [
          ((a.one + a.pos) / 2 - atk) / 8 + (v === 'long' ? 0.8 : v === 'calm' ? -0.4 : 0),
          (a.ref - atk) / 8 + (v === 'calm' ? 0.5 : v === 'fast' ? -0.2 : 0),
          ((a.ref + a.one) / 2 - atk) / 8 - 0.2 + (v === 'fast' ? 0.3 : 0),
        ][choice] + mental;
        save = sig(x) * 0.85 + 0.05;
        if (chance(G, save)) { out.ok = true; out.save = true; out.delta += 0.5; res.saves++; out.text = ['먼저 튀어나가 공을 덮쳤다. 선방!', '끝까지 기다렸다가 발끝으로 막아 냈다. 선방!', '몸을 날려 슛을 쳐 냈다. 선방!'][choice]; }
        else goalAgainst(['너무 일찍 나갔다. 공이 머리 위로 넘어갔다.', '공격수가 구석으로 침착하게 찼다. 실점.', '먼저 넘어진 걸 보고 반대쪽으로 찼다. 실점.'][choice]);
      } else if (sc.type === 'pk') {
        const w = sc.centerLover ? [0.25, 0.5, 0.25] : sc.foot === 'R' ? [0.35, 0.2, 0.45] : [0.45, 0.2, 0.35];
        const dir = SIM.weighted(G, [0, 1, 2], (i) => w[i]);
        if (chance(G, 0.07)) { out.ok = true; out.save = true; out.delta += 0.3; out.text = '키커가 골대 밖으로 찼다. 살았다.'; }
        else if (dir === choice) {
          save = choice === 1 ? 0.8 : 0.42 + (a.ref - atk) / 60;
          if (chance(G, save)) { out.ok = true; out.save = true; res.saves++; out.delta += 0.9; out.text = '방향을 읽었다. 페널티킥 선방!'; p.pop += 3; }
          else goalAgainst('방향은 맞혔지만 공이 손끝을 스치고 들어갔다.');
        } else goalAgainst(['반대쪽으로 들어갔다. 실점.', '키커가 가운데로 찼다. 실점.', '반대쪽으로 들어갔다. 실점.'][dir === 1 ? 1 : 0]);
      } else {
        const v = sc.variant;
        const x = [
          (a.air - atk) / 8 + 0.6 + (v === 'crowded' ? 0.4 : 0),
          (a.air - atk) / 8 + 0.1 + (v === 'floaty' ? 0.5 : -0.4 * (v === 'crowded')),
          (a.ref - atk) / 8 - 0.2,
        ][choice] + mental;
        if (chance(G, sig(x))) { out.ok = true; out.delta += choice === 1 ? 0.4 : 0.25; out.text = ['주먹으로 멀리 쳐 냈다.', '높이 뛰어 공을 품에 안았다. 바로 역습 시작.', '헤더가 날아왔지만 반사적으로 막았다.'][choice]; if (choice === 2) res.saves++; }
        else if (chance(G, 0.6)) goalAgainst(['펀칭이 짧았다. 흘러나온 공을 상대가 넣었다.', '공을 놓쳤다. 문전 혼전 끝에 실점.', '헤더가 구석으로 꽂혔다. 실점.'][choice]);
        else { out.text = '공을 처리하지 못했지만 상대 슛이 빗나갔다.'; out.delta -= 0.15; }
      }
    }
    res.ratingAdj += out.delta;
    res.sceneN++;
    if (out.ok) res.sceneOk++;
    return out;
  };

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
    const homeMul = fx.home ? 1.1 : 0.92;
    const scenes = fx.important && onPitch;
    const lm = 1.3 * Math.exp((my - fx.oppStr) / 15) * homeMul * (scenes ? 0.85 : 1);
    const lo = (1.3 * Math.exp((fx.oppStr - my) / 15)) / homeMul * (scenes ? 0.85 : 1);
    const res = { fx, role, mins: 0, gm: poisson(G, lm), go: poisson(G, lo), goals: 0, assists: 0, saves: 0, ratingAdj: 0, sceneN: 0, sceneOk: 0, notes: [] };
    res.mins = role === 'start' ? (chance(G, 0.22) ? ri(G, 62, 85) : 90) : role === 'sub' ? ri(G, 12, 30) : 0;

    if (onPitch) {
      const share = res.mins / 90;
      const rel = (k) => (p.attrs[k] - fx.myStr);
      let gShare = 0, aShare = 0;
      if (p.pos === 'FW') { gShare = clamp(0.22 + rel('sho') / 120, 0.1, 0.4); aShare = clamp(0.12 + rel('pas') / 150, 0.05, 0.22); }
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
      const n = role === 'start' ? 2 + (chance(G, 0.4) ? 1 : 0) : 1;
      const mins = [];
      for (let i = 0; i < n; i++) mins.push(role === 'sub' ? ri(G, 75, 90) : ri(G, 8, 88));
      mins.sort((a, b) => a - b);
      const base = [res.gm, res.go];
      for (const m of mins) {
        // 장면 시점의 점수는 최종 자동 점수를 시간 비율로 나눠 보여 준다.
        const shown = { gm: Math.round(base[0] * m / 90) + (res.gm - base[0]), go: Math.round(base[1] * m / 90) + (res.go - base[1]) };
        const sc = SIM.makeScene(G, fx, shown, m);
        const choice = await io.ask('scene', { scene: sc, fx });
        const out = SIM.resolveScene(G, fx, sc, choice, res);
        await io.show('sceneResult', { scene: sc, out, fx, choice });
      }
      if (p.flags.videoBonus > 0) p.flags.videoBonus--;
    }
    res.rating = SIM.rate(G, res);
    res.result = res.gm > res.go ? 'W' : res.gm < res.go ? 'L' : 'D';
    return res;
  };
})(typeof window !== 'undefined' ? window : globalThis);
