// 경기 장면: 한 번의 기회가 2~3단계로 이어지고, 마지막은 미니게임(슛 조준+타이밍, 다이빙, 태클 타이밍)으로 끝난다.
// 화면과는 io.ask('beat'|'shot'|'dive'|'tackle') / io.show('chanceEnd') 로만 이야기한다.
(function (root) {
  const SIM = root.SIM;
  const { ri, pick, chance, clamp, sig } = SIM;

  // ── 미니게임 공통
  // 게이지: 바늘이 왔다 갔다 하고, 가운데에서 멈출수록 timing이 1에 가깝다. 단짝 구간 너비는 능력치로 정한다.
  SIM.sweetWidth = (attr, mod = 0) => clamp(0.12 + (attr - 50) / 260 + mod, 0.07, 0.34);
  const isGood = (timing, w) => timing >= 1 - w;
  const zoneCol = (z) => z % 3, zoneRow = (z) => Math.floor(z / 3);
  SIM.ZONE_KO = ['왼쪽 위', '가운데 위', '오른쪽 위', '왼쪽', '가운데', '오른쪽', '왼쪽 아래', '가운데 아래', '오른쪽 아래'];

  // 슛 판정. s = { type, dist, angle, press, gkOut, attr, opp, width }
  SIM.resolveShot = function (G, s, input) {
    const aim = input.aim, t = input.timing;
    const good = isGood(t, s.width);
    const col = zoneCol(aim), row = zoneRow(aim);
    const corner = col !== 1 && row !== 1;
    const center = col === 1 && row === 1;
    let off = corner ? (good ? 0.05 : 0.5) : center ? (good ? 0.01 : 0.1) : (good ? 0.03 : 0.27);
    off += { near: 0, edge: 0.04, far: 0.12 }[s.dist] || 0;
    off += { header: 0.08, volley: 0.1, power: 0.06, placed: -0.03, chip: 0.04, free: 0.06, pk: -0.02 }[s.type] || 0;
    off += (s.angle === 'narrow' ? 0.08 : 0) + (s.press || 0) * 0.03 - (t - 0.5) * 0.08 - (s.sniper && s.dist === 'far' ? 0.06 : 0);
    const out = { aim, timing: t, good };
    if (chance(G, clamp(off, 0.005, 0.9))) {
      out.off = true;
      out.text = pick(G, row === 0 ? ['크로스바 위로 날아갔다.', '공이 떴다. 관중석으로.'] : ['골대를 살짝 벗어났다.', '골대 옆 그물을 스쳤다.', '골포스트를 때리고 나왔다.']);
      return out;
    }
    // 골키퍼가 고르는 방향
    const gkCol = s.type === 'pk' ? SIM.weighted(G, [0, 1, 2], (c) => [0.42, 0.16, 0.42][c]) : SIM.weighted(G, [0, 1, 2], (c) => [0.34, 0.32, 0.34][c]);
    out.gkCol = gkCol;
    let save;
    const dc = Math.abs(gkCol - col);
    if (dc === 0) save = [0.42, 0.74, 0.64][row];
    else if (dc === 1) save = col === 1 || gkCol === 1 ? [0.1, 0.26, 0.22][row] : 0.06;
    else save = 0.02;
    if (s.type === 'pk') save *= dc === 0 ? 0.85 : 0.3;
    const gkf = clamp(1 + (s.opp - s.attr) / 60, 0.65, 1.35);
    const qf = 1.25 - 0.5 * t;
    save *= gkf * qf * ({ near: 1, edge: 1.15, far: 1.45 }[s.dist] || 1);
    if (s.type === 'power') save *= 0.85;
    if (s.type === 'header') save *= 1.1;
    if (s.gkOut) {
      if (s.type === 'chip') save = row === 0 ? 0.08 : 0.85;
      else save = clamp(save + (col === 1 ? 0.25 : 0.05), 0, 0.95);
    } else if (s.type === 'chip') save = clamp(save + 0.35, 0, 0.95);
    if (chance(G, clamp(save, 0.01, 0.95))) {
      out.saved = true;
      out.text = dc === 0 ? pick(G, ['골키퍼가 방향을 읽었다. 막혔다.', '골키퍼 손끝에 걸렸다.']) : '골키퍼가 반대로 떴는데 발에 맞고 나왔다.';
      return out;
    }
    out.goal = true;
    out.text = corner && good ? pick(G, ['구석으로 정확히 꽂혔다. 골!', '골키퍼가 몸을 날렸지만 닿지 않았다. 골!'])
      : pick(G, ['그물이 출렁였다. 골!', '골키퍼가 반대쪽으로 넘어졌다. 골!', '들어갔다. 골!']);
    out.wonder = (s.dist === 'far' || s.type === 'free' || s.angle === 'narrow') && good;
    return out;
  };

  // 다이빙 판정 (내가 골키퍼). d = { kind, dist, attr, shooter, width, bias }
  SIM.resolveDive = function (G, d, input) {
    const out = { zone: input.zone, timing: input.timing };
    const w = d.bias || [1, 0.6, 1, 0.8, 0.25, 0.8, 1.2, 0.6, 1.2];
    const shot = SIM.weighted(G, [0, 1, 2, 3, 4, 5, 6, 7, 8], (z) => w[z]);
    out.shot = shot;
    if (chance(G, { near: 0.08, edge: 0.15, far: 0.24, pk: 0.07 }[d.dist] || 0.1)) { out.off = true; out.text = '슛이 골대를 벗어났다.'; return out; }
    const dc = Math.abs(zoneCol(shot) - zoneCol(input.zone)), dr = Math.abs(zoneRow(shot) - zoneRow(input.zone));
    let save = dc === 0 && dr === 0 ? 0.9 : dc === 0 && dr === 1 ? 0.62 : dc === 1 && dr === 0 ? 0.36 : dc === 1 && dr === 1 ? 0.2 : dc === 0 ? 0.3 : 0.02;
    if (d.dist === 'far') save += dc <= 1 ? 0.15 : 0.04;
    if (d.dist === 'pk') save *= 0.8;
    const rf = clamp(1 + (d.attr - d.shooter) / 60, 0.7, 1.3);
    const tf = isGood(input.timing, d.width) ? 1 : 0.35 + 0.5 * input.timing;
    save = clamp(save * rf * tf, 0.01, 0.97);
    if (chance(G, save)) { out.saved = true; out.text = dc === 0 ? pick(G, ['정확히 읽었다. 선방!', '손바닥으로 쳐 냈다. 선방!']) : '끝까지 뻗은 손끝에 걸렸다. 선방!'; }
    else { out.goal = true; out.text = dc === 0 ? '방향은 맞았는데 한 박자 늦었다. 실점.' : `${SIM.ZONE_KO[shot]}으로 들어갔다. 실점.`; }
    return out;
  };

  // 태클 판정. k = { attr, atk, width, inBox }
  SIM.resolveTackle = function (G, k, input) {
    const df = clamp(1 + (k.attr - k.atk) / 60, 0.7, 1.3);
    const t = input.timing;
    const p = isGood(t, k.width) ? 0.86 * df : t > 0.55 ? 0.38 * df : 0.08;
    const out = { timing: t };
    if (chance(G, clamp(p, 0.03, 0.97))) { out.won = true; out.text = isGood(t, k.width) ? '타이밍 완벽. 공만 걷어 냈다.' : '발끝에 겨우 걸렸다.'; return out; }
    if (t < 0.45 && chance(G, 0.55)) { out.foul = true; out.text = k.inBox ? '늦었다. 페널티킥 선언.' : '반칙. 휘슬이 울렸다.'; return out; }
    out.beaten = true; out.text = '한 발 늦었다. 공격수가 빠져나갔다.';
    return out;
  };

  // ── 기회 하나 진행
  const P = SIM.PITCH_POS = {};

  function ctxFor(G, fx) {
    const p = G.p;
    return { fx, opp: fx.oppStr, video: p.flags.videoBonus > 0, tip: chance(G, 0.6) ? pick(G, ['slowDef', 'gkLow', 'highLine', 'leftWeak', 'gkHigh']) : null, flags: {} };
  }
  const tipText = {
    slowDef: '분석: 상대 센터백은 돌아서는 게 느리다', gkLow: '분석: 상대 골키퍼는 낮은 공에 약하다', gkHigh: '분석: 상대 골키퍼는 키가 작아서 위쪽 구석이 비어 있다',
    highLine: '분석: 상대 수비 라인이 높다', leftWeak: '분석: 상대 왼쪽 풀백이 지쳐 있다',
  };
  function hints(c, list) {
    const out = list.filter(Boolean);
    if (c.video && c.tip) out.push(tipText[c.tip]);
    return out;
  }
  const A = (p) => p.attrs;

  // 각 장면의 단계. (G, c) => { text, hints, pitch, options:[{label, sub?, go(G,c)->{to, text, shot?, ...}}] }
  const B = {};

  // 공격 공통 마무리: 슛 미니게임으로 넘긴다
  function shotStep(G, c, s) {
    const a = A(G.p);
    const attr = s.type === 'header' ? (a.phy + a.sho) / 2 : s.type === 'free' || s.type === 'pk' ? (a.sho + (G.p.sp || 50)) / 2 : a.sho;
    let mod = 0;
    if (c.tip === 'gkLow') mod += 0.02;
    if (G.p.flags.sharp > 0) mod += 0.03;
    mod += SIM.traitWidth(G, 'shot', s, c.fx);
    return Object.assign({ to: 'shot', opp: c.opp + 2, attr, width: SIM.sweetWidth(attr, mod - (s.press || 0) * 0.025 + (s.type === 'placed' ? 0.03 : 0) - (s.type === 'power' ? 0.02 : 0)), press: 0 }, s, { tip: c.tip, sniper: SIM.has(G, 'sniper') });
  }
  // 동료 마무리
  function mateFinish(G, c, conv, text) {
    if (chance(G, conv)) return { to: 'end', assist: true, text: text || '동료가 그대로 밀어 넣었다. 도움!' };
    return { to: 'end', ok: true, text: pick(G, ['동료의 슛이 골키퍼에게 막혔다. 좋은 패스였다.', '동료의 슛이 살짝 빗나갔다.']) };
  }
  const lost = (G, c, t) => (chance(G, 0.1) ? { to: 'end', conceded: true, text: t + ' 역습으로 실점했다.' } : { to: 'end', lost: true, text: t });
  const pass = (G, a, opp, bonus) => chance(G, sig((a.pas - opp) / 8 + bonus + (SIM.has(G, 'maestro') ? 0.3 : 0)));
  const beat = (G, a, opp, bonus) => chance(G, sig(((a.dri + a.spd) / 2 - opp) / 8 + bonus + (SIM.has(G, 'speedster') ? 0.3 : 0)));

  // 1) 역습
  B.counter1 = (G, c) => {
    c.flags.side = c.flags.side || pick(G, ['left', 'right']);
    const s = c.flags.side === 'left' ? -1 : 1;
    return {
      text: '상대 코너킥을 막고 역습이다. 하프라인 근처에서 공을 잡았다.',
      hints: hints(c, ['앞에 수비가 둘밖에 없다', `${s < 0 ? '오른쪽' : '왼쪽'} 측면 동료가 같이 뛰고 있다`, c.tip === 'highLine' && '수비 뒷공간이 넓다']),
      pitch: { me: [48 + s * 10, 54], ball: [48 + s * 10, 51], mates: [[48 - s * 26, 50], [48 + s * 2, 62]], opps: [[42, 36], [58, 34], [48 + s * 6, 60]], gk: [48, 12] },
      options: [
        { label: '직접 몰고 간다', sub: '스피드', go: (G, c) => beat(G, A(G.p), c.opp, 0.6) ? { to: 'counter2', text: '수비 한 명을 속도로 따돌렸다.' } : lost(G, c, '수비가 몸으로 막아섰다.') },
        { label: '측면으로 벌려 준다', sub: '패스', go: (G, c) => pass(G, A(G.p), c.opp, 1.2) ? { to: 'cross1', text: '측면 동료에게 연결됐다. 나는 박스로 뛴다.' } : lost(G, c, '패스가 끊겼다.') },
        { label: '스루패스', sub: '패스·위험', go: (G, c) => pass(G, A(G.p), c.opp, c.tip === 'highLine' ? 0.6 : -0.3) ? mateFinish(G, c, 0.45, '스루패스 한 방. 동료가 1대1에서 넣었다. 도움!') : lost(G, c, '스루패스가 길었다.') },
        { label: '속도를 늦춘다', sub: '안전', go: () => ({ to: 'end', ok: true, small: true, text: '동료들이 올라올 때까지 공을 지켰다. 공격은 다시 시작.' }) },
      ],
    };
  };
  B.counter2 = (G, c) => ({
    text: '박스 앞까지 왔다. 마지막 수비 한 명이 앞을 막는다.',
    hints: hints(c, ['골키퍼가 각을 좁히러 나오고 있다', '뒤에서 동료가 따라오고 있다']),
    pitch: { me: [48, 36], ball: [48, 33], mates: [[30, 40], [62, 44]], opps: [[48, 28], [70, 40]], gk: [48, 15] },
    options: [
      { label: '바로 때린다', sub: '중거리', go: (G, c) => shotStep(G, c, { type: 'power', dist: 'edge', press: 1 }) },
      { label: '헛다리로 제친다', sub: '드리블', go: (G, c) => beat(G, A(G.p), c.opp, 0.2 + (c.tip === 'slowDef' ? 0.6 : 0)) ? { to: 'oneOnOne', text: '수비가 헛다리에 속았다. 이제 골키퍼뿐.' } : lost(G, c, '수비가 속지 않았다.') },
      { label: '왼쪽 동료에게', sub: '패스', go: (G, c) => pass(G, A(G.p), c.opp, 0.9) ? mateFinish(G, c, 0.38) : lost(G, c, '패스가 수비 발에 걸렸다.') },
      { label: '원투 패스', sub: '패스+침투', go: (G, c) => pass(G, A(G.p), c.opp, 0.4) && beat(G, A(G.p), c.opp, 0.8) ? { to: 'oneOnOne', text: '주고 들어가서 다시 받았다.' } : lost(G, c, '리턴 패스가 어긋났다.') },
    ],
  });
  // 2) 골키퍼와 1대1
  B.oneOnOne = (G, c) => ({
    text: '골키퍼와 1대1. 골키퍼가 앞으로 튀어나온다.',
    hints: hints(c, ['골키퍼가 앞으로 많이 나왔다', c.tip === 'gkHigh' && '키가 작은 골키퍼다']),
    pitch: { me: [50, 24], ball: [50, 21], mates: [[32, 34]], opps: [[58, 34]], gk: [49, 17] },
    options: [
      { label: '구석으로 찬다', sub: '조준', go: (G, c) => shotStep(G, c, { type: 'placed', dist: 'near', gkOut: true }) },
      { label: '칩슛', sub: '골키퍼 머리 위로', go: (G, c) => shotStep(G, c, { type: 'chip', dist: 'near', gkOut: true }) },
      { label: '골키퍼를 제친다', sub: '드리블', go: (G, c) => beat(G, A(G.p), c.opp + 2, 0.1) ? { to: 'end', goal: true, text: '골키퍼까지 제치고 빈 골대에 밀어 넣었다. 골!' } : chance(G, 0.3) ? { to: 'pk1', text: '골키퍼 손에 걸려 넘어졌다. 페널티킥!' } : { to: 'end', lost: true, text: '골키퍼가 발밑의 공을 덮쳤다.' } },
      { label: '옆 동료에게 내준다', sub: '확실하게', go: (G, c) => pass(G, A(G.p), c.opp, 1.4) ? mateFinish(G, c, 0.72, '골키퍼를 끌어내고 옆으로 내줬다. 빈 골대. 도움!') : lost(G, c, '내준 공이 길었다.') },
    ],
  });
  // 3) 크로스 받기
  B.cross1 = (G, c) => ({
    text: '측면에서 크로스가 올라온다. 어디로 뛸까.',
    hints: hints(c, ['수비 하나가 나를 붙잡고 있다', '골키퍼는 가운데에 서 있다']),
    pitch: { me: [48, 30], ball: [84, 26], mates: [[86, 28], [60, 40]], opps: [[50, 26], [40, 22], [58, 22]], gk: [48, 12], trail: [[84, 26], [60, 14], [48, 20]] },
    options: [
      { label: '니어 포스트로 쇄도', sub: '헤더', go: (G, c) => chance(G, sig((A(G.p).spd - c.opp) / 8 + 0.4)) ? shotStep(G, c, { type: 'header', dist: 'near', angle: 'narrow' }) : { to: 'end', ok: true, small: true, text: '수비가 먼저 머리를 댔다.' } },
      { label: '파 포스트로 돌아간다', sub: '헤더', go: (G, c) => chance(G, 0.45) ? shotStep(G, c, { type: 'header', dist: 'near' }) : { to: 'end', ok: true, small: true, text: '크로스가 짧아서 내 쪽까지 오지 않았다.' } },
      { label: '페널티 스폿에서 기다린다', sub: '발리', go: (G, c) => chance(G, 0.5) ? shotStep(G, c, { type: 'volley', dist: 'near', press: 1 }) : { to: 'end', ok: true, small: true, text: '공이 수비 머리에 맞고 밖으로 나갔다.' } },
      { label: '수비를 등지고 버틴다', sub: '피지컬', go: (G, c) => chance(G, sig((A(G.p).phy - c.opp) / 7)) ? { to: 'cutback', text: '몸싸움에서 이겼다. 공이 발밑에 떨어졌다.' } : { to: 'end', lost: true, text: '몸싸움에서 밀렸다.' } },
    ],
  });
  B.cutback = (G, c) => ({
    text: '골대 앞 혼전. 공이 발밑에 있다. 등 뒤에 수비.',
    hints: hints(c, ['돌아설 공간이 좁다', '뒤에서 동료가 뛰어든다']),
    pitch: { me: [46, 20], ball: [46, 22], mates: [[56, 30]], opps: [[46, 17], [38, 20], [54, 18]], gk: [49, 11] },
    options: [
      { label: '돌아서서 때린다', sub: '터닝슛', go: (G, c) => shotStep(G, c, { type: 'power', dist: 'near', press: 2 }) },
      { label: '뒤로 내준다', sub: '컷백', go: (G, c) => pass(G, A(G.p), c.opp, 1.1) ? mateFinish(G, c, 0.5) : lost(G, c, '내준 공을 수비가 걷어냈다.') },
      { label: '반칙을 유도한다', sub: '노련함', go: (G, c) => chance(G, 0.35) ? { to: 'pk1', text: '수비가 뒤에서 밀었다. 페널티킥!' } : { to: 'end', lost: true, text: '심판은 휘슬을 불지 않았다.' } },
    ],
  });
  // 4) 박스 앞 세컨드볼
  B.second1 = (G, c) => {
    c.flags.press = SIM.weighted(G, [0, 1, 2], (n) => [3, 4, 3][n]);
    return {
      text: '걷어낸 공이 박스 바로 앞으로 떨어진다. 내가 제일 가깝다.',
      hints: hints(c, [c.flags.press === 2 ? '수비 둘이 달려든다' : c.flags.press === 0 ? '주위에 아무도 없다' : '수비 하나가 다가온다', '골키퍼 앞이 붐빈다']),
      pitch: { me: [44, 37], ball: [45, 34], mates: [[66, 26], [30, 28]], opps: [[50, 30], [40, 28], [58, 24], [36, 42]].slice(0, 2 + c.flags.press), gk: [48, 12] },
      options: [
        { label: '논스톱 중거리', sub: '강하게', go: (G, c) => shotStep(G, c, { type: 'power', dist: 'far', press: c.flags.press }) },
        { label: '한 번 잡고 감아 찬다', sub: '정확하게', go: (G, c) => c.flags.press === 2 && chance(G, 0.5) ? lost(G, c, '잡는 사이 수비가 붙었다.') : shotStep(G, c, { type: 'placed', dist: 'edge', press: Math.max(0, c.flags.press - 1) }) },
        { label: '침투하는 동료에게', sub: '스루패스', go: (G, c) => pass(G, A(G.p), c.opp, 0.3 - c.flags.press * 0.3 + (c.tip === 'highLine' ? 0.5 : 0)) ? mateFinish(G, c, 0.46) : lost(G, c, '패스가 막혔다.') },
        { label: '측면으로 돌린다', sub: '안전', go: (G, c) => pass(G, A(G.p), c.opp, 1.6) ? { to: 'end', ok: true, small: true, text: '공을 지켜 냈다. 다시 만들어 간다.' } : lost(G, c, '패스가 끊겼다.') },
      ],
    };
  };
  // 5) 측면 돌파
  B.wing1 = (G, c) => ({
    text: '측면에서 상대 풀백과 1대1. 공을 몰고 있다.',
    hints: hints(c, [c.tip === 'leftWeak' ? '상대 풀백이 지쳐 있다' : '상대 풀백이 바짝 붙었다', '박스 안에 우리 공격수 둘']),
    pitch: { me: [80, 40], ball: [80, 37], mates: [[48, 24], [58, 30]], opps: [[78, 34], [46, 20], [56, 22]], gk: [48, 12] },
    options: [
      { label: '안으로 접고 들어간다', sub: '드리블', go: (G, c) => beat(G, A(G.p), c.opp, 0.3 + (c.tip === 'leftWeak' ? 0.6 : 0)) ? { to: 'curl', text: '안으로 접어 들어왔다.' } : lost(G, c, '풀백이 안쪽을 막고 있었다.') },
      { label: '바깥으로 치고 달린다', sub: '스피드', go: (G, c) => chance(G, sig((A(G.p).spd - c.opp) / 7 + 0.3 + (c.tip === 'leftWeak' ? 0.6 : 0))) ? { to: 'byline', text: '속도로 풀백을 떨어뜨렸다. 골라인 근처까지 왔다.' } : lost(G, c, '풀백이 몸으로 밀어냈다.') },
      { label: '그 자리에서 크로스', sub: '패스', go: (G, c) => pass(G, A(G.p), c.opp, 0.3) ? mateFinish(G, c, 0.3, '크로스를 동료가 머리로 꽂았다. 도움!') : { to: 'end', ok: true, small: true, text: '크로스가 수비 머리에 걸렸다.' } },
      { label: '뒤로 돌린다', sub: '안전', go: () => ({ to: 'end', ok: true, small: true, text: '공을 뒤로 돌렸다. 기회는 다음으로.' }) },
    ],
  });
  B.curl = (G, c) => ({
    text: '박스 모서리. 반대쪽 골대 구석이 보인다.',
    hints: hints(c, ['감아 차기 좋은 각도다', '수비 하나가 슛 길을 막으려 한다']),
    pitch: { me: [70, 32], ball: [68, 30], mates: [[48, 22]], opps: [[64, 28], [50, 20]], gk: [50, 12] },
    options: [
      { label: '반대쪽으로 감아 찬다', sub: '정확하게', go: (G, c) => shotStep(G, c, { type: 'placed', dist: 'edge', press: 1 }) },
      { label: '니어로 강하게', sub: '기습', go: (G, c) => shotStep(G, c, { type: 'power', dist: 'edge', angle: 'narrow', press: 1 }) },
      { label: '박스 안 동료에게', sub: '패스', go: (G, c) => pass(G, A(G.p), c.opp, 0.6) ? mateFinish(G, c, 0.4) : lost(G, c, '패스가 끊겼다.') },
    ],
  });
  B.byline = (G, c) => ({
    text: '골라인 근처. 골키퍼가 니어 포스트를 막고 있다.',
    hints: hints(c, ['컷백 자리에 동료가 서 있다', '각도가 거의 없다']),
    pitch: { me: [82, 14], ball: [80, 15], mates: [[56, 24], [46, 18]], opps: [[50, 16], [42, 14], [78, 20]], gk: [62, 11] },
    options: [
      { label: '컷백', sub: '뒤로 낮게', go: (G, c) => pass(G, A(G.p), c.opp, 1.0) ? mateFinish(G, c, 0.52, '낮게 깔아 준 공을 동료가 원터치로 넣었다. 도움!') : lost(G, c, '컷백이 수비 발에 맞았다.') },
      { label: '높은 크로스', sub: '헤더 노림', go: (G, c) => pass(G, A(G.p), c.opp, 0.3) ? mateFinish(G, c, 0.34, '크로스에 동료 머리가 정확히 맞았다. 도움!') : { to: 'end', ok: true, small: true, text: '골키퍼가 크로스를 잡았다.' } },
      { label: '직접 때린다', sub: '각도 없음', go: (G, c) => shotStep(G, c, { type: 'power', dist: 'near', angle: 'narrow', press: 1 }) },
    ],
  });
  // 6) 탈압박 (미드필더)
  B.press1 = (G, c) => ({
    text: '중원에서 공을 받는 순간 상대 둘이 압박해 온다.',
    hints: hints(c, ['등 뒤에서 하나, 옆에서 하나', '반대편 측면이 비어 있다']),
    pitch: { me: [48, 48], ball: [48, 45], mates: [[20, 40], [70, 36], [48, 60]], opps: [[48, 52], [54, 46], [40, 34]], gk: [48, 12] },
    options: [
      { label: '등지고 턴', sub: '드리블', go: (G, c) => beat(G, A(G.p), c.opp, 0.1) ? { to: 'through', text: '한 바퀴 돌아서 압박을 벗겨 냈다. 앞이 열렸다.' } : lost(G, c, '돌다가 공을 뺏겼다.') },
      { label: '원터치 패스', sub: '간결하게', go: (G, c) => pass(G, A(G.p), c.opp, 1.0) ? { to: 'end', ok: true, small: true, text: '원터치로 압박을 풀었다. 감독이 박수를 쳤다.' } : lost(G, c, '패스가 상대 발에 걸렸다.') },
      { label: '반대편으로 롱패스', sub: '전환', go: (G, c) => pass(G, A(G.p), c.opp, 0.2) ? { to: 'wing1', text: '반대편으로 길게 넘겼다. 측면에서 다시 공을 받았다.' } : lost(G, c, '롱패스가 길었다.') },
      { label: '반칙을 얻어 낸다', sub: '영리하게', go: (G, c) => chance(G, 0.45) ? { to: 'free1', text: '압박하던 상대가 다리를 걸었다. 프리킥.' } : lost(G, c, '그냥 넘어진 거라고 했다.') },
    ],
  });
  B.through = (G, c) => ({
    text: '앞에 공간이 열렸다. 공격수가 수비 뒤로 뛰기 시작한다.',
    hints: hints(c, ['수비 라인 사이가 벌어졌다', c.tip === 'highLine' && '상대 수비 라인이 높다']),
    pitch: { me: [48, 40], ball: [48, 37], mates: [[56, 28], [30, 32]], opps: [[46, 30], [60, 26], [36, 26]], gk: [48, 12] },
    options: [
      { label: '스루패스', sub: '킬 패스', go: (G, c) => pass(G, A(G.p), c.opp, 0.4 + (c.tip === 'highLine' ? 0.6 : 0)) ? mateFinish(G, c, 0.5, '수비 사이를 꿰뚫는 패스. 동료가 마무리했다. 도움!') : lost(G, c, '패스가 오프사이드에 걸렸다.') },
      { label: '직접 몰고 들어간다', sub: '드리블', go: (G, c) => beat(G, A(G.p), c.opp, 0.2) ? { to: 'curl', text: '수비 하나를 끌고 박스 모서리까지 왔다.' } : lost(G, c, '수비 둘에게 둘러싸였다.') },
      { label: '중거리', sub: '25m', go: (G, c) => shotStep(G, c, { type: 'power', dist: 'far' }) },
    ],
  });
  // 7) 프리킥
  B.free1 = (G, c) => ({
    text: '박스 앞 22m 프리킥. 수비 벽이 섰다.',
    hints: hints(c, ['벽은 넷', G.p.sp >= 65 ? '세트피스 연습을 많이 했다' : '프리킥을 많이 차 보진 않았다']),
    pitch: { me: [46, 40], ball: [48, 38], mates: [[60, 22], [38, 20]], opps: [[44, 32], [46, 32], [48, 32], [50, 32]], gk: [52, 12] },
    options: [
      { label: '벽 넘겨 감아 찬다', sub: '직접 프리킥', go: (G, c) => shotStep(G, c, { type: 'free', dist: 'edge' }) },
      { label: '골키퍼 쪽으로 강하게', sub: '직접 프리킥', go: (G, c) => shotStep(G, c, { type: 'power', dist: 'far' }) },
      { label: '문전으로 띄운다', sub: '크로스', go: (G, c) => pass(G, A(G.p), c.opp, 0.2) ? mateFinish(G, c, 0.3, '띄운 공을 수비수가 헤더로 넣었다. 도움!') : { to: 'end', ok: true, small: true, text: '골키퍼가 펀칭으로 쳐 냈다.' } },
      { label: '짧게 내준다', sub: '약속된 플레이', go: (G, c) => chance(G, 0.5) ? { to: 'curl', text: '짧게 주고받아서 각도를 바꿨다.' } : { to: 'end', ok: true, small: true, text: '약속된 플레이가 읽혔다.' } },
    ],
  });
  // 8) 페널티킥 키커
  B.pk1 = (G, c) => ({
    text: '페널티킥. 공을 내려놓았다. 골키퍼가 양팔을 벌린다.',
    hints: hints(c, ['골키퍼는 마지막까지 버티는 편이다', G.p.sp >= 65 ? '세트피스 연습을 많이 했다' : null]),
    pitch: { me: [48, 30], ball: [48, 24], mates: [[30, 34], [66, 34]], opps: [[36, 36], [60, 36]], gk: [48, 11] },
    options: [
      { label: '찬다', sub: '조준', go: (G, c) => shotStep(G, c, { type: 'pk', dist: 'near' }) },
      { label: '동료에게 양보한다', sub: '', go: (G, c) => chance(G, 0.76) ? { to: 'end', ok: true, small: true, teamGoal: true, text: '동료가 차서 넣었다.' } : { to: 'end', ok: true, small: true, text: '동료의 페널티킥이 막혔다.' } },
    ],
  });

  // ── 수비
  function tackleStep(G, c, k) {
    const a = A(G.p);
    return Object.assign({ to: 'tackle', attr: a.def, atk: c.atk, width: SIM.sweetWidth(a.def, (k.mod || 0) + (G.p.flags.sharp > 0 ? 0.03 : 0) + SIM.traitWidth(G, 'tackle', k, c.fx)) }, k);
  }
  B.d1v1 = (G, c) => ({
    text: '상대 윙어가 공을 몰고 1대1로 달려든다.',
    hints: hints(c, ['상대가 속도를 붙였다', c.tip === 'leftWeak' ? '분석: 이 윙어는 오른발만 쓴다' : '뒤에 받쳐 줄 동료가 멀다']),
    pitch: { me: [56, 30], ball: [62, 40], opps: [[62, 42], [44, 30]], mates: [[48, 12], [40, 24]], gk: null, ourGoal: true },
    options: [
      { label: '바로 태클', sub: '타이밍', go: (G, c) => tackleStep(G, c, { inBox: false, mod: c.tip === 'leftWeak' ? 0.04 : 0 }) },
      { label: '바깥으로 몰아낸다', sub: '위치', go: (G, c) => chance(G, sig((A(G.p).def - c.atk) / 8 + 0.6)) ? { to: 'd1v1b', text: '상대를 터치라인 쪽으로 몰았다.' } : { to: 'dShot', text: '안으로 파고들었다.' } },
      { label: '거리를 두고 지연', sub: '안전', go: (G, c) => chance(G, sig(((A(G.p).def + A(G.p).phy) / 2 - c.atk) / 9 + 0.9)) ? { to: 'end', defended: true, text: '버티고 버텨서 동료가 돌아올 시간을 벌었다.' } : { to: 'dShot', text: '공간을 너무 내줬다.' } },
      { label: '반칙으로 끊는다', sub: '경고 각오', go: (G, c) => chance(G, 0.4) ? { to: 'end', defended: true, yellow: true, text: '반칙으로 끊었다. 옐로카드. 위기는 넘겼다.' } : { to: 'end', defended: true, text: '심판이 그냥 넘어갔다. 운이 좋았다.' } },
    ],
  });
  B.d1v1b = (G, c) => ({
    text: '터치라인 쪽으로 몰았다. 상대가 크로스 각도를 본다.',
    hints: hints(c, ['상대가 공을 오른발로 옮겼다']),
    pitch: { me: [72, 26], ball: [78, 30], opps: [[78, 32], [48, 20]], mates: [[48, 12], [44, 22]], gk: null, ourGoal: true },
    options: [
      { label: '크로스를 막는 태클', sub: '타이밍', go: (G, c) => tackleStep(G, c, { inBox: false, mod: 0.05 }) },
      { label: '발만 뻗어 막는다', sub: '블록', go: (G, c) => chance(G, sig((A(G.p).def - c.atk) / 8 + 0.5)) ? { to: 'end', defended: true, text: '크로스가 다리에 맞고 라인 밖으로 나갔다.' } : { to: 'dCross', text: '크로스가 다리 사이로 빠져나갔다.' } },
    ],
  });
  B.dCross = (G, c) => ({
    text: '측면에서 크로스가 올라온다. 상대 공격수가 문전으로 뛰어든다.',
    hints: hints(c, ['상대 공격수가 공중볼에 강하다', '골키퍼가 나올지 애매한 거리']),
    pitch: { me: [46, 20], ball: [84, 22], opps: [[50, 22], [40, 26]], mates: [[48, 11], [58, 20]], gk: null, trail: [[84, 22], [60, 12], [48, 18]], ourGoal: true },
    options: [
      { label: '먼저 헤더로 걷어낸다', sub: '공중볼', go: (G, c) => chance(G, sig((A(G.p).phy - c.atk) / 8 + 0.6)) ? { to: 'end', defended: true, text: '먼저 뛰어 머리로 멀리 걷어냈다.' } : { to: 'dShot', text: '공격수가 먼저 머리를 댔다.' } },
      { label: '공격수 몸을 막는다', sub: '몸싸움', go: (G, c) => chance(G, sig((A(G.p).phy - c.atk) / 8 + 0.3)) ? { to: 'end', defended: true, text: '공격수가 점프를 못 했다. 공은 그대로 흘러나갔다.' } : { to: 'dShot', text: '몸싸움에서 밀렸다.' } },
      { label: '골키퍼에게 맡긴다', sub: '콜', go: (G, c) => chance(G, 0.55) ? { to: 'end', defended: true, text: '골키퍼가 나와서 잡았다.' } : { to: 'end', conceded: true, text: '골키퍼와 엉켰다. 공이 골대 안으로.' } },
    ],
  });
  B.dShot = (G, c) => ({
    text: '상대가 슛 자세를 잡았다. 내가 가장 가깝다.',
    hints: hints(c, ['몸을 던지면 막을 수도 있다', '박스 안이다']),
    pitch: { me: [50, 22], ball: [52, 28], opps: [[52, 30]], mates: [[48, 11]], gk: null, ourGoal: true },
    options: [
      { label: '몸을 던진다', sub: '블록', go: (G, c) => chance(G, sig((A(G.p).def - c.atk) / 8 + 0.2)) ? { to: 'end', defended: true, text: '몸으로 슛을 막았다. 관중석이 들썩였다.' } : chance(G, 0.5) ? { to: 'end', conceded: true, text: '굴절된 공이 골대로 들어갔다.' } : { to: 'end', defended: true, text: '골키퍼가 막아 줬다.' } },
      { label: '슬라이딩 태클', sub: '타이밍', go: (G, c) => tackleStep(G, c, { inBox: true, mod: -0.03 }) },
      { label: '각도만 좁힌다', sub: '골키퍼를 믿는다', go: (G, c) => chance(G, 0.58) ? { to: 'end', defended: true, text: '각도를 좁혔고 골키퍼가 막았다.' } : { to: 'end', conceded: true, text: '구석으로 들어갔다. 실점.' } },
    ],
  });
  B.dThrough = (G, c) => ({
    text: '상대가 수비 뒷공간으로 패스를 찔렀다. 공격수와 나란히 달린다.',
    hints: hints(c, ['상대 공격수가 반 발 앞서 있다', '오프사이드 여부가 애매하다']),
    pitch: { me: [44, 36], ball: [48, 26], opps: [[50, 38], [30, 44]], mates: [[48, 11], [64, 40]], gk: null, trail: [[40, 52], [48, 26]], ourGoal: true },
    options: [
      { label: '전력 질주', sub: '스피드', go: (G, c) => chance(G, sig((A(G.p).spd - c.atk) / 7 + 0.2)) ? { to: 'd1v1', text: '따라잡았다. 이제 1대1.' } : { to: 'dShot', text: '따라잡지 못했다.' } },
      { label: '손 들고 오프사이드 어필', sub: '도박', go: (G, c) => chance(G, 0.4) ? { to: 'end', defended: true, text: '깃발이 올라갔다. 오프사이드.' } : { to: 'end', conceded: true, text: '깃발은 안 올라갔다. 실점.' } },
      { label: '뒤에서 슬라이딩', sub: '타이밍', go: (G, c) => tackleStep(G, c, { inBox: false, mod: -0.04 }) },
    ],
  });
  B.setHeader = (G, c) => ({
    text: '우리 코너킥. 공격에 가담했다. 어디로 뛸까.',
    hints: hints(c, ['상대 수비가 지역 방어를 선다', '니어 포스트가 비어 있다']),
    pitch: { me: [48, 26], ball: [86, 9], mates: [[40, 18], [58, 20]], opps: [[46, 16], [52, 18], [42, 22]], gk: [48, 11], trail: [[86, 9], [66, 4], [50, 16]] },
    options: [
      { label: '니어 포스트', sub: '헤더', go: (G, c) => chance(G, 0.5) ? shotStep(G, c, { type: 'header', dist: 'near', angle: 'narrow' }) : { to: 'end', ok: true, small: true, text: '키커의 공이 길었다.' } },
      { label: '가운데로 치고 들어간다', sub: '헤더', go: (G, c) => chance(G, sig((A(G.p).phy - c.opp) / 8)) ? shotStep(G, c, { type: 'header', dist: 'near', press: 1 }) : { to: 'end', ok: true, small: true, text: '수비가 먼저 걷어냈다.' } },
      { label: '파 포스트', sub: '세컨드 볼', go: (G, c) => chance(G, 0.35) ? shotStep(G, c, { type: 'volley', dist: 'near' }) : { to: 'end', ok: true, small: true, text: '공이 내 쪽으로 오지 않았다.' } },
    ],
  });

  // ── 골키퍼
  function diveStep(G, c, d) {
    const a = A(G.p);
    return Object.assign({ to: 'dive', attr: d.dist === 'pk' ? (a.ref + a.cal) / 2 : a.ref, shooter: c.atk, width: SIM.sweetWidth(a.ref, (G.p.flags.sharp > 0 ? 0.03 : 0) + SIM.traitWidth(G, 'dive', d, c.fx)) }, d);
  }
  B.g1v1 = (G, c) => {
    c.flags.v = pick(G, ['long', 'calm', 'fast']);
    return {
      text: '수비가 뚫렸다. 상대 공격수와 1대1.',
      hints: hints(c, [{ long: '공격수가 공을 길게 쳤다', calm: '공격수가 고개를 들고 침착하게 다가온다', fast: '공격수가 빠르게 치고 들어온다' }[c.flags.v]]),
      pitch: { me: [48, 11], ball: [50, 28], opps: [[50, 31], [64, 40]], mates: [[38, 40]], gk: null, ourGoal: true },
      options: [
        { label: '튀어나가 덮친다', sub: '전진', go: (G, c) => chance(G, sig(((A(G.p).one + A(G.p).pos) / 2 - c.atk) / 8 + (c.flags.v === 'long' ? 1.0 : c.flags.v === 'calm' ? -0.5 : 0))) ? { to: 'end', saved: true, text: '먼저 튀어나가 공을 덮쳤다.' } : chance(G, 0.5) ? { to: 'end', conceded: true, text: '너무 일찍 나갔다. 공이 머리 위로 넘어갔다.' } : diveStep(G, c, { dist: 'near', bias: [0.5, 0.2, 0.5, 1, 0.1, 1, 1.4, 0.4, 1.4] }) },
        { label: '각만 좁히고 기다린다', sub: '버티기', go: (G, c) => diveStep(G, c, { dist: 'near', bias: c.flags.v === 'calm' ? [1.2, 0.3, 1.2, 0.8, 0.1, 0.8, 1, 0.3, 1] : undefined }) },
        { label: '먼저 몸을 날린다', sub: '도박', go: (G, c) => chance(G, sig(((A(G.p).ref + A(G.p).one) / 2 - c.atk) / 8 + (c.flags.v === 'fast' ? 0.4 : -0.3))) ? { to: 'end', saved: true, text: '먼저 몸을 날려 슛 길을 막았다.' } : { to: 'end', conceded: true, text: '넘어진 걸 보고 반대쪽으로 찼다. 실점.' } },
      ],
    };
  };
  B.gPk = (G, c) => {
    c.flags.foot = chance(G, 0.8) ? 'R' : 'L';
    c.flags.centerLover = chance(G, 0.3);
    const R = c.flags.foot === 'R';
    const bias = c.flags.centerLover ? [0.6, 0.8, 0.6, 0.6, 1.4, 0.6, 0.8, 1, 0.8] : R ? [0.7, 0.2, 1.1, 0.7, 0.2, 1.1, 0.9, 0.2, 1.4] : [1.1, 0.2, 0.7, 1.1, 0.2, 0.7, 1.4, 0.2, 0.9];
    return {
      text: '페널티킥을 내줬다. 키커가 공을 내려놓는다.',
      hints: hints(c, [R ? '키커는 오른발잡이' : '키커는 왼발잡이', c.video && c.flags.centerLover ? '분석: 이 키커는 큰 경기에서 가운데로 찬 적이 많다' : null]),
      pitch: { me: [48, 11], ball: [48, 24], opps: [[48, 28]], mates: [[34, 34], [62, 34]], gk: null, ourGoal: true },
      options: [{ label: '막는다', sub: '방향 고르기', go: (G, c) => diveStep(G, c, { dist: 'pk', bias }) }],
    };
  };
  B.gLong = (G, c) => ({
    text: '상대 미드필더가 25m 밖에서 슛 자세를 잡는다.',
    hints: hints(c, ['앞에 수비가 시야를 가린다', '슛이 강한 선수다']),
    pitch: { me: [48, 11], ball: [52, 40], opps: [[52, 43], [40, 26]], mates: [[48, 30], [56, 28]], gk: null, ourGoal: true },
    options: [{ label: '막는다', sub: '반응', go: (G, c) => diveStep(G, c, { dist: 'far' }) }],
  });
  B.gCross = (G, c) => {
    c.flags.v = pick(G, ['crowded', 'floaty']);
    return {
      text: '코너킥. 공이 문전으로 날아온다.',
      hints: hints(c, [c.flags.v === 'crowded' ? '문전이 선수들로 꽉 찼다' : '공이 높게 떴다. 떨어지는 데 시간이 있다']),
      pitch: { me: [48, 11], ball: [86, 9], opps: [[46, 20], [54, 16], [40, 16]], mates: [[34, 20], [62, 22]], gk: null, trail: [[86, 9], [70, 4], [52, 12]], ourGoal: true },
      options: [
        { label: '펀칭', sub: '확실하게', go: (G, c) => chance(G, sig((A(G.p).air - c.atk) / 8 + 0.6 + (c.flags.v === 'crowded' ? 0.4 : 0))) ? { to: 'end', saved: true, small: true, text: '주먹으로 멀리 쳐 냈다.' } : chance(G, 0.55) ? { to: 'end', conceded: true, text: '펀칭이 짧았다. 흘러나온 공을 상대가 넣었다.' } : { to: 'end', defended: true, text: '짧은 펀칭이었지만 동료가 걷어냈다.' } },
        { label: '잡는다', sub: '역습 시작', go: (G, c) => chance(G, sig((A(G.p).air - c.atk) / 8 + (c.flags.v === 'floaty' ? 0.6 : -0.4))) ? { to: 'end', saved: true, counter: true, text: '높이 뛰어 공을 품에 안았다. 바로 던져서 역습.' } : chance(G, 0.6) ? { to: 'end', conceded: true, text: '공을 놓쳤다. 문전 혼전 끝에 실점.' } : { to: 'end', defended: true, text: '놓친 공을 수비가 걷어냈다.' } },
        { label: '라인을 지킨다', sub: '헤더 대비', go: (G, c) => chance(G, 0.55) ? diveStep(G, c, { dist: 'near', bias: [1.2, 1, 1.2, 0.6, 0.3, 0.6, 0.4, 0.3, 0.4] }) : { to: 'end', defended: true, text: '상대 헤더가 빗나갔다.' } },
      ],
    };
  };
  B.gBuild = (G, c) => ({
    text: '상대가 높게 압박해 온다. 공은 내 발밑.',
    hints: hints(c, ['센터백 둘이 다 마크당했다', '측면 풀백이 비어 있다']),
    pitch: { me: [48, 11], ball: [48, 14], opps: [[40, 18], [56, 18], [48, 26]], mates: [[34, 16], [62, 16], [20, 30]], gk: null, ourGoal: true },
    options: [
      { label: '측면 풀백에게', sub: '짧은 패스', go: (G, c) => chance(G, sig((A(G.p).kic - c.atk) / 8 + 1.0)) ? { to: 'end', ok: true, small: true, text: '압박을 피해 측면으로 정확히 연결했다.' } : chance(G, 0.4) ? { to: 'end', conceded: true, text: '패스를 가로채였다. 실점.' } : { to: 'end', lost: true, text: '패스가 끊겼지만 수비가 막았다.' } },
      { label: '최전방으로 길게', sub: '롱킥', go: (G, c) => chance(G, sig((A(G.p).kic - c.atk) / 8 + 0.3)) ? { to: 'end', ok: true, counter: true, text: '롱킥 한 번에 공격수가 공을 잡았다. 역습.' } : { to: 'end', lost: true, text: '롱킥이 상대 머리에 걸렸다.' } },
      { label: '한 명 제친다', sub: '침착함', go: (G, c) => chance(G, sig((A(G.p).cal - c.atk) / 8 - 0.2)) ? { to: 'end', ok: true, small: true, text: '골키퍼가 공격수를 제쳤다. 관중석이 술렁였다.' } : { to: 'end', conceded: true, text: '뺏겼다. 빈 골대에 실점.' } },
    ],
  });

  const STARTS = {
    attack: [['counter1', 3], ['second1', 3], ['cross1', 2], ['wing1', 2], ['free1', 1], ['oneOnOne', 1], ['pk1', 0.6]],
    mfAttack: [['press1', 3], ['second1', 3], ['counter1', 2], ['wing1', 1], ['free1', 1.2], ['pk1', 0.4]],
    defend: [['d1v1', 3], ['dCross', 3], ['dThrough', 2], ['dShot', 1]],
    dfAttack: [['setHeader', 1]],
    gk: [['g1v1', 4], ['gCross', 3], ['gLong', 2], ['gPk', 1.2], ['gBuild', 1.5]],
  };
  SIM.CHAIN_BEATS = B;

  function startBeat(G) {
    const pos = G.p.pos;
    let pool;
    if (pos === 'GK') pool = STARTS.gk;
    else if (pos === 'FW') pool = STARTS.attack;
    else if (pos === 'MF') pool = chance(G, 0.72) ? STARTS.mfAttack : STARTS.defend;
    else pool = chance(G, 0.15) ? STARTS.dfAttack : STARTS.defend;
    // 세트피스 연습을 많이 했으면 프리킥·PK 키커 장면이 조금 더 자주
    const sp = (G.p.sp || 0) >= 65 || G.p.flags.taker;
    return SIM.weighted(G, pool, ([id, w]) => w * (sp && (id === 'free1' || id === 'pk1') ? 2 : 1))[0];
  }

  // ── 기회 진행 (동기 부분은 테스트 도구에서도 그대로 쓴다)
  SIM.chanceStart = function (G, fx) {
    const c = ctxFor(G, fx);
    c.atk = fx.oppStr + ri(G, -2, 6);
    const id = startBeat(G);
    // 공격 분석 힌트는 공격 장면에서만
    if (/^(g|d)/.test(id) && id !== 'setHeader') c.tip = id.startsWith('d') && chance(G, 0.5) ? 'leftWeak' : null;
    return { c, id };
  };
  SIM.chanceBeat = (G, c, id) => B[id](G, c);

  // 미니게임 입력을 받아 끝맺음을 만든다
  SIM.chanceMini = function (G, r, input) {
    let end, mini;
    if (r.to === 'shot') {
      mini = { kind: 'shot', spec: r, out: SIM.resolveShot(G, r, input) };
      end = mini.out.goal ? { goal: true, wonder: mini.out.wonder } : mini.out.saved ? { saved0: true } : { missed: true };
      end.text = mini.out.text;
    } else if (r.to === 'dive') {
      mini = { kind: 'dive', spec: r, out: SIM.resolveDive(G, r, input) };
      end = mini.out.goal ? { conceded: true } : mini.out.off ? { defended: true } : { saved: true };
      end.text = mini.out.text;
    } else {
      mini = { kind: 'tackle', spec: r, out: SIM.resolveTackle(G, r, input) };
      const o = mini.out;
      if (o.won) end = { defended: true, big: true };
      else if (o.foul && r.inBox) end = chance(G, 0.76) ? { conceded: true, pk: true } : { defended: true };
      else if (o.foul) end = { defended: true, yellow: chance(G, 0.5) };
      else end = chance(G, 0.4) ? { conceded: true } : { defended: true };
      end.text = o.text + (end.conceded ? (end.pk ? ' 키커가 넣었다.' : ' 그대로 실점.') : o.won ? '' : end.yellow ? ' 옐로카드.' : ' 동료가 수습했다.');
    }
    return { end, mini };
  };

  // 끝맺음을 경기 기록에 반영. 돌려주는 값은 득실 점수(테스트용)
  SIM.chanceApply = function (G, res, end, mini) {
    let delta = 0, ok = false;
    if (end.goal) {
      res.gm++; res.goals++; delta += 0.2 + (end.wonder ? 0.3 : 0); ok = true;
      if (end.wonder) G.p.pop = clamp(G.p.pop + 4, 0, 100);
      const t = mini && mini.spec;
      if (t && SIM.stat) {
        if (t.type === 'free') SIM.stat(G, 'fkGoals');
        if (t.type === 'pk') SIM.stat(G, 'pkGoals');
        if (t.type === 'header') SIM.stat(G, 'headGoals');
        if (t.dist === 'far') SIM.stat(G, 'longGoals');
      }
    }
    else if (end.assist) { res.gm++; res.assists++; delta += 0.25; ok = true; }
    else if (end.teamGoal) { res.gm++; ok = true; }
    if (end.conceded) { res.go++; delta -= 0.3; }
    if (end.saved) {
      res.saves++; delta += 0.45; ok = true;
      if (mini && mini.kind === 'dive' && SIM.stat) { SIM.stat(G, 'sceneSaves'); if (mini.spec.dist === 'pk') SIM.stat(G, 'pkSaves'); }
    }
    if (mini && mini.kind === 'tackle' && mini.out.won && SIM.stat) SIM.stat(G, 'tackles');
    if (end.defended) { delta += end.big ? 0.4 : 0.25; ok = true; }
    if (end.ok) { delta += end.small ? 0.05 : 0.1; ok = true; }
    if (end.lost) delta -= 0.15;
    if (end.yellow) delta -= 0.1;
    if (end.missed) delta -= 0.05;
    res.ratingAdj += delta;
    res.sceneN++;
    if (ok) res.sceneOk++;
    return (end.goal || end.assist || end.teamGoal ? 1 : 0) - (end.conceded ? 1 : 0);
  };

  // 기회 하나를 화면과 주고받으며 끝까지 돌린다
  SIM.runChance = async function (G, fx, res, minute, io) {
    const st = SIM.chanceStart(G, fx);
    const c = st.c;
    let id = st.id, lead = null, prevPitch = null, end = null, mini = null;
    for (let step = 0; step < 5 && !end; step++) {
      const b = B[id](G, c);
      const choice = await io.ask('beat', { beat: b, id, lead, prevPitch, fx, minute, step, ctx: c });
      const r = b.options[clamp(choice | 0, 0, b.options.length - 1)].go(G, c);
      prevPitch = b.pitch;
      if (r.to === 'shot' || r.to === 'dive' || r.to === 'tackle') {
        const input = await io.ask(r.to, { spec: r, fx, minute, lead: r.text, pitch: b.pitch, hints: b.hints });
        ({ end, mini } = SIM.chanceMini(G, r, input));
      } else if (r.to === 'end') end = r;
      else { lead = r.text; id = r.to; }
    }
    if (!end) end = { ok: true, small: true, text: '공격이 흐지부지 끝났다.' };
    SIM.chanceApply(G, res, end, mini);
    await io.show('chanceEnd', { end, mini, fx, minute });
    return end;
  };
})(typeof window !== 'undefined' ? window : globalThis);
