// 효과음. sounds/이름.ogg(또는 .mp3)가 있으면 그 파일을 쓰고, 없으면 노이즈 기반 합성음으로 대신한다.
// 순음 오실레이터만으로 만든 '띵' 소리는 쓰지 않는다.
(function () {
  const S = (window.Sound = { on: true });
  let ctx = null, master = null, noiseBuf = null;
  const files = {};
  const NAMES = ['click', 'kick', 'whistle', 'goal', 'groan', 'save', 'page'];

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    // 약간 핑크 쪽으로 기운 노이즈
    let b = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = 0.97 * b + 0.03 * w; d[i] = w * 0.6 + b * 2.2; }
    NAMES.forEach(load);
  }

  async function load(name) {
    for (const ext of ['ogg', 'mp3', 'wav']) {
      try {
        const r = await fetch(`sounds/${name}.${ext}`);
        if (!r.ok) continue;
        files[name] = await ctx.decodeAudioData(await r.arrayBuffer());
        return;
      } catch (e) { /* 파일 없음 */ }
    }
  }

  const vary = (x, pct) => x * (1 + (Math.random() * 2 - 1) * pct);

  function noise(t, dur, type, freq, q, gain, attack = 0.004) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.playbackRate.value = vary(1, 0.08);
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
    return { f, g };
  }

  function thump(t, from, to, dur, gain) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(vary(from, 0.08), t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  const SYNTH = {
    click(t) { noise(t, 0.03, 'highpass', 3200, 0.7, 0.22, 0.001); },
    page(t) { noise(t, 0.12, 'bandpass', 1800, 0.8, 0.12, 0.02); },
    kick(t) {
      noise(t, 0.05, 'highpass', 2500, 0.8, 0.35, 0.001);
      thump(t, 170, 55, 0.11, 0.7);
      noise(t + 0.01, 0.12, 'lowpass', 600, 0.7, 0.18);
    },
    whistle(t) {
      // 호루라기는 원래 음정이 있는 소리라서 떨림(완두 구슬)을 크게 준다
      const o = ctx.createOscillator();
      o.type = 'triangle';
      const base = vary(2750, 0.04);
      o.frequency.value = base;
      const lfo = ctx.createOscillator(); lfo.frequency.value = vary(38, 0.15);
      const lg = ctx.createGain(); lg.gain.value = base * 0.06;
      lfo.connect(lg); lg.connect(o.frequency);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.09, t + 0.02);
      g.gain.setValueAtTime(0.09, t + 0.32);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 0.45);
      o.connect(g); g.connect(master);
      o.start(t); lfo.start(t); o.stop(t + 0.5); lfo.stop(t + 0.5);
      noise(t, 0.4, 'bandpass', base, 4, 0.05, 0.02);
    },
    goal(t) {
      const n = noise(t, 2.6, 'bandpass', 900, 0.6, 0.0001, 0.01);
      n.g.gain.cancelScheduledValues(t);
      n.g.gain.setValueAtTime(0.0001, t);
      n.g.gain.exponentialRampToValueAtTime(0.5, t + 0.35);
      n.g.gain.setValueAtTime(0.5, t + 1.1);
      n.g.gain.exponentialRampToValueAtTime(0.0008, t + 2.6);
      n.f.frequency.setValueAtTime(700, t);
      n.f.frequency.linearRampToValueAtTime(1300, t + 0.5);
      noise(t + 0.05, 2.2, 'highpass', 3000, 0.5, 0.06, 0.3);
    },
    groan(t) {
      const n = noise(t, 1.2, 'lowpass', 700, 0.8, 0.28, 0.12);
      n.f.frequency.setValueAtTime(800, t);
      n.f.frequency.exponentialRampToValueAtTime(260, t + 1.1);
    },
    save(t) {
      noise(t, 0.06, 'bandpass', 1400, 1.2, 0.3, 0.001);
      thump(t, 140, 70, 0.08, 0.4);
      SYNTH.groan(t + 0.15);
    },
  };

  S.unlock = function () {
    init();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  };

  S.play = function (name, delay = 0) {
    if (!S.on) return;
    init();
    if (!ctx) return;
    const t = ctx.currentTime + delay + 0.01;
    const buf = files[name];
    if (buf) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = vary(1, 0.05);
      const g = ctx.createGain(); g.gain.value = vary(0.9, 0.2);
      src.connect(g); g.connect(master);
      src.start(t);
      return;
    }
    if (SYNTH[name]) SYNTH[name](t);
  };
})();
