// 화면. 시뮬레이션(SIM)은 io.ask / io.show 로만 화면과 이야기한다.
(function () {
  const D = window.DATA, SIM = window.SIM, PX = window.PX, Sound = window.Sound;
  const $app = document.getElementById('app');
  const KEY = 'deungbeonho';
  const SLOTS = 3;

  let G = null, slot = 0, timers = [];

  // ── 저장
  const mem = {};
  const store = {
    get(k) { try { const v = localStorage.getItem(`${KEY}.${k}`); return v ? JSON.parse(v) : mem[k] ?? null; } catch (e) { return mem[k] ?? null; } },
    set(k, v) { mem[k] = v; try { localStorage.setItem(`${KEY}.${k}`, JSON.stringify(v)); return true; } catch (e) { return false; } },
  };
  const slots = () => store.get('slots') || Array(SLOTS).fill(null);
  function save() {
    if (!G) return;
    const s = slots();
    s[slot] = G;
    if (!store.set('slots', s)) toast('저장 공간이 부족하다. 메뉴의 세이브 코드로 백업해 두자.');
  }
  function clearSlot(i) { const s = slots(); s[i] = null; store.set('slots', s); }
  const encode = (obj) => btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  const decode = (code) => JSON.parse(decodeURIComponent(escape(atob(code.trim()))));

  const settings = store.get('settings') || { sound: true };
  Sound.on = settings.sound;

  // ── 그리기 도우미
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function kitFor(clubId, gk) {
    if (gk) return { primary: '#E0C341', secondary: '#1E1E1E', pattern: 'solid', shorts: '#1E1E1E', socks: '#E0C341' };
    const c = D.CLUBS[clubId];
    const [a, b] = c.colors;
    const shorts = c.pattern === 'solid' ? b : PX.luma(a) > 140 ? '#1E1E1E' : a;
    return { primary: a, secondary: b, pattern: c.pattern, shorts, socks: a };
  }
  function spec(pose = 'stand', frame = 0, p = G.p) {
    return Object.assign({}, p.look, { kit: kitFor(p.club, p.pos === 'GK'), gk: p.pos === 'GK', pose, frame });
  }
  function clearTimers() { timers.forEach(clearInterval); timers = []; }

  function mountPixels(root) {
    root.querySelectorAll('[data-px]').forEach((n) => {
      const t = n.dataset.px, sc = +n.dataset.scale || 3;
      let c;
      if (t === 'player') {
        const pose = n.dataset.pose || 'stand';
        const s = n.dataset.spec ? JSON.parse(n.dataset.spec) : spec(pose);
        const frames = [0, 1].map((f) => PX.playerCanvas(Object.assign({}, s, { pose, frame: f }), sc));
        c = PX.playerCanvas(Object.assign({}, s, { pose, frame: 0 }), sc);
        const ctx = c.getContext('2d');
        let k = 0;
        if (pose === 'stand') {
          timers.push(setInterval(() => {
            const blink = Math.random() < 0.08;
            ctx.clearRect(0, 0, c.width, c.height); ctx.drawImage(frames[blink ? 1 : 0], 0, 0);
          }, 160));
        } else {
          timers.push(setInterval(() => { k++; ctx.clearRect(0, 0, c.width, c.height); ctx.drawImage(frames[k % 2], 0, 0); }, 260));
        }
      } else if (t === 'badge') {
        const club = D.CLUBS[n.dataset.club];
        c = PX.badgeElement(club, sc);
      } else if (t === 'icon') c = PX.iconCanvas(n.dataset.name, sc);
      else if (t === 'trophy') c = PX.trophyCanvas(n.dataset.name, sc);
      if (c) n.replaceWith(c);
    });
  }

  function render(html) {
    clearTimers();
    $app.innerHTML = html;
    mountPixels($app);
    window.scrollTo(0, 0);
  }

  // data-v 버튼 하나를 누를 때까지 기다린다
  function choose(filter) {
    return new Promise((res) => {
      $app.onclick = (e) => {
        const b = e.target.closest('[data-v]');
        if (!b || b.disabled) return;
        if (filter && !filter(b.dataset.v, b)) return;
        $app.onclick = null;
        Sound.play('click');
        res(b.dataset.v);
      };
    });
  }
  const next = (label = '계속') => `<div class="bottom"><button class="btn primary center" data-v="next"><span class="t">${label}</span></button></div>`;

  function toast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1E1E1E;color:#F2EBDD;padding:8px 12px;font-size:13px;max-width:90%;z-index:9';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  const clubName = (id) => D.CLUBS[id].name;
  const leagueName = (id) => D.LEAGUES[D.CLUBS[id].league].name;
  const top = (left, right = '') => `<div class="top"><b>${left}</b><span>${right}</span></div>`;
  const ratingTag = (r) => (r == null ? '' : `<span class="rating ${r >= 7.5 ? 'hi' : r < 6 ? 'lo' : ''}">${r.toFixed(1)}</span>`);
  const roleKo = { start: '선발', sub: '교체', bench: '벤치', out: '명단 제외' };
  const stageLabel = (p) => {
    const lg = D.CLUBS[p.club].league;
    if (lg === 'school') return `고${p.grade}`;
    if (lg === 'univ') return '대학';
    return `${p.age}세`;
  };

  // ── 타이틀
  async function title() {
    G = null;
    const s = slots();
    const has = s.some(Boolean);
    const demo = { skin: 1, hairStyle: 1, hairColor: 0, kit: { primary: '#C8352B', secondary: '#1E1E1E', pattern: 'vstripe', shorts: '#1E1E1E', socks: '#C8352B' } };
    render(`
      <div class="title">
        <div class="logo">등번호<span class="num">28</span></div>
        <div class="sub">고1 벤치에서 등번호 28번을 받았다. 9번을 달 때까지, 그다음까지.</div>
        <div class="hero"><span data-px="player" data-pose="sky" data-scale="5" data-spec='${JSON.stringify(demo)}'></span></div>
        ${has ? '<button class="btn primary" data-v="continue"><span class="t">이어하기</span></button>' : ''}
        <button class="btn" data-v="new"><span class="t">새 커리어</span><span class="d">포지션을 고르고 고등학교 축구부에 들어간다</span></button>
        <button class="btn" data-v="hall"><span class="t">명예의 전당</span><span class="d">은퇴한 선수들</span></button>
        <button class="btn slim" data-v="code"><span class="t">세이브 코드</span><span class="d">다른 기기로 옮기거나 백업할 때</span></button>
      </div>
      <div class="foot">클럽·리그·대회 명칭의 권리는 각 권리자에게 있습니다.<br>엠블럼은 쓰지 않습니다. 등장 선수는 모두 가상 인물입니다.</div>`);
    const v = await choose();
    Sound.unlock();
    if (v === 'continue') return pickSlot('load');
    if (v === 'new') return pickSlot('new');
    if (v === 'hall') return hallScreen();
    if (v === 'code') return codeScreen();
  }

  async function pickSlot(mode) {
    const s = slots();
    render(`${top(mode === 'new' ? '새 커리어 · 저장 칸 고르기' : '이어하기')}
      ${s.map((g, i) => {
        if (!g) return `<button class="btn" data-v="${i}" ${mode === 'load' ? 'disabled' : ''}><span class="t">${i + 1}번 칸</span><span class="d">비어 있음</span></button>`;
        return `<button class="btn" data-v="${i}"><span class="t">${i + 1}번 칸 · ${esc(g.p.name)}</span><span class="d">${g.year} 시즌 ${g.week > 12 ? '결산' : g.week + '주차'} · ${clubName(g.p.club)} · ${SIM.POS[g.p.pos]} · OVR ${SIM.ovr(g.p)}</span></button>`;
      }).join('')}
      ${next('뒤로').replace('data-v="next"', 'data-v="back"').replace('primary', '')}`);
    const v = await choose();
    if (v === 'back') return title();
    slot = +v;
    if (mode === 'load') { G = s[slot]; return run(); }
    if (s[slot]) {
      render(`${top('덮어쓰기')}<div class="paper"><p>${slot + 1}번 칸의 ${esc(s[slot].p.name)} 커리어가 지워진다.</p></div>
        <div class="btn-row"><button class="btn" data-v="no">취소</button><button class="btn primary" data-v="yes">지우고 시작</button></div>`);
      if ((await choose()) === 'no') return pickSlot(mode);
    }
    return createScreen();
  }

  // ── 선수 만들기
  async function createScreen() {
    const st = { name: '', pos: 'FW', foot: 'R', look: { skin: 1, hairStyle: 0, hairColor: 0 } };
    const draw = () => {
      const kit = kitFor(D.SCHOOLS[0][0], st.pos === 'GK');
      const s = Object.assign({}, st.look, { kit, gk: st.pos === 'GK' });
      const pv = $app.querySelector('.pv');
      clearTimers();
      pv.innerHTML = `<span data-px="player" data-scale="4" data-spec='${JSON.stringify(s)}'></span>`;
      mountPixels(pv);
      $app.querySelectorAll('[data-pos]').forEach((b) => b.classList.toggle('on', b.dataset.pos === st.pos));
      $app.querySelectorAll('[data-foot]').forEach((b) => b.classList.toggle('on', b.dataset.foot === st.foot));
      $app.querySelector('#skinL').textContent = PX.SKIN[st.look.skin].name;
      $app.querySelector('#hairL').textContent = PX.HAIR_STYLES[st.look.hairStyle].name;
      $app.querySelector('#colL').textContent = PX.HAIR_COLORS[st.look.hairColor].name;
    };
    render(`${top('새 선수', '고등학교 1학년')}
      <div class="field"><label>이름</label><input id="nm" maxlength="8" placeholder="예: 최현석" autocomplete="off"></div>
      <div class="field"><label>포지션</label><div class="seg">
        ${Object.entries(SIM.POS).map(([k, v]) => `<button data-pos="${k}">${v}</button>`).join('')}</div></div>
      <div class="field"><label>주발</label><div class="seg"><button data-foot="R">오른발</button><button data-foot="L">왼발</button></div></div>
      <div class="field"><label>외모</label><div class="looks"><div class="pv"></div><div class="ctl">
        <div class="stepper"><button data-step="skin:-1">◀</button><span>피부 · <b id="skinL"></b></span><button data-step="skin:1">▶</button></div>
        <div class="stepper"><button data-step="hairStyle:-1">◀</button><span>머리 · <b id="hairL"></b></span><button data-step="hairStyle:1">▶</button></div>
        <div class="stepper"><button data-step="hairColor:-1">◀</button><span>머리색 · <b id="colL"></b></span><button data-step="hairColor:1">▶</button></div>
      </div></div></div>
      ${next('입학한다')}`);
    draw();
    const max = { skin: PX.SKIN.length, hairStyle: PX.HAIR_STYLES.length, hairColor: PX.HAIR_COLORS.length };
    await new Promise((res) => {
      $app.onclick = (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        Sound.play('click');
        if (b.dataset.pos) st.pos = b.dataset.pos;
        else if (b.dataset.foot) st.foot = b.dataset.foot;
        else if (b.dataset.step) {
          const [k, d] = b.dataset.step.split(':');
          st.look[k] = (st.look[k] + +d + max[k]) % max[k];
        } else if (b.dataset.v === 'next') {
          st.name = $app.querySelector('#nm').value.trim();
          if (!st.name) { $app.querySelector('#nm').focus(); toast('이름을 적어 주세요'); return; }
          $app.onclick = null;
          return res();
        }
        draw();
      };
    });
    G = SIM.newGame({ name: st.name, pos: st.pos, foot: st.foot, look: st.look, seed: (Date.now() ^ (Math.random() * 1e9)) | 0 });
    save();
    const p = G.p;
    render(`${top('입학')}
      <div class="paper"><div class="kicker">${D.CLUBS[p.club].name} 축구부</div>
        <h2>${esc(p.name)}, 등번호 ${p.squadNo}번</h2>
        <p>${D.CLUBS[p.club].name} 1학년. ${SIM.POS[p.pos]}. 주전 선배들 뒤에서 시작한다.</p>
        <p style="margin-top:8px">${SIM.potentialComment(p)}</p>
        <p style="margin-top:8px" class="muted">라이벌: ${esc(p.rival.name)} (${D.CLUBS[p.rival.club].name}). 같은 해에 입학했고 벌써 소문이 났다.</p>
      </div>${next('첫 주 시작')}`);
    await choose();
    return run();
  }

  // ── 메인 루프
  async function run() {
    while (G && G.phase !== 'retired') {
      if (G.phase === 'week') {
        const { action, focus } = await hub();
        if (action === 'quit') { save(); return title(); }
        if (action === 'retired') break;
        // 한 턴 = 6주. 정한 훈련으로 몰아서 진행하고 큰 경기·소식·이적만 멈춘다
        const end = G.week <= 6 ? 6 : 12;
        turn = { from: G.week, to: end, year: G.year, results: [], ovr: SIM.ovr(G.p), attrs: Object.assign({}, G.p.attrs), action, club: G.p.club, injuredAt: null };
        while (G && G.phase === 'week' && G.week <= end && G.year === turn.year) {
          const heavy = ['train', 'focus', 'special', 'setpiece'].includes(action);
          const a = heavy && G.p.fatigue >= 68 ? 'recovery' : action;
          await SIM.playWeek(G, a, io, focus);
          save();
        }
        if (G) await turnScreen(turn);
        turn = null;
      } else {
        await SIM.endSeason(G, io);
        if (G.phase !== 'retired') save();
      }
    }
    if (G && G.phase === 'retired') {
      const hall = store.get('hall') || [];
      hall.unshift(G.hall);
      store.set('hall', hall.slice(0, 50));
      clearSlot(slot);
      G = null;
    }
    return title();
  }

  // ── 턴 요약 (6주)
  let turn = null;
  function headline(t, p) {
    const rs = t.results.filter((r) => !r.fx.intl);
    const name = p.name;
    const club = clubName(t.club);
    const g = rs.reduce((a, r) => a + r.goals, 0), as = rs.reduce((a, r) => a + r.assists, 0);
    const w = rs.filter((r) => r.gm > r.go || r.pens === 'W').length, l = rs.filter((r) => r.gm < r.go || r.pens === 'L').length;
    const best = rs.filter((r) => r.rating).sort((a, b) => b.rating - a.rating)[0];
    const hat = rs.find((r) => r.goals >= 3);
    const brace = rs.find((r) => r.goals === 2);
    const cs = rs.filter((r) => r.mins >= 60 && r.go === 0).length;
    const played = rs.filter((r) => r.mins > 0).length;
    if (t.injuredAt) return [`${name}, 부상으로 쓰러져`, `${t.injuredAt}주 결장. ${club}에 비상이 걸렸다.`];
    if (hat) return [`${name}, ${hat.fx.opp}전 해트트릭!`, `${club} ${hat.gm}-${hat.go} 승리. 경기장이 ${name}의 이름으로 가득 찼다.`];
    if (g >= 5) return [`${name}, 6주 동안 ${g}골 폭발`, `득점 레이스 선두권. 상대 수비수들의 악몽이 됐다.`];
    if (brace) return [`${name} 멀티골, ${club} 웃었다`, `${brace.fx.opp}전 ${brace.gm}-${brace.go}. 평점 ${brace.rating.toFixed(1)}.`];
    if ((p.pos === 'GK' || p.pos === 'DF') && cs >= 4) return [`${club} 무실점 행진, 그 중심에 ${name}`, `6주 동안 무실점 ${cs}경기.`];
    if (as >= 4) return [`${name}의 발끝에서 시작된다`, `6주 동안 도움 ${as}개.`];
    if (w >= Math.max(4, rs.length * 0.7)) return [`${club} 거침없는 질주`, `${rs.length}경기 ${w}승. ${name}도 힘을 보탰다.`];
    if (played <= rs.length * 0.25 && rs.length >= 4) return [`${name}, 벤치에서 기회를 기다린다`, `${rs.length}경기 중 ${played}경기 출전. 다음 턴이 중요하다.`];
    if (l >= Math.max(3, rs.length * 0.5)) return [`${club} 흔들린다`, `${rs.length}경기 ${l}패. 반등이 필요하다.`];
    if (best && best.rating >= 7.8) return [`${name}, ${best.fx.opp}전 최고 평점`, `평점 ${best.rating.toFixed(1)}. 감독이 엄지를 들었다.`];
    return [`${club} ${w}승 ${rs.length - w - l}무 ${l}패`, played ? `${name} ${played}경기 ${g}골 ${as}도움.` : `${name}은(는) 이번 턴 경기에 나서지 못했다.`];
  }

  async function turnScreen(t) {
    const p = G.p;
    const rs = t.results;
    const club = rs.filter((r) => !r.fx.intl);
    const played = club.filter((r) => r.mins > 0);
    const g = played.reduce((a, r) => a + r.goals, 0), as = played.reduce((a, r) => a + r.assists, 0);
    const avg = SIM.avg(played.map((r) => r.rating));
    const mom = played.filter((r) => r.rating >= 8).length;
    const w = club.filter((r) => r.gm > r.go || r.pens === 'W').length, l = club.filter((r) => r.gm < r.go || r.pens === 'L').length;
    const [h1, h2] = headline(t, p);
    const o2 = SIM.ovr(p);
    const up = SIM.attrKeys(p).map((k) => [k, p.attrs[k] - (t.attrs[k] || p.attrs[k])]).filter(([, v]) => v >= 0.1).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const notable = rs.filter((r) => r.fx.important || r.goals || r.assists || r.rating >= 8 || r.fx.intl || r.injured);
    const row = (r) => {
      const res = r.gm > r.go || r.pens === 'W' ? 'W' : r.gm < r.go || r.pens === 'L' ? 'L' : 'D';
      const me = r.mins ? `${r.goals ? `<b>${r.goals}골</b> ` : ''}${r.assists ? `<b>${r.assists}도움</b> ` : ''}${ratingTag(r.rating)}${r.rating >= 8 ? ' <span class="mom">MOM</span>' : ''}` : `<span class="muted">${roleKo[r.role]}</span>`;
      return `<div class="mrow"><span class="res ${res}">${{ W: '승', D: '무', L: '패' }[res]}</span><span class="mo">${r.fx.intl ? '대표팀 · ' : ''}${esc(r.fx.opp)} ${r.gm}:${r.go}${r.fx.tag ? ` <span class="red small">${esc(r.fx.tag)}</span>` : ''}</span><span class="mm">${me}</span></div>`;
    };
    const date = `${t.year}년 ${t.from === 1 ? '봄' : '가을'}`;
    render(`${top(`${t.year} 시즌 · ${t.from}~${Math.min(t.to, 12)}주`, SIM.actionName(G, t.action))}
      <div class="news"><div class="mast"><b>등번호 일보</b><span>${date}</span></div>
        <h2 class="hl">${esc(h1)}</h2><p class="sub">${esc(h2)}</p></div>
      <div class="kpis">
        <div><span>경기</span><b>${played.length}<small>/${club.length}</small></b></div>
        <div><span>골</span><b>${g}</b></div><div><span>도움</span><b>${as}</b></div>
        <div><span>평점</span><b>${avg ? avg.toFixed(2) : '-'}</b></div>
        <div><span>MOM</span><b>${mom}</b></div>
      </div>
      <div class="ovrline">OVR <b id="ovrA">${t.ovr}</b>${o2 !== t.ovr ? ` → <b class="red" id="ovrB">${o2}</b>` : ''}<span class="small"> ${up.map(([k, v]) => `${SIM.ATTR_NAMES[k]} +${v.toFixed(1)}`).join(' · ')}</span></div>
      <h3>주요 경기 <span class="small">팀 ${w}승 ${club.length - w - l}무 ${l}패</span></h3>
      ${notable.slice(-8).map(row).join('') || '<p class="muted" style="font-size:13px">눈에 띄는 경기는 없었다.</p>'}
      ${next()}`);
    if (o2 > t.ovr) { Sound.play('goal'); const b = $app.querySelector('#ovrB'); b.classList.add('pop'); }
    else Sound.play('page');
    await choose();
  }

  // ── 허브
  let hubTab = 'week';
  async function hub() {
    for (;;) {
      const p = G.p, S = G.season, club = D.CLUBS[p.club];
      const ovr = SIM.ovr(p);
      const notices = [];
      if (p.injury > 0) notices.push(`<div class="notice">부상 중. ${p.injury}주 더 쉬어야 한다. 이번 주는 휴식이나 영상 분석만 할 수 있다.</div>`);
      if (p.military) notices.push(`<div class="notice info">군 복무 중. 전역까지 ${p.military.weeksLeft}주.</div>`);
      if (p.loan) notices.push(`<div class="notice info">${clubName(p.loan.from)}에서 임대 중. 시즌이 끝나면 돌아간다.</div>`);
      if (S.called && [3, 7, 10].includes(G.week)) notices.push('<div class="notice info">이번 주 대표팀 소집. 평가전 2경기가 잡혀 있다.</div>');
      if (!p.exempt && !p.militaryDone && !p.military && p.age >= 25 && SIM.isPro(G)) notices.push(`<div class="notice">병역: ${27 - p.age >= 0 ? `${27 - p.age + 1}시즌 안에 면제를 받지 못하면 입대` : '이번 시즌 뒤 입대'}</div>`);
      const plan = SIM.weekPlan(G);
      const bar = (label, v, warn) => `<span class="lab">${label}</span><span class="bar ${warn ? 'warn' : ''}"><i style="width:${Math.round(v)}%"></i></span><span class="v">${Math.round(v)}</span>`;
      const acts = Object.entries(SIM.ACTIONS).filter(([k, a]) => !a.pro || SIM.isPro(G));
      const injured = p.injury > 0;

      let body = '';
      if (hubTab === 'week') {
        body = `
          <div class="turnhint">이번 턴: ${G.week}~${G.week <= 6 ? 6 : 12}주를 한 번에 진행한다. 큰 경기와 소식이 있을 때만 멈춘다.</div>
          <div class="plan">${plan.map((x) => `<div class="ln"><span>${x.label}</span>${x.comp === 'cup' && /4강|결승/.test(x.label) ? '<span class="tag">큰 경기</span>' : ''}</div>`).join('')}</div>
          <div class="acts">${acts.map(([k, a], i) => `<button class="act ${acts.length % 2 && i === acts.length - 1 ? 'wide' : ''}" data-v="${k}" ${injured && ['train', 'focus', 'special', 'setpiece'].includes(k) ? 'disabled' : ''}>
            <span data-px="icon" data-name="${a.icon}" data-scale="2"></span><span><span class="t">${SIM.actionName(G, k)}</span><span class="d">${a.desc}</span></span></button>`).join('')}</div>
          ${SIM.isPro(G) ? `<div class="mss">${SIM.nextMilestones(G).slice(0, 3).map((m) => `<div class="msr"><span>${m.label}</span><span class="bar"><i style="width:${Math.round(m.ratio * 100)}%"></i></span><span class="small">${m.v}/${m.n}</span></div>`).join('')}</div>` : ''}
          ${SIM.canTalk(G) ? '<button class="btn slim talk" data-v="talk"><span class="t">감독 면담</span><span class="d">훈련과 별개. 4주에 한 번</span></button>' : ''}`;
      } else if (hubTab === 'attrs') body = attrsPanel();
      else if (hubTab === 'season') body = seasonPanel();
      else if (hubTab === 'career') body = careerPanel();
      else body = menuPanel();

      render(`${top(`${G.year} 시즌 · ${G.week}주차 / 12`, `${stageLabel(p)} · ${leagueName(p.club)}`)}
        <div class="card pcard">
          <div class="spr"><span data-px="player" data-scale="3"></span></div>
          <div class="info">
            <div class="name">${esc(p.name)}${p.flags.captain ? ' <span class="cap">C</span>' : ''}</div>
            <div class="clubline"><span data-px="badge" data-club="${p.club}" data-scale="1"></span><span>${club.name}</span></div>
            <div class="nums"><span class="ovr">${ovr}</span><span class="kv">등번호<br><b>${p.squadNo}</b></span><span class="kv">${SIM.POS[p.pos]}<br><b>${p.age}세</b></span></div>
            <div class="bars">${bar('피로', p.fatigue, p.fatigue >= 60)}${bar('신뢰', p.trust)}${bar('인기', p.pop)}</div>
          </div>
        </div>
        ${notices.join('')}
        ${body}
        <div class="tabs">${[['week', '이번 주'], ['attrs', '능력치'], ['season', '시즌'], ['career', '커리어'], ['menu', '메뉴']].map(([k, l]) => `<button data-v="tab:${k}" class="${hubTab === k ? 'on' : ''}">${l}</button>`).join('')}</div>`);

      const v = await choose();
      if (v.startsWith('tab:')) { hubTab = v.slice(4); continue; }
      if (v === 'quit') return { action: 'quit' };
      if (v === 'sound') { Sound.on = settings.sound = !settings.sound; store.set('settings', settings); continue; }
      if (v === 'code') { save(); await codeScreen(true); continue; }
      if (v === 'help') { await helpScreen(); continue; }
      if (v === 'talk') { await talkScreen(); save(); continue; }
      if (v === 'retire') {
        render(`${top('은퇴')}<div class="paper"><div class="kicker">${G.year} 시즌 · ${G.week}주차</div><h2>정말 축구화를 벗을까?</h2>
          <p>${p.age}세. 지금까지의 기록으로 명예의 전당에 오르고 이 저장 칸은 비워진다. 되돌릴 수 없다.</p></div>
          <div class="btn-row"><button class="btn" data-v="no">아직 아니다</button><button class="btn primary" data-v="yes">은퇴한다</button></div>`);
        if ((await choose()) === 'yes') { await SIM.retireNow(G, io); return { action: 'retired' }; }
        continue;
      }
      if (v === 'focus') {
        const k = await focusPicker();
        if (!k) continue;
        hubTab = 'week';
        return { action: 'focus', focus: k };
      }
      if (SIM.ACTIONS[v]) { hubTab = 'week'; return { action: v }; }
    }
  }

  async function talkScreen() {
    const opts = SIM.talkOptions(G);
    render(`${top('감독 면담', clubName(G.p.club))}
      <div class="paper"><div class="kicker">감독실</div><h2>무슨 이야기를 할까</h2><p>감독 신뢰 ${Math.round(G.p.trust)}. 한번 이야기하면 4주 뒤에 다시 찾아갈 수 있다.</p></div>
      ${opts.map((o) => `<button class="btn" data-v="${o.key}"><span class="t">${esc(o.label)}</span><span class="d">${esc(o.sub)}</span></button>`).join('')}
      <button class="btn slim center" data-v="cancel">그냥 나간다</button>`);
    const v = await choose();
    if (v === 'cancel') return;
    const r = SIM.talk(G, v);
    await messageScreen('감독실', r.ok ? '면담 결과' : '면담 결과', esc(r.text));
  }

  async function negotiateScreen(d) {
    const o = d.offer, c = D.CLUBS[o.club];
    render(`${top('협상', c.name)}
      <div class="paper"><div class="kicker">${esc(leagueName(c.id))} · ${o.kind === 'loan' ? '임대' : '이적'}</div><h2>${esc(c.name)}</h2>
        <p>${esc(o.role)} · 등번호 ${o.number} · ${o.years}년. 사인하기 전에 조건을 걸어 볼 수 있다. 너무 세게 나가면 구단이 발을 뺄 수도 있다.</p></div>
      ${d.demands.map((x, i) => `<button class="btn" data-v="${i}"><span class="t">${esc(x.label)}</span><span class="d">${esc(x.sub)}</span></button>`).join('')}`);
    return +(await choose());
  }

  async function focusPicker() {
    const p = G.p;
    render(`${top('집중 훈련', '능력치 하나')}
      <p class="muted" style="margin:4px 0 10px;font-size:13px">고른 능력치가 기본 훈련의 두 배 넘게 오른다. 나머지는 거의 그대로다. 피로가 많이 쌓인다.</p>
      ${SIM.attrKeys(p).map((k) => `<button class="btn slim" data-v="${k}"><span class="between"><span class="t">${SIM.ATTR_NAMES[k]}</span><span class="px">${Math.floor(p.attrs[k])}</span></span></button>`).join('')}
      <button class="btn slim center" data-v="cancel">취소</button>`);
    const v = await choose();
    return v === 'cancel' ? null : v;
  }

  function attrsPanel() {
    const p = G.p;
    const rows = SIM.attrKeys(p).map((k) => {
      const v = p.attrs[k];
      return `<div class="attr"><span class="lab">${SIM.ATTR_NAMES[k]}</span><span class="bar"><i style="width:${v}%"></i></span><span class="n">${Math.floor(v)}</span></div>`;
    }).join('');
    return `<h3>능력치</h3>${rows}
      <div class="attr"><span class="lab">멘탈</span><span class="bar"><i style="width:${p.mental}%"></i></span><span class="n">${Math.floor(p.mental)}</span></div>
      <div class="attr"><span class="lab">세트피스</span><span class="bar"><i style="width:${p.sp || 45}%"></i></span><span class="n">${Math.floor(p.sp || 45)}</span></div>
      <p class="small" style="margin-top:6px">${[p.flags.captain && '주장', p.flags.taker && '세트피스 전담 키커'].filter(Boolean).join(' · ') || '맡은 역할 없음'}</p>
      <h3>특성 ${Object.keys(p.traits || {}).length}/${SIM.TRAITS.length}</h3>
      <div class="traits">${SIM.TRAITS.map((t) => (p.traits && p.traits[t.id]) ? `<div class="tr on"><b>${t.name}</b><span>${t.desc}</span></div>` : `<div class="tr"><b>???</b><span>아직 열리지 않았다</span></div>`).join('')}</div>
      <p class="muted" style="font-size:13px;margin:8px 0 0">${SIM.potentialComment(p)}</p>
      <p class="muted" style="font-size:13px;margin:4px 0 0">${SIM.workComment(p)}</p>
      <p class="small" style="margin-top:6px">A매치 ${p.intl.caps}경기 ${p.intl.goals}골 · 연령별 대표 ${p.intl.youthCaps}경기${p.exempt ? ' · 병역 면제' : p.militaryDone ? ' · 병역 마침' : ''}</p>`;
  }

  function seasonPanel() {
    const S = G.season, p = G.p;
    const avg = SIM.avg(S.ratings);
    const log = S.log.slice(-12).reverse();
    return `<h3>${G.year} 시즌 · ${clubName(S.club)}</h3>
      <table><tr><th>경기</th><th>선발</th><th>골</th><th>도움</th>${p.pos === 'GK' || p.pos === 'DF' ? '<th>무실점</th>' : ''}<th>평점</th></tr>
      <tr><td>${S.apps}</td><td>${S.starts}</td><td>${S.goals}</td><td>${S.assists}</td>${p.pos === 'GK' || p.pos === 'DF' ? `<td>${S.cs}</td>` : ''}<td>${avg ? avg.toFixed(2) : '-'}</td></tr></table>
      <p class="small" style="margin:6px 0">리그 ${S.lg.w}승 ${S.lg.d}무 ${S.lg.l}패 · 승점 ${S.lg.pts}${S.cont ? ` · ${D.CONTINENTAL[D.LEAGUES[D.CLUBS[S.club].league].cont].short} ${S.cont.alive ? '진행 중' : S.cont.won ? '우승' : '탈락'}` : ''}</p>
      <h3>최근 경기</h3>
      <table>${log.map((l) => `<tr><td class="l">${l.w}주 · ${esc(l.opp)}</td><td><span class="res ${l.gm > l.go ? 'W' : l.gm < l.go ? 'L' : 'D'}">${l.gm > l.go ? '승' : l.gm < l.go ? '패' : '무'}</span>${l.gm}:${l.go}</td><td>${l.r == null ? roleKo[l.role] : `${l.g ? l.g + '골 ' : ''}${l.a ? l.a + '도움 ' : ''}${l.r.toFixed(1)}`}</td></tr>`).join('') || '<tr><td class="l muted">아직 경기가 없다</td></tr>'}</table>`;
  }

  function careerPanel() {
    const p = G.p;
    const rows = p.career.map((c) => `<tr><td class="l">${c.year} ${c.partial ? '<span class="small">(전반기)</span>' : ''}<br><span class="small">${esc(c.clubName)}${c.loan ? ' 임대' : ''}</span></td><td>${c.apps}</td><td>${c.goals}</td><td>${c.assists}</td><td>${c.avg ? c.avg.toFixed(2) : '-'}</td><td>${c.rank || '-'}</td></tr>`).join('');
    const trophies = p.trophies.map((t) => `<figure><span data-px="trophy" data-name="${trophyIcon(t.name)}" data-scale="2"></span><figcaption>${t.year}<br>${esc(t.name)}</figcaption></figure>`).join('');
    return `<h3>시즌별 기록</h3>
      <table><tr><th>시즌</th><th>경기</th><th>골</th><th>도움</th><th>평점</th><th>순위</th></tr>${rows || '<tr><td class="l muted">첫 시즌 진행 중</td></tr>'}</table>
      <h3>트로피 ${p.trophies.length}</h3><div class="trophies">${trophies || '<span class="muted" style="font-size:13px">아직 없다</span>'}</div>
      <h3>개인상</h3><p style="font-size:13px;margin:0">${p.awards.map((a) => `${a.year} ${esc(a.name)}`).join('<br>') || '<span class="muted">아직 없다</span>'}</p>
      ${p.ballon.length ? `<h3>발롱도르</h3><p style="font-size:13px;margin:0">${p.ballon.map((b) => `${b.year} ${b.rank}위`).join(' · ')}</p>` : ''}`;
  }

  function menuPanel() {
    return `<h3>메뉴</h3>
      <button class="btn slim" data-v="sound"><span class="t">소리 ${settings.sound ? '끄기' : '켜기'}</span></button>
      <button class="btn slim" data-v="code"><span class="t">세이브 코드</span><span class="d">지금 커리어를 텍스트로 백업</span></button>
      <button class="btn slim" data-v="help"><span class="t">게임 설명</span></button>
      <button class="btn slim" data-v="quit"><span class="t">저장하고 타이틀로</span><span class="d">매 주차가 끝날 때마다 자동 저장된다</span></button>
      <button class="btn slim" data-v="retire"><span class="t">지금 은퇴하기</span><span class="d">나이와 상관없이 여기서 커리어를 끝낸다</span></button>`;
  }

  function trophyIcon(name) {
    if (name.includes('발롱')) return 'ballon';
    if (name.includes('월드컵')) return 'worldcup';
    if (name.includes('아시안컵')) return 'asiancup';
    if (name.includes('챔피언스리그')) return 'continental';
    if (name.includes('아시안게임') || name.includes('올림픽')) return 'asiancup';
    if (/컵|배|포칼|코파|쿠프|타사|왕중왕전|선수권/.test(name)) return 'cup';
    return 'league';
  }

  async function helpScreen() {
    render(`${top('게임 설명')}
      <div class="paper"><p>
        한 시즌은 12주다. 한 주에 리그 경기를 묶어서 치르고, 컵·대륙 대회·대표팀 경기가 끼어든다.<br><br>
        <b>출전</b>은 능력치, 감독 신뢰, 피로로 정해진다. 큰 팀 벤치에 앉으면 이름값은 오르지만 성장이 느려진다.<br><br>
        <b>큰 경기</b>(데뷔전, 빅매치, 4강 이상, 대표팀)에서는 직접 패스·드리블·슛을 고른다. 확률은 보여 주지 않는다. 힌트를 읽자. 영상 분석을 하면 힌트가 하나 더 붙는다.<br><br>
        <b>병역</b>: 만 27세 시즌이 끝날 때까지 아시안게임 금메달이나 올림픽 메달을 따지 못하면 상무에서 1년 반을 뛴다. 실제 제도는 게임에 맞게 단순화했다.<br><br>
        <b>등번호</b>: 팀 내 입지가 오르면 9번, 10번 같은 번호를 받는다.
      </p></div>
      <p class="foot">클럽·리그·대회 명칭의 권리는 각 권리자에게 있습니다. 엠블럼 대신 기본 배지를 쓰며, emblems 폴더에 클럽ID.png를 넣으면 개인적으로 바꿔 볼 수 있습니다. 등장 선수는 모두 가상 인물입니다.</p>
      ${next('닫기')}`);
    await choose();
  }

  // ── 경기 결과
  async function weekScreen(d) {
    const p = G.p;
    const rows = d.results.map((r) => {
      const fx = r.fx;
      const res = r.gm > r.go || r.pens === 'W' ? 'W' : r.gm < r.go || r.pens === 'L' ? 'L' : 'D';
      const resKo = { W: '승', D: '무', L: '패' }[res];
      let me;
      if (r.mins) me = `${roleKo[r.role]} ${r.mins}분${r.goals ? ` · <b>${r.goals}골</b>` : ''}${r.assists ? ` · <b>${r.assists}도움</b>` : ''}${p.pos === 'GK' && r.saves ? ` · 선방 ${r.saves}` : ''} ${ratingTag(r.rating)}`;
      else me = p.injury > 0 && r.role === 'out' ? '부상으로 결장' : roleKo[r.role];
      if (r.injured) me += ` <span class="red">· 부상 ${r.injured}주</span>`;
      return `<div class="match"><div class="head"><span class="comp">${esc(fx.round)}${fx.tag ? ` · <span class="red">${esc(fx.tag)}</span>` : ''}</span></div>
        <div class="head"><span class="opp"><span class="res ${res}">${resKo}</span>${fx.intl ? '대한민국' : clubName(G.season.club)} vs ${esc(fx.opp)}</span><span class="sc">${r.gm} : ${r.go}${r.pens ? ` <span class="small">(승부차기 ${r.pens === 'W' ? '승' : '패'})</span>` : ''}</span></div>
        <div class="me">${me}</div></div>`;
    }).join('');
    const before = G._before;
    let gains = '';
    if (before) {
      const up = SIM.attrKeys(p).map((k) => [k, p.attrs[k] - before.attrs[k]]).filter(([, v]) => v >= 0.05).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const o2 = SIM.ovr(p);
      gains = `<div class="gains">${up.length ? '이번 주 ' + up.map(([k, v]) => `${SIM.ATTR_NAMES[k]} +${v.toFixed(1)}`).join(' · ') : '이번 주는 성장 없음'}${o2 !== before.ovr ? ` · <b class="red">OVR ${before.ovr} → ${o2}</b>` : ''}</div>`;
    }
    const actName = SIM.ACTIONS[d.action] ? SIM.actionName(G, d.action) : '';
    render(`${top(`${G.week}주차 결과`, actName)}${rows || '<p class="muted">이번 주는 경기가 없었다.</p>'}${gains}${next()}`);
    if (d.results.some((r) => r.goals)) Sound.play('goal');
    else Sound.play('whistle');
    await choose();
  }

  // ── 경기 장면
  let cur = null; // 지금 진행 중인 기회 (머리말·피치 재사용)
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  function chanceHead(d) {
    const fx = d.fx;
    const myName = fx.intl ? '대한민국' : D.CLUBS[G.season.club].short;
    const sc = d.score || [0, 0];
    return `${top(esc(fx.round), `vs ${esc(fx.opp)}`)}
      ${fx.tag ? `<span class="tagline">${esc(fx.tag)}</span>` : ''}
      <div class="scene-top"><span class="min">${d.minute}′</span><span class="score">${esc(myName)} ${sc[0]} : ${sc[1]} ${esc(fx.opp)}</span></div>`;
  }

  function animatePitch(canvas, from, to, ms = 520) {
    if (!from) { PX.drawPitch(canvas, to, 4); return Promise.resolve(); }
    const pt = (a, b, t) => (a && b ? [lerp(a[0], b[0], t), lerp(a[1], b[1], t)] : b);
    const arr = (A, B, t) => (B || []).map((b, i) => (A && A[i] ? pt(A[i], b, t) : b));
    return new Promise((res) => {
      const t0 = performance.now();
      const frame = (now) => {
        const t = ease(Math.min(1, (now - t0) / ms));
        PX.drawPitch(canvas, { me: pt(from.me, to.me, t), ball: pt(from.ball, to.ball, t), gk: pt(from.gk, to.gk, t),
          mates: arr(from.mates, to.mates, t), opps: arr(from.opps, to.opps, t), trail: t >= 1 ? to.trail : null }, 4);
        if (t < 1) requestAnimationFrame(frame); else res();
      };
      requestAnimationFrame(frame);
    });
  }

  async function beatScreen(d) {
    const b = d.beat;
    cur = { fx: d.fx, minute: d.minute, score: d.score, pitch: b.pitch };
    render(`${chanceHead(d)}
      <div class="pitch"><canvas id="pitch" width="384"></canvas></div>
      ${d.lead ? `<p class="lead">${esc(d.lead)}</p>` : ''}
      <p class="situ">${esc(b.text)}</p>
      <ul class="hints">${b.hints.map((h) => `<li class="${h.startsWith('분석') ? 'tip' : ''}">${esc(h)}</li>`).join('')}</ul>
      <div class="opts4 ${b.options.length % 2 ? 'odd' : ''}">${b.options.map((o, i) => `<button class="btn opt" data-v="${i}"><span class="t">${esc(o.label)}</span>${o.sub ? `<span class="d">${esc(o.sub)}</span>` : ''}</button>`).join('')}</div>`);
    const cv = $app.querySelector('#pitch');
    if (d.step === 0) Sound.play('whistle');
    await animatePitch(cv, d.prevPitch, b.pitch);
    return +(await choose());
  }

  // 게이지: 바늘이 왕복한다. 누른 순간의 위치로 timing(0~1)을 돌려준다.
  function runGauge(gaugeEl, period) {
    const needle = gaugeEl.querySelector('.needle');
    let stopped = false, pos = 0;
    const t0 = performance.now();
    const loop = (now) => {
      if (stopped) return;
      const ph = ((now - t0) / period) % 2;
      pos = ph < 1 ? ph : 2 - ph;
      needle.style.left = (pos * 100) + '%';
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => { stopped = true; return Math.max(0, 1 - Math.abs(pos - 0.5) * 2); };
  }
  function gaugeHtml(w, label) {
    return `<div class="gauge" id="gauge"><div class="sweet" style="left:${(0.5 - w / 2) * 100}%;width:${w * 100}%"></div><div class="needle"></div></div>
      <button class="btn primary center big" id="go" data-act="go">${label}</button>`;
  }
  function waitTap(sel) {
    return new Promise((res) => {
      $app.onclick = (e) => { const b = e.target.closest(sel); if (!b) return; $app.onclick = null; res(b); };
    });
  }

  function oppKeeperSpec(fx) {
    const c = fx.oppId && D.CLUBS[fx.oppId];
    const prim = c ? (PX.luma(c.colors[0]) > 150 ? '#2E2E2E' : '#2E8B57') : '#2E8B57';
    return { skin: 1, hairStyle: 0, hairColor: 0, gk: true, kit: { primary: prim, secondary: '#1E1E1E', pattern: 'solid', shorts: '#1E1E1E', socks: prim } };
  }

  // 반복 애니메이션. 돌려받은 함수를 부르면 멈춘다
  function loop(fn) {
    let on = true;
    const t0 = performance.now();
    const f = (now) => { if (!on) return; fn(now - t0); requestAnimationFrame(f); };
    requestAnimationFrame(f);
    return () => { on = false; };
  }
  const crowdOf = (fx) => {
    const c = fx.oppId && D.CLUBS[fx.oppId];
    const mine = fx.intl ? ['#C8352B', '#F2EBDD'] : D.CLUBS[G.season.club].colors;
    return { colors: c ? [c.colors[0], c.colors[1], mine[0], mine[1]] : ['#C8352B', '#1F4E9C', '#F2EBDD', '#E0C341'] };
  };
  const GW = 96, GX0 = 14, GX1 = 81;
  const quality = (t, w) => (t >= 1 - w ? (t >= 1 - w / 3 ? '완벽!' : '좋아!') : t >= 0.5 ? '조금 빗맞았다' : '완전히 빗맞았다');

  async function shotScreen(d) {
    const sp = d.spec, type = sp.type;
    const mech = type === 'header' ? 'ring' : type === 'chip' ? 'rush' : type === 'placed' || type === 'free' ? 'curve' : 'charge';
    const keeper = oppKeeperSpec(d.fx), keeperKey = 'opp' + (d.fx.oppId || 'n');
    const shooter = PX.playerBackCanvas(spec('stand'), G.p.squadNo, 1);
    const crowd = crowdOf(d.fx);
    const allowed = type === 'chip' ? [0, 1, 2] : [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const title = { charge: type === 'pk' ? '페널티킥' : type === 'volley' ? '발리슛' : '강슛', curve: type === 'free' ? '프리킥 감아차기' : '감아차기', ring: '헤더', rush: '칩슛' }[mech];
    render(`${chanceHead(Object.assign({}, cur, d))}
      ${d.lead ? `<p class="lead">${esc(d.lead)}</p>` : ''}
      <div class="goalview"><canvas id="goal"></canvas>
        <div class="zones">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((z) => `<button class="zone ${allowed.includes(z) ? '' : 'off'}" data-z="${z}" ${allowed.includes(z) ? '' : 'disabled'}></button>`).join('')}</div>
        <div class="mtag">${title}</div></div>
      <p class="situ" id="msg">${type === 'chip' ? '골키퍼 머리 위, 위쪽 칸 중 하나를 고르기' : '어디로 찰까? 골문을 눌러 조준'}</p>
      <div id="ctl"></div>`);
    const cv = $app.querySelector('#goal');
    const st = { keeper, keeperKey, gk: { x: 48, y: 46 }, crowd, shooter, shooterX: 18, shooterY: 10, ball: [40, 52, 3] };
    let stopIdle = loop((t) => {
      st.crowd.t = t;
      st.gk.x = 48 + Math.sin(t / (type === 'pk' ? 260 : 600)) * (type === 'pk' ? 4 : 1.5);
      PX.drawGoal(cv, st, 4);
    });
    const zb = await waitTap('[data-z]:not([disabled])');
    const aim = +zb.dataset.z;
    Sound.play('click');
    $app.querySelectorAll('.zone').forEach((b) => b.classList.toggle('on', b === zb));
    st.zone = aim;
    const [tx, ty] = PX.zoneCenter(aim);
    const w = sp.width;
    const ctl = $app.querySelector('#ctl'), msg = $app.querySelector('#msg');
    let timing = 0;

    if (mech === 'charge') {
      msg.textContent = '버튼을 꾹 누르고 있다가 초록 칸에서 떼기';
      const target = 0.78;
      ctl.innerHTML = `<div class="power"><div class="sweet" style="left:${(target - w / 2) * 100}%;width:${w * 100}%"></div><i id="pw"></i></div>
        <button class="btn primary center big hold" id="hold">꾹 눌러서 힘 모으기</button>`;
      const pw = $app.querySelector('#pw'), hold = $app.querySelector('#hold');
      timing = await new Promise((res) => {
        let v = 0, stop = null, start = 0;
        const down = (e) => {
          e.preventDefault();
          if (stop) return;
          start = performance.now();
          hold.textContent = '떼면 찬다';
          stop = loop((t) => { const ph = (t / 900) % 2; v = ph < 1 ? ph : 2 - ph; pw.style.width = (v * 100) + '%'; st.shooterY = 10 - v * 2; });
        };
        const up = (e) => {
          e.preventDefault();
          if (!stop) { down(e); }
          if (performance.now() - start < 60 && !e.forceRelease) { setTimeout(() => up(Object.assign({ preventDefault() {} }, { forceRelease: true })), 120); return; }
          stop(); hold.onpointerdown = hold.onpointerup = hold.onpointerleave = null;
          res(Math.max(0, 1 - Math.abs(v - target) * 2));
        };
        hold.onpointerdown = down;
        hold.onpointerup = up;
        hold.onpointerleave = (e) => { if (stop) up(e); };
      });
    } else if (mech === 'curve') {
      msg.textContent = '휘어지는 궤적 끝이 노린 칸에 닿을 때 누르기';
      ctl.innerHTML = '<button class="btn primary center big" id="go">감아 찬다!</button>';
      let ex = GX0;
      const gw = GX1 - GX0;
      const stopC = loop((t) => {
        const ph = (t / 1100) % 2;
        const u = ph < 1 ? ph : 2 - ph;
        ex = GX0 + u * gw;
        const pts = [];
        for (let i = 0; i <= 24; i++) {
          const k = i / 24;
          const cx = 40 + (ex - 40) * k + Math.sin(k * Math.PI) * (ex > 48 ? -14 : 14);
          const cy = 52 + (ty - 52) * k;
          pts.push([cx, cy]);
        }
        st.trail = pts; st.trailEnd = true;
      });
      await waitTap('#go');
      stopC();
      timing = Math.max(0, 1 - Math.abs(ex - tx) / (gw / 2));
    } else if (mech === 'ring') {
      msg.textContent = '줄어드는 원이 안쪽 원과 겹칠 때 누르기';
      ctl.innerHTML = '<button class="btn primary center big" id="go">헤더!</button>';
      let r = 18;
      const ringCv = document.createElement('div');
      ringCv.className = 'ring';
      const gv = $app.querySelector('.goalview');
      gv.appendChild(ringCv);
      ringCv.style.left = (tx / GW * 100) + '%';
      ringCv.style.top = (ty / 56 * 100) + '%';
      ringCv.innerHTML = '<i class="outer"></i><i class="inner"></i>';
      const outer = ringCv.querySelector('.outer');
      const stopR = loop((t) => { r = 18 - ((t / 950) % 1) * 18; outer.style.width = outer.style.height = (r * 2 * 4) + 'px'; });
      await waitTap('#go');
      stopR();
      timing = Math.max(0, 1 - Math.abs(r - 4) / 14);
      ringCv.remove();
    } else {
      msg.textContent = '골키퍼가 달려 나온다. 충분히 가까워졌을 때 누르기';
      ctl.innerHTML = '<button class="btn primary center big" id="go">칩슛!</button>';
      let scl = 1;
      stopIdle();
      const stopU = loop((t) => {
        const u = Math.min(1, t / 1300);
        scl = 1 + u * 1.1;
        st.crowd.t = t;
        st.gk = { x: 48, y: 46 + u * 8, scale: scl };
        PX.drawGoal(cv, st, 4);
      });
      stopIdle = stopU;
      const tapped = await Promise.race([waitTap('#go').then(() => true), wait(1500).then(() => false)]);
      $app.onclick = null;
      timing = tapped ? Math.max(0, 1 - Math.abs(scl - 1.75) / 0.6) : 0.05;
    }
    stopIdle();
    msg.textContent = quality(timing, w);
    msg.classList.add(timing >= 1 - w ? 'hit' : 'miss');
    Sound.play('kick');
    await wait(420);
    return { aim, timing };
  }

  async function diveScreen(d) {
    const sp = d.spec;
    const keeper = spec('stand'), keeperKey = 'me' + G.p.look.skin + G.p.look.hairStyle + G.p.look.hairColor + G.p.club;
    const c = d.fx.oppId && D.CLUBS[d.fx.oppId];
    const oppKit = c ? kitFor(c.id) : { primary: '#1F4E9C', secondary: '#F2EBDD', pattern: 'solid', shorts: '#F2EBDD', socks: '#1F4E9C' };
    const shooterCv = PX.playerBackCanvas({ skin: 2, hairStyle: 2, hairColor: 0, kit: oppKit }, 9, 1);
    const crowd = crowdOf(d.fx);
    render(`${chanceHead(Object.assign({}, cur, d))}
      ${d.lead ? `<p class="lead">${esc(d.lead)}</p>` : ''}
      <div class="goalview"><canvas id="goal"></canvas>
        <div class="zones">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((z) => `<button class="zone" data-z="${z}"></button>`).join('')}</div>
        <div class="mtag">${sp.dist === 'pk' ? '페널티킥 선방' : '선방'}</div></div>
      <p class="situ" id="msg">키커가 달려온다. 차기 직전에 몸을 날릴 칸을 누르기</p>
      ${d.hints ? `<ul class="hints">${d.hints.map((h) => `<li class="${h.startsWith('분석') ? 'tip' : ''}">${esc(h)}</li>`).join('')}</ul>` : ''}
      <div class="runup"><i id="ru"></i></div>`);
    const cv = $app.querySelector('#goal');
    const ru = $app.querySelector('#ru');
    const st = { keeper, keeperKey, gk: { x: 48, y: 46 }, crowd, ball: [48, 50, 2] };
    const T = 1500;
    let prog = 0;
    const stop = loop((t) => {
      prog = t / T;
      st.crowd.t = t;
      const k = Math.min(1, prog);
      st.shooter = shooterCv; st.shooterX = 30 + k * 10; st.shooterY = 16 - k * 10;
      st.ball = [48, 48, 2];
      st.gk.x = 48 + Math.sin(t / 180) * 2;
      ru.style.width = Math.min(100, k * 100) + '%';
      PX.drawGoal(cv, st, 4);
    });
    const res = await Promise.race([waitTap('[data-z]').then((b) => ({ zone: +b.dataset.z, p: prog })), wait(T * 1.12).then(() => null)]);
    $app.onclick = null;
    stop();
    let zone = 4, timing = 0;
    if (res) { zone = res.zone; timing = res.p <= 1 ? res.p : Math.max(0, 1 - (res.p - 1) * 6); }
    $app.querySelectorAll('.zone').forEach((b) => b.classList.toggle('on', +b.dataset.z === zone));
    const msg = $app.querySelector('#msg');
    msg.textContent = res ? (timing >= 1 - sp.width ? '타이밍 완벽!' : timing < 0.6 ? '너무 일찍 움직였다' : '조금 일렀다') : '반응하지 못했다';
    msg.classList.add(timing >= 1 - sp.width ? 'hit' : 'miss');
    await wait(380);
    return { zone, timing };
  }

  // 화면 전체 축하 연출
  function celebrate(word, line, colors, big) {
    return new Promise((res) => {
      const o = document.createElement('div');
      o.className = 'celebrate' + (big ? ' big' : '') + (word.length > 3 ? ' long' : '');
      o.innerHTML = `<canvas></canvas><div class="cb-word">${word}</div><div class="cb-line">${esc(line)}</div>`;
      document.body.appendChild(o);
      $app.classList.add('shake');
      const cv = o.querySelector('canvas');
      cv.width = Math.min(innerWidth, 480); cv.height = innerHeight;
      const ctx = cv.getContext('2d');
      const bits = Array.from({ length: big ? 90 : 50 }, () => ({ x: Math.random() * cv.width, y: -Math.random() * cv.height * 0.6, v: 2 + Math.random() * 4, s: 4 + Math.floor(Math.random() * 3) * 2, c: colors[Math.floor(Math.random() * colors.length)], w: Math.random() * 6 }));
      const stop = loop((t) => {
        ctx.clearRect(0, 0, cv.width, cv.height);
        bits.forEach((b) => { b.y += b.v; b.x += Math.sin((t + b.w * 300) / 300) * 0.8; ctx.fillStyle = b.c; ctx.fillRect(Math.round(b.x), Math.round(b.y), b.s, b.s); });
      });
      setTimeout(() => $app.classList.remove('shake'), 500);
      const end = () => { stop(); o.remove(); res(); };
      o.onclick = end;
      setTimeout(end, big ? 2100 : 1600);
    });
  }
  const LINES = {
    goal: (n) => [`들어갑니다아아아!`, `${n}! ${n}이(가) 해냅니다!`, '골! 골! 골!', '그물이 찢어질 것 같습니다!', '이게 들어가네요!'],
    wonder: (n) => ['말도 안 됩니다! 이걸 넣어요!', `${n}, 오늘의 골 확정입니다!`, '관중석이 무너집니다!'],
    assist: () => ['완벽한 패스!', '떠먹여 줍니다!', '보고도 믿기 어려운 패스!'],
    save: (n) => ['막아냅니다!', '슈퍼 세이브!', `${n}의 손끝이 팀을 살립니다!`],
    tackle: () => ['깔끔한 태클!', '공만 걷어냅니다!'],
  };
  const pickLine = (k) => { const a = LINES[k](G.p.name); return a[Math.floor(Math.random() * a.length)]; };

  async function tackleScreen(d) {
    const sp = d.spec;
    render(`${chanceHead(Object.assign({}, cur, d))}
      <div class="pitch"><canvas id="pitch" width="384"></canvas></div>
      ${d.lead ? `<p class="lead">${esc(d.lead)}</p>` : ''}
      <p class="situ">공격수가 공을 치는 순간을 노린다. 바늘이 가운데 칸에 올 때 누르기.</p>
      ${gaugeHtml(sp.width, '태클!')}`);
    PX.drawPitch($app.querySelector('#pitch'), d.pitch, 4);
    const stop = runGauge($app.querySelector('#gauge'), 700);
    await waitTap('#go, #gauge');
    const timing = stop();
    $app.querySelector('#gauge').classList.add(timing >= 1 - sp.width ? 'hit' : 'miss');
    Sound.play('kick');
    await wait(380);
    return { timing };
  }

  async function chanceEndScreen(d) {
    const e = d.end, m = d.mini;
    const good = e.goal || e.assist || e.saved || e.defended || e.teamGoal || (e.ok && !e.small);
    const bad = e.conceded || e.lost;
    const big = e.goal ? '골!' : e.assist ? '도움!' : e.saved ? '선방!' : e.conceded ? '실점' : e.defended ? '막았다' : e.teamGoal ? '골!' : e.lost ? '뺏겼다' : e.missed ? '빗나갔다' : e.saved0 ? '막혔다' : e.ok ? '괜찮았다' : '아쉽다';
    const pose = ['fist', 'plane', 'sky'][Math.floor(Math.random() * 3)];
    const showGoal = m && (m.kind === 'shot' || m.kind === 'dive');
    render(`${chanceHead(Object.assign({}, cur, { fx: d.fx, minute: d.minute }))}
      ${showGoal ? '<div class="goalview"><canvas id="goal"></canvas></div>' : '<div class="pitch"><canvas id="pitch" width="384"></canvas></div>'}
      <div class="outcome ${good ? 'good' : bad ? 'bad' : ''}">${e.goal || e.saved ? `<span data-px="player" data-pose="${pose}" data-scale="2"></span>` : ''}
        <div><div class="big">${big}</div>${esc(e.text || '')}</div></div>${next()}`);
    if (showGoal) {
      const cv = $app.querySelector('#goal');
      const o = m.out;
      const mine = m.kind === 'dive';
      const keeper = mine ? spec('stand') : oppKeeperSpec(d.fx);
      const keeperKey = mine ? 'me' + G.p.look.skin + G.p.look.hairStyle + G.p.look.hairColor + G.p.club : 'opp' + (d.fx.oppId || 'n');
      const target = mine ? o.shot : o.aim;
      let [tx, ty] = PX.zoneCenter(target);
      if (o.off) { const c = target % 3, r = Math.floor(target / 3); if (r === 0) ty = 4; else if (c === 0) tx = 8; else if (c === 2) tx = 88; else ty = 4; }
      const gkCol = mine ? o.zone % 3 : o.gkCol;
      const gkRow = mine ? Math.floor(o.zone / 3) : 1;
      const gx = gkCol == null ? 48 : PX.zoneCenter(gkCol)[0];
      const dive = gkCol === 0 ? -1 : gkCol === 2 ? 1 : 0;
      const t0 = performance.now(), T = o.goal ? 900 : 640;
      const trailPts = [];
      await new Promise((res) => {
        const frame = (now) => {
          const t = Math.min(1, (now - t0) / T);
          const bt = ease(t);
          let bx = lerp(48, tx, bt), by = lerp(54, ty, bt);
          if (o.saved && t > 0.8) { bx = lerp(tx, tx + (tx < 48 ? -10 : 10), (t - 0.8) * 5); by = lerp(ty, ty + 8, (t - 0.8) * 5); }
          const gy = 46 - (dive === 0 ? (gkRow === 0 ? 10 : gkRow === 1 ? 4 : 0) * Math.min(1, t * 2) : 0);
          trailPts.push([bx, by]);
          PX.drawGoal(cv, { crowd: Object.assign(crowdOf(d.fx), { t: now, cheer: t > 0.9 && (o.goal || o.saved) }), trail: trailPts.slice(-14), keeper, keeperKey, gk: { x: lerp(48, gx + (dive ? dive * -6 : 0), Math.min(1, t * 1.6)), y: gy + (dive && gkRow === 2 ? 0 : dive ? -6 * Math.min(1, t * 2) : 0), dive, t: Math.min(1, t * 1.8) },
            ball: [bx, by, lerp(4, 2, bt)], shake: (o.goal && t > 0.9) ? 1 : 0 }, 4);
          if (t < 1) requestAnimationFrame(frame); else res();
        };
        requestAnimationFrame(frame);
      });
    } else {
      PX.drawPitch($app.querySelector('#pitch'), cur && cur.pitch ? cur.pitch : { me: [48, 36] }, 4);
    }
    const colors = d.fx.intl ? ['#C8352B', '#1F4E9C', '#F2EBDD'] : D.CLUBS[G.season.club].colors.concat(['#F2EBDD']);
    if (e.goal) { Sound.play('goal'); await celebrate('골!', pickLine(e.wonder ? 'wonder' : 'goal'), colors, e.wonder || d.fx.final); }
    else if (e.assist) { Sound.play('goal'); await celebrate('도움!', pickLine('assist'), colors); }
    else if (e.saved) { Sound.play('save'); await celebrate('선방!', pickLine('save'), colors); }
    else if (e.defended && e.big) { Sound.play('kick'); await celebrate('차단!', pickLine('tackle'), colors); }
    else if (e.teamGoal) Sound.play('goal');
    else if (bad || e.missed || e.saved0) Sound.play('groan');
    await choose();
  }

  // ── 해금·각성·이적 발표
  async function unlockScreen(d) {
    const trait = d.kind === 'trait';
    render(`${top(trait ? '특성 해금' : '이정표', `${G.year} 시즌`)}
      <div class="unlock ${trait ? 'trait' : 'ms'}"><div class="kicker">${trait ? '새 특성' : '기록 달성'}</div>
        <span data-px="trophy" data-name="${trait ? 'keeper' : 'league'}" data-scale="4"></span>
        <h2>${esc(d.title)}</h2><p>${esc(d.desc)}</p></div>${next()}`);
    if (trait) await celebrate(d.title, '특성 해금', ['#E0C341', '#F2EBDD', '#C8352B'], false);
    else Sound.play('goal');
    await choose();
  }
  async function awakenScreen(d) {
    const p = G.p;
    const bar = (k, g) => `<div class="attr"><span class="lab">${SIM.ATTR_NAMES[k]}</span><span class="bar"><i class="grow" style="width:${p.attrs[k]}%"></i></span><span class="n">+${g.toFixed(1)}</span></div>`;
    render(`${top('각성', `${G.year} 시즌`)}
      <div class="unlock awaken"><div class="kicker">${esc(d.vs)}전 평점 ${d.rating.toFixed(1)}</div>
        <span data-px="player" data-pose="sky" data-scale="4"></span>
        <h2>무언가 깨어났다</h2><p>그 경기 이후로 몸이 다르게 움직인다.</p>
        ${bar(d.a, d.ga)}${bar(d.b, d.gb)}
        <div class="ovrline">OVR <b>${d.before}</b> → <b class="red pop">${d.after}</b></div></div>${next()}`);
    await celebrate('각성!', `${p.name}, 한 단계 올라섰다`, ['#E0C341', '#C8352B', '#F2EBDD'], true);
    await choose();
  }
  async function signedScreen(d) {
    const c = D.CLUBS[d.club];
    const sp = Object.assign({}, G.p.look, { kit: kitFor(c.id, G.p.pos === 'GK'), gk: G.p.pos === 'GK' });
    render(`${top('오피셜', leagueName(c.id))}
      <div class="signed"><div class="stamp">OFFICIAL</div>
        <span data-px="badge" data-club="${c.id}" data-scale="5"></span>
        <h2>${esc(c.name)}</h2>
        <div class="row" style="justify-content:center;gap:18px;margin:10px 0">
          <span data-px="player" data-pose="plane" data-scale="4" data-spec='${JSON.stringify(sp)}'></span>
          <div class="bignum"><span>등번호</span><b>${d.number}</b></div></div>
        <p>${d.kind === 'loan' ? '1년 임대' : `${d.years}년 계약`} · ${esc(d.role || '')}</p></div>${next('새 팀으로')}`);
    await celebrate('오피셜', `${G.p.name}, ${c.name} 입단`, c.colors.concat(['#F2EBDD']), true);
    await choose();
  }

  // ── 이벤트
  async function eventScreen(d) {
    render(`${top(`${G.year} 시즌 · ${G.week}주차`, '소식')}
      <div class="paper"><div class="kicker">이번 주 소식</div><h2>${esc(d.title)}</h2><p>${esc(d.text)}</p></div>
      ${d.choices.map((c, i) => `<button class="btn" data-v="${i}"><span class="t">${esc(c)}</span></button>`).join('')}`);
    Sound.play('page');
    return +(await choose());
  }
  async function messageScreen(kicker, title, text, label) {
    render(`${top(`${G.year} 시즌`, '')}
      <div class="paper"><div class="kicker">${kicker}</div><h2>${esc(title)}</h2><p>${text}</p></div>${next(label)}`);
    Sound.play('page');
    await choose();
  }

  // ── 이적·진로
  async function offersScreen(d) {
    const p = G.p;
    const head = { summer: '여름 이적 시장', winter: '겨울 이적 시장', graduate: '고3 겨울, 진로', univ: '대학 진로' }[d.when];
    const intro = {
      summer: p.contract > 0 ? `${clubName(p.club)}와 계약이 ${p.contract}년 남았다.` : `${clubName(p.club)}와 계약이 끝났다.`,
      winter: '시즌 중간. 몇몇 구단이 연락해 왔다.',
      graduate: '졸업이다. 프로에서 연락이 온 곳, 대학, 그 밖의 길.',
      univ: '대학 리그에서 1년을 보냈다.',
    }[d.when];
    const card = (o, i) => {
      const kindKo = { stay: '잔류', renew: '재계약', loan: '임대', univ: '대학 진학', retire: '은퇴', transfer: '이적' }[o.kind];
      if (o.kind === 'retire') return `<button class="btn" data-v="${i}"><span class="t">은퇴한다</span><span class="d">여기서 축구화를 벗는다</span></button>`;
      const c = D.CLUBS[o.club];
      return `<button class="btn" data-v="${i}"><span class="offer"><span data-px="badge" data-club="${c.id}" data-scale="2"></span><span class="o-main">
        <span class="o-name">${c.name}</span>
        <span class="o-sub">${leagueName(c.id)}${o.kind !== 'stay' ? ` · 전력 ${c.str}` : ''}</span><br>
        <span class="chip ${o.kind === 'stay' ? '' : o.kind === 'loan' ? 'green' : 'red'}">${kindKo}</span>${o.homecoming ? '<span class="chip green">친정팀</span>' : ''}${o.role ? `<span class="chip">${o.role}</span>` : ''}${o.number ? `<span class="chip">No.${o.number}</span>` : ''}${o.years && o.kind !== 'stay' ? `<span class="chip">${o.years}년</span>` : ''}
      </span></span></button>`;
    };
    let sel = null;
    const draw = () => {
      render(`${top(head, `OVR ${SIM.ovr(p)}`)}<p style="margin:2px 0 8px;font-size:14px">${intro}</p>
        ${d.offers.map(card).join('')}
        ${sel != null ? `<div class="bottom"><button class="btn primary center" data-v="ok"><span class="t">${d.offers[sel].kind === 'retire' ? '은퇴를 결정한다' : d.offers[sel].kind === 'stay' ? '남는다' : `${D.CLUBS[d.offers[sel].club].name}로 간다`}</span></button></div>` : ''}`);
      if (sel != null) $app.querySelectorAll('[data-v]')[sel].classList.add('primary');
    };
    draw();
    for (;;) {
      const v = await choose();
      if (v === 'ok') return sel;
      sel = +v;
      draw();
    }
  }

  // ── 시즌 결산
  async function seasonEndScreen(d) {
    const r = d.rec, S = d.S, p = G.p;
    const rv = d.rival;
    const trophies = r.trophies.map((t) => `<figure><span data-px="trophy" data-name="${trophyIcon(t)}" data-scale="2"></span><figcaption>${esc(t)}</figcaption></figure>`).join('');
    render(`${top(`${r.year} 시즌 결산`, `${r.age}세`)}
      <div class="paper"><div class="kicker">${esc(r.league)}</div><h2>${esc(r.clubName)} ${r.rank ? `· ${r.rank}위` : ''}</h2>
        <table><tr><th>경기</th><th>선발</th><th>골</th><th>도움</th>${p.pos === 'GK' || p.pos === 'DF' ? '<th>무실점</th>' : ''}<th>평점</th></tr>
        <tr><td>${r.apps}</td><td>${r.starts}</td><td>${r.goals}</td><td>${r.assists}</td>${p.pos === 'GK' || p.pos === 'DF' ? `<td>${r.cs}</td>` : ''}<td>${r.avg ? r.avg.toFixed(2) : '-'}</td></tr></table>
        ${trophies ? `<h3>트로피</h3><div class="trophies">${trophies}</div>` : ''}
        ${r.awards.length ? `<h3>개인상</h3><p>${r.awards.map(esc).join('<br>')}</p>` : ''}
        <h3>라이벌</h3><p style="font-size:14px">${rv.retired ? `${esc(rv.name)}은(는) 은퇴했다.` : `${esc(rv.name)} · ${D.CLUBS[rv.club].name} · OVR ${rv.ovr}${rv.ovr > SIM.ovr(p) ? ' <span class="red">(아직 앞서 있다)</span>' : ''}`}</p>
      </div>${next()}`);
    Sound.play('whistle');
    await choose();
  }

  async function tournamentScreen(d) {
    const rows = d.log.map((l) => {
      const res = l.gm > l.go || l.pens === 'W' ? 'W' : l.gm < l.go || l.pens === 'L' ? 'L' : 'D';
      return `<tr><td class="l">${l.round}<br><span class="small">vs ${esc(l.opp)}</span></td><td><span class="res ${res}">${{ W: '승', D: '무', L: '패' }[res]}</span>${l.gm}:${l.go}${l.pens ? '*' : ''}</td><td>${l.r == null ? roleKo[l.role] : `${l.g ? l.g + '골 ' : ''}${l.r.toFixed(1)}`}</td></tr>`;
    }).join('');
    render(`${top(d.t.name, '대한민국')}
      <div class="paper"><div class="kicker">${d.t.youth ? '연령별 대표' : 'A대표'}</div><h2>${d.finish}${d.medal ? ` · ${d.medal}메달` : ''}</h2>
      <table>${rows}</table>
      <p style="margin-top:8px;font-size:14px">${d.apps}경기 ${d.goals}골</p>
      ${d.exempt ? '<p class="red" style="margin-top:6px"><b>병역 특례.</b> 입대 걱정은 끝났다.</p>' : ''}</div>${next()}`);
    Sound.play(d.medal === '금' ? 'goal' : 'whistle');
    await choose();
  }

  async function ballonScreen(d) {
    const list = d.list.slice().reverse();
    render(`${top(`${d.year} 발롱도르`, '후보 30인')}
      <ol class="ceremony">${list.map((x, i) => {
        const rank = 30 - i;
        return `<li class="${x.me ? 'me' : ''} ${rank === 1 ? 'first' : ''}" style="animation-delay:${i * 0.12}s"><span class="rk">${rank}</span><span class="nm">${esc(x.name)}<br><span class="cl">${esc(x.club)}</span></span></li>`;
      }).join('')}</ol>
      <p style="margin-top:10px">${d.rank === 1 ? '<b class="red">발롱도르. 내 이름이 불렸다.</b>' : `내 순위는 ${d.rank}위.`}</p>${next()}`);
    if (d.rank === 1) Sound.play('goal', 3.6);
    await choose();
  }

  async function retireScreen(h) {
    render(`${top('은퇴', `${h.from}–${h.to}`)}
      <div class="paper"><div class="kicker">명예의 전당</div><h2>${esc(h.name)}</h2>
        <p>${SIM.POS[h.pos]} · ${h.age}세에 은퇴. ${esc(h.why)}</p>
        <table style="margin-top:8px"><tr><th>경기</th><th>골</th><th>도움</th><th>A매치</th><th>트로피</th></tr>
        <tr><td>${h.apps}</td><td>${h.goals}</td><td>${h.assists}</td><td>${h.caps}</td><td>${h.trophies}</td></tr></table>
        <p style="margin-top:8px;font-size:14px">${h.clubs.map(esc).join(' → ')}</p>
        <p style="margin-top:6px;font-size:14px">최고 OVR ${h.peak}${h.ballonBest ? ` · 발롱도르 최고 ${h.ballonBest}위` : ''}${h.ballonWins ? ` · <b class="red">발롱도르 ${h.ballonWins}회</b>` : ''}</p>
      </div>${next('명예의 전당에 올린다')}`);
    await choose();
  }

  async function hallScreen() {
    const hall = store.get('hall') || [];
    render(`${top('명예의 전당', `${hall.length}명`)}
      ${hall.map((h) => `<div class="paper"><div class="between"><b class="px">${esc(h.name)}</b><span class="small">${SIM.POS[h.pos]} · ${h.from}–${h.to}</span></div>
        <p style="font-size:13px;margin-top:4px">${h.apps}경기 ${h.goals}골 ${h.assists}도움 · A매치 ${h.caps} · 트로피 ${h.trophies}${h.ballonWins ? ` · 발롱도르 ${h.ballonWins}회` : h.ballonBest ? ` · 발롱 ${h.ballonBest}위` : ''}</p>
        <p class="small" style="margin-top:4px">${h.clubs.map(esc).join(' → ')}</p></div>`).join('') || '<p class="muted">아직 은퇴한 선수가 없다.</p>'}
      ${next('뒤로')}`);
    await choose();
    return title();
  }

  async function codeScreen(fromGame) {
    const code = G ? encode(G) : '';
    render(`${top('세이브 코드')}
      ${G ? `<h3>지금 커리어 내보내기</h3><textarea readonly id="out">${code}</textarea>
        <button class="btn slim center" data-v="copy">복사</button>` : ''}
      ${fromGame ? '' : `<h3>코드로 불러오기</h3><textarea id="in" placeholder="세이브 코드를 붙여 넣기"></textarea>
        <button class="btn slim center" data-v="load">불러와서 1번 칸에 넣기</button>`}
      ${next('뒤로').replace('data-v="next"', 'data-v="back"')}`);
    for (;;) {
      const v = await choose();
      if (v === 'copy') {
        const t = $app.querySelector('#out');
        t.select();
        try { await navigator.clipboard.writeText(t.value); toast('복사했다'); } catch (e) { document.execCommand('copy'); toast('복사했다'); }
        continue;
      }
      if (v === 'load') {
        try {
          const g = decode($app.querySelector('#in').value);
          if (!g || !g.p || !g.season) throw new Error('bad');
          slot = 0; G = g; save();
          return run();
        } catch (e) { toast('코드가 올바르지 않다'); continue; }
      }
      if (fromGame) return;
      return title();
    }
  }

  // ── 시뮬레이션과 연결
  const io = {
    async ask(type, d) {
      if (type === 'beat') return beatScreen(d);
      if (type === 'shot') return shotScreen(d);
      if (type === 'dive') return diveScreen(d);
      if (type === 'tackle') return tackleScreen(d);
      if (type === 'event') return eventScreen(d);
      if (type === 'offers') return offersScreen(d);
      if (type === 'negotiate') return negotiateScreen(d);
      return 0;
    },
    async show(type, d) {
      switch (type) {
        case 'chanceEnd': return chanceEndScreen(d);
        case 'week':
          if (turn) { turn.results.push(...d.results); const inj = d.results.find((r) => r.injured); if (inj) turn.injuredAt = inj.injured; return; }
          return weekScreen(d);
        case 'unlock': return unlockScreen(d);
        case 'awaken': return awakenScreen(d);
        case 'signed': return signedScreen(d);
        case 'eventResult': return messageScreen('그 뒤', d.title, esc(d.text));
        case 'callup':
          if (d.kind === 'A') return messageScreen('대한축구협회', d.tour ? `${d.tour} 최종 명단` : 'A대표팀 소집', d.first ? '처음으로 A대표팀 명단에 이름이 올랐다. 휴대폰이 쉬지 않고 울렸다.' : '이번에도 명단에 들었다.');
          return messageScreen('대한축구협회', `${d.tour} ${d.kind === 'U20' ? 'U-20' : 'U-23'} 대표`, d.kind === 'U23' && G.p.age > 23 ? '와일드카드로 뽑혔다. 형들 몫까지 뛰어야 한다.' : '연령별 대표팀 명단에 들었다.');
        case 'message': return messageScreen('알림', d.title, esc(d.text));
        case 'seasonEnd': return seasonEndScreen(d);
        case 'tournament': return tournamentScreen(d);
        case 'ballon': return ballonScreen(d);
        case 'retire': return retireScreen(d);
      }
    },
  };

  // 서비스 워커 (오프라인)
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { /* 아티팩트 등에서는 안 될 수 있다 */ }
  }

  document.addEventListener('touchstart', () => Sound.unlock(), { once: true, passive: true });
  title();
})();
