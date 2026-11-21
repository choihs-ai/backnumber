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
        G._before = { ovr: SIM.ovr(G.p), attrs: Object.assign({}, G.p.attrs) };
        await SIM.playWeek(G, action, io, focus);
        delete G._before;
        save();
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
          <div class="plan">${plan.map((x) => `<div class="ln"><span>${x.label}</span>${x.comp === 'cup' && /4강|결승/.test(x.label) ? '<span class="tag">큰 경기</span>' : ''}</div>`).join('')}</div>
          <div class="acts">${acts.map(([k, a], i) => `<button class="act ${acts.length % 2 && i === acts.length - 1 ? 'wide' : ''}" data-v="${k}" ${injured && ['train', 'focus', 'special', 'setpiece'].includes(k) ? 'disabled' : ''}>
            <span data-px="icon" data-name="${a.icon}" data-scale="2"></span><span><span class="t">${SIM.actionName(G, k)}</span><span class="d">${a.desc}</span></span></button>`).join('')}</div>
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

  async function aimScreen(d, mode) {
    // mode: 'shot'(내가 찬다) | 'dive'(내가 막는다)
    const sp = d.spec;
    cur = Object.assign(cur || {}, { score: d.score });
    const keeper = mode === 'shot' ? oppKeeperSpec(d.fx) : spec('stand');
    const keeperKey = mode === 'shot' ? 'opp' + (d.fx.oppId || 'n') : 'me' + G.p.look.skin + G.p.look.hairStyle + G.p.look.hairColor + G.p.club;
    const ask = mode === 'shot' ? (sp.type === 'pk' ? '어디로 찰까? 골문을 눌러 조준' : sp.type === 'header' ? '머리로 어디를 노릴까?' : '어디로 찰까? 골문을 눌러 조준')
      : '어느 쪽으로 몸을 날릴까?';
    render(`${chanceHead(Object.assign({}, cur, d))}
      ${d.lead ? `<p class="lead">${esc(d.lead)}</p>` : ''}
      <div class="goalview"><canvas id="goal"></canvas>
        <div class="zones">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((z) => `<button class="zone" data-z="${z}" aria-label="${SIM.ZONE_KO[z]}"></button>`).join('')}</div></div>
      <p class="situ" id="msg">${ask}</p>
      ${mode === 'dive' && d.hints ? `<ul class="hints">${d.hints.map((h) => `<li class="${h.startsWith('분석') ? 'tip' : ''}">${esc(h)}</li>`).join('')}</ul>` : ''}
      <div id="gwrap"></div>`);
    const cv = $app.querySelector('#goal');
    const draw = (extra) => PX.drawGoal(cv, Object.assign({ keeper, keeperKey, gk: { x: 48, y: 46 } }, extra), 4);
    draw({ ball: mode === 'shot' ? [48, 53, 3] : null });
    const zb = await waitTap('[data-z]');
    const zone = +zb.dataset.z;
    Sound.play('click');
    $app.querySelectorAll('.zone').forEach((b) => b.classList.toggle('on', b === zb));
    draw({ zone, ball: mode === 'shot' ? [48, 53, 3] : null });
    $app.querySelector('#msg').textContent = mode === 'shot' ? '바늘이 가운데 칸에 올 때 누르기' : '슛 순간에 맞춰 누르기';
    $app.querySelector('#gwrap').innerHTML = gaugeHtml(sp.width, mode === 'shot' ? (sp.type === 'header' ? '헤더!' : '슛!') : '다이빙!');
    const period = mode === 'shot' ? 900 / (1 + (sp.press || 0) * 0.25) / ({ header: 1.2, volley: 1.25 }[sp.type] || 1) : 760;
    const stop = runGauge($app.querySelector('#gauge'), period);
    await waitTap('#go, #gauge');
    const timing = stop();
    $app.querySelector('#gauge').classList.add(timing >= 1 - sp.width ? 'hit' : 'miss');
    Sound.play('kick');
    await wait(380);
    return mode === 'shot' ? { aim: zone, timing } : { zone, timing };
  }

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
      const t0 = performance.now(), T = 620;
      await new Promise((res) => {
        const frame = (now) => {
          const t = Math.min(1, (now - t0) / T);
          const bt = ease(t);
          let bx = lerp(48, tx, bt), by = lerp(54, ty, bt);
          if (o.saved && t > 0.8) { bx = lerp(tx, tx + (tx < 48 ? -10 : 10), (t - 0.8) * 5); by = lerp(ty, ty + 8, (t - 0.8) * 5); }
          const gy = 46 - (dive === 0 ? (gkRow === 0 ? 10 : gkRow === 1 ? 4 : 0) * Math.min(1, t * 2) : 0);
          PX.drawGoal(cv, { keeper, keeperKey, gk: { x: lerp(48, gx + (dive ? dive * -6 : 0), Math.min(1, t * 1.6)), y: gy + (dive && gkRow === 2 ? 0 : dive ? -6 * Math.min(1, t * 2) : 0), dive, t: Math.min(1, t * 1.8) },
            ball: [bx, by, lerp(4, 2, bt)], shake: (o.goal && t > 0.9) ? 1 : 0 }, 4);
          if (t < 1) requestAnimationFrame(frame); else res();
        };
        requestAnimationFrame(frame);
      });
    } else {
      PX.drawPitch($app.querySelector('#pitch'), cur && cur.pitch ? cur.pitch : { me: [48, 36] }, 4);
    }
    if (e.goal || e.assist || e.teamGoal) Sound.play('goal');
    else if (e.saved) Sound.play('save');
    else if (bad || e.missed || e.saved0) Sound.play('groan');
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
      if (type === 'shot') return aimScreen(d, 'shot');
      if (type === 'dive') return aimScreen(d, 'dive');
      if (type === 'tackle') return tackleScreen(d);
      if (type === 'event') return eventScreen(d);
      if (type === 'offers') return offersScreen(d);
      if (type === 'negotiate') return negotiateScreen(d);
      return 0;
    },
    async show(type, d) {
      switch (type) {
        case 'chanceEnd': return chanceEndScreen(d);
        case 'week': return weekScreen(d);
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
