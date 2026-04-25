"use client";
import { useRef, useState, useEffect, useCallback } from "react";

// ── Extended note frequency table ─────────────────────────────────────────────
const F: Record<string, number> = {
  G2: 98.00, "G#2": 103.83, A2: 110.00, "A#2": 116.54, B2: 123.47,
  C3: 130.81, "C#3": 138.59, D3: 146.83, "D#3": 155.56, E3: 164.81,
  F3: 174.61, "F#3": 184.99, G3: 196.00, "G#3": 207.65, A3: 220.00,
  "A#3": 233.08, B3: 246.94,
  C4: 261.63, "C#4": 277.18, D4: 293.66, "D#4": 311.13, E4: 329.63,
  F4: 349.23, "F#4": 369.99, G4: 392.00, "G#4": 415.30, A4: 440.00,
  "A#4": 466.16, B4: 493.88,
  C5: 523.25, "C#5": 554.37, D5: 587.33, "D#5": 622.25, E5: 659.25,
  F5: 698.46, "F#5": 739.99, G5: 783.99, "G#5": 830.61, A5: 880.00,
};

// ── Types ─────────────────────────────────────────────────────────────────────
export type SongId = "bach" | "gymnopedie" | "moonlight" | "pachelbel";
export type InstrumentId = "harpsichord" | "piano" | "strings" | "marimba";

interface NoteEvent {
  n: string; // note name (key into F)
  t: number; // start time offset from loop start (seconds)
  d: number; // duration (seconds)
}

// ── Song: Bach C Major Prelude BWV 846 ────────────────────────────────────────
// 8 bars of arpeggiated chords at BPM 72, 8 eighth notes per bar
const BACH_E8 = 60 / 72 / 2; // ~0.417 s per eighth note
const BACH: NoteEvent[] = (() => {
  const bars: string[][] = [
    ["C4","E4","G4","C5","E5","G4","C5","E5"],   // I   C major
    ["C4","D4","A4","D5","F5","A4","D5","F5"],   // ii  Dm7/C
    ["B3","D4","G4","D5","G5","D4","G5","D4"],   // V7  G/B
    ["C4","E4","G4","C5","E5","G4","C5","E5"],   // I   C major (repeat)
    ["C4","E4","A4","E5","A5","E5","A5","E5"],   // vi  Am
    ["C4","D4","F#4","A4","D5","F#4","A4","D5"], // II7 D7/C
    ["B3","D4","G4","B4","D5","G4","B4","D5"],   // V   G major
    ["B3","C4","E4","G4","C5","E4","G4","C5"],   // I   C/B
  ];
  const out: NoteEvent[] = [];
  bars.forEach((bar, bi) =>
    bar.forEach((n, ni) =>
      out.push({ n, t: (bi * 8 + ni) * BACH_E8, d: BACH_E8 * 0.88 })
    )
  );
  return out;
})();
const BACH_LOOP = 8 * 8 * BACH_E8; // ~26.7 s

// ── Song: Gymnopédie No. 1 (Satie) ───────────────────────────────────────────
// Key of D major, 3/4 time at BPM 52 — slow and meditative
const GYMNO_Q = 60 / 52; // ~1.154 s per quarter note
// [note, start_beat (quarters), duration (quarters)]
const GYMNO_RAW: [string, number, number][] = [
  // Bar 1 – bass sets the D-major atmosphere
  ["D3", 0, 1], ["A3", 1, 1], ["D4", 2, 1],
  // Bar 2 – melody enters on F#4 (dotted half)
  ["D3", 3, 1], ["F#4", 3, 3],
  // Bar 3 – melody: A4 → G4 → F#4
  ["G3", 6, 1], ["A4", 6, 1.5], ["G4", 7.5, 0.5], ["F#4", 8, 1],
  // Bar 4 – F#4 held
  ["D3", 9, 1], ["F#4", 9, 3],
  // Bar 5 – melody: E4 → D4 → C#4
  ["G3", 12, 1], ["E4", 12, 1.5], ["D4", 13.5, 0.5], ["C#4", 14, 1],
  // Bar 6 – C#4 held (A harmony)
  ["A2", 15, 1], ["C#4", 15, 3],
  // Bar 7 – rising D4 → E4 → F#4
  ["D3", 18, 1], ["D4", 18, 1.5], ["E4", 19.5, 0.5], ["F#4", 20, 1],
  // Bar 8 – arrival on A4
  ["G3", 21, 1], ["A4", 21, 3],
];
const GYMNO: NoteEvent[] = GYMNO_RAW.map(([n, sb, db]) => ({
  n, t: sb * GYMNO_Q, d: db * GYMNO_Q * 0.92,
}));
const GYMNO_LOOP = 24 * GYMNO_Q; // 8 bars × 3 beats ≈ 27.7 s

// ── Song: Moonlight Sonata 1st Movement (Beethoven) ──────────────────────────
// C# minor, 4/4 with constant triplet arpeggios at BPM 54
const MOON_Q = 60 / 54;    // ~1.111 s per quarter note
const MOON_T = MOON_Q / 3; // triplet subdivision ~0.37 s
// Each bar: 4 groups of 3 triplets cycling through the chord tones
const MOON_CHORDS: string[][] = [
  ["C#3","E3","G#3"],   // C#m
  ["B2", "E3","G#3"],   // C#m/B
  ["A2", "E3","A3"],    // A major
  ["E3", "G#3","B3"],   // E major
  ["F#3","A3", "C#4"],  // F#m
  ["G#3","B3", "D#4"],  // G#m (chromatic colour)
  ["C#3","G#3","C#4"],  // C#m (return)
  ["B2", "D#3","F#3"],  // B major (half-cadence)
];
const MOONLIGHT: NoteEvent[] = (() => {
  const out: NoteEvent[] = [];
  MOON_CHORDS.forEach((chord, bi) => {
    for (let group = 0; group < 4; group++) {
      chord.forEach((n, ni) => {
        out.push({ n, t: (bi * 4 + group) * MOON_Q + ni * MOON_T, d: MOON_T * 0.88 });
      });
    }
  });
  return out;
})();
const MOONLIGHT_LOOP = 8 * 4 * MOON_Q; // ~35.6 s

// ── Song: Pachelbel Canon in D ────────────────────────────────────────────────
// Famous repeating 8-bar bass ostinato D–A–B–F#–G–D–G–A at BPM 68
const PACH_Q = 60 / 68;   // ~0.882 s per quarter note
const PACH_E = PACH_Q / 2; // eighth note
const PACH_BASS = ["D3","A2","B2","F#3","G3","D3","G3","A2"];
// Upper voice: 8 eighth notes per bar of melodic variation
const PACH_UPPER: string[][] = [
  ["F#4","E4","D4","C#4","D4","C#4","B3","A3"],  // over D
  ["A3", "B3","C#4","D4","E4","D4","C#4","B3"],  // over A
  ["B3", "C#4","D4","E4","F#4","E4","D4","C#4"], // over B
  ["C#4","B3", "A3","G#3","A3","B3","C#4","D4"], // over F#
  ["B3", "C#4","D4","E4","D4","C#4","B3","A3"],  // over G
  ["A3", "G3", "F#3","E3","F#3","G3","A3","B3"], // over D
  ["G3", "A3", "B3","C#4","D4","E4","F#4","G4"], // over G (rising)
  ["F#4","E4", "D4","C#4","B3","A3","G3","A3"],  // over A (resolve)
];
const PACHELBEL: NoteEvent[] = (() => {
  const out: NoteEvent[] = [];
  PACH_BASS.forEach((bass, bi) => {
    const barStart = bi * 4 * PACH_Q;
    out.push({ n: bass, t: barStart, d: 4 * PACH_Q * 0.9 });
    PACH_UPPER[bi].forEach((n, ni) => {
      out.push({ n, t: barStart + ni * PACH_E, d: PACH_E * 0.85 });
    });
  });
  return out;
})();
const PACHELBEL_LOOP = 8 * 4 * PACH_Q; // ~28.2 s

// ── Song & instrument metadata (exported for UI) ──────────────────────────────
export const SONG_META: Record<SongId, { label: string; loop: number; events: NoteEvent[] }> = {
  bach:       { label: "Bach",  loop: BACH_LOOP,      events: BACH      },
  gymnopedie: { label: "Gymno", loop: GYMNO_LOOP,     events: GYMNO     },
  moonlight:  { label: "Moon",  loop: MOONLIGHT_LOOP, events: MOONLIGHT },
  pachelbel:  { label: "Canon", loop: PACHELBEL_LOOP, events: PACHELBEL },
};
export const INSTRUMENT_META: Record<InstrumentId, { label: string }> = {
  piano:       { label: "Piano"   },
  strings:     { label: "Strings" },
  marimba:     { label: "Marimba" },
  harpsichord: { label: "Harp"    },
};

// ── Instrument synthesis ──────────────────────────────────────────────────────

function noteHarpsichord(ctx: AudioContext, dest: AudioNode, freq: number, t: number, dur: number) {
  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.value = freq;
  const g1 = ctx.createGain();
  g1.gain.setValueAtTime(0, t);
  g1.gain.linearRampToValueAtTime(0.18, t + 0.003);
  g1.gain.exponentialRampToValueAtTime(0.001, t + Math.min(dur * 0.88, 0.52));
  osc1.connect(g1); g1.connect(dest);
  osc1.start(t); osc1.stop(t + dur + 0.05);

  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.value = freq * 2;
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0, t);
  g2.gain.linearRampToValueAtTime(0.07, t + 0.003);
  g2.gain.exponentialRampToValueAtTime(0.001, t + Math.min(dur * 0.60, 0.30));
  osc2.connect(g2); g2.connect(dest);
  osc2.start(t); osc2.stop(t + dur + 0.05);

  // Jack pluck click
  const cLen = Math.floor(ctx.sampleRate * 0.007);
  const cBuf = ctx.createBuffer(1, cLen, ctx.sampleRate);
  const cData = cBuf.getChannelData(0);
  for (let i = 0; i < cLen; i++) cData[i] = (Math.random() * 2 - 1) * (1 - i / cLen);
  const click = ctx.createBufferSource();
  click.buffer = cBuf;
  const clickHp = ctx.createBiquadFilter();
  clickHp.type = "highpass";
  clickHp.frequency.value = 1800;
  const clickG = ctx.createGain();
  clickG.gain.value = 0.04;
  click.connect(clickHp); clickHp.connect(clickG); clickG.connect(dest);
  click.start(t);
}

function notePiano(ctx: AudioContext, dest: AudioNode, freq: number, t: number, dur: number) {
  const decayTime = Math.min(dur * 0.95, 3.0);
  const harmonics: [number, number, number][] = [
    [1,  0.22, decayTime],
    [2,  0.11, decayTime * 0.65],
    [3,  0.05, decayTime * 0.42],
    [4, 0.025, decayTime * 0.28],
  ];
  harmonics.forEach(([mult, amp, dec]) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq * mult * (mult > 1 ? 1 + (mult - 1) * 0.0007 : 1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(amp, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, t + dec);
    osc.connect(g); g.connect(dest);
    osc.start(t); osc.stop(t + dec + 0.08);
  });

  // Soft hammer noise
  const hLen = Math.floor(ctx.sampleRate * 0.009);
  const hBuf = ctx.createBuffer(1, hLen, ctx.sampleRate);
  const hData = hBuf.getChannelData(0);
  for (let i = 0; i < hLen; i++) hData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / hLen, 1.5);
  const hammer = ctx.createBufferSource();
  hammer.buffer = hBuf;
  const hammerF = ctx.createBiquadFilter();
  hammerF.type = "bandpass";
  hammerF.frequency.value = Math.min(2200 + freq * 1.1, 8000);
  hammerF.Q.value = 0.9;
  const hammerG = ctx.createGain();
  hammerG.gain.value = 0.045;
  hammer.connect(hammerF); hammerF.connect(hammerG); hammerG.connect(dest);
  hammer.start(t);
}

function noteStrings(ctx: AudioContext, dest: AudioNode, freq: number, t: number, dur: number) {
  // Two detuned triangle oscillators with delayed LFO vibrato
  const attackTime   = 0.08 + Math.random() * 0.025;
  const sustainLevel = 0.16;
  const releaseTime  = Math.min(0.35, dur * 0.25);

  ([-5, 5] as const).forEach((cent, voiceIdx) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.detune.value = cent;
    osc.frequency.value = freq;

    // LFO → osc.detune (in cents): delayed onset for natural bowing feel
    const lfo  = ctx.createOscillator();
    lfo.type   = "sine";
    lfo.frequency.value = 5.1 + voiceIdx * 0.2;
    const lfoG = ctx.createGain();
    lfoG.gain.setValueAtTime(0, t);
    lfoG.gain.linearRampToValueAtTime(0, t + attackTime + 0.18);
    lfoG.gain.linearRampToValueAtTime(9, t + attackTime + 0.55); // ~9 cent vibrato
    lfo.connect(lfoG);
    lfoG.connect(osc.detune);
    lfo.start(t); lfo.stop(t + dur + 0.3);

    // Octave harmonic for body
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = freq * 2;
    osc2.detune.value = cent;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(sustainLevel / 2, t + attackTime);
    g.gain.setValueAtTime(sustainLevel / 2, t + Math.max(dur - releaseTime, t + attackTime + 0.01));
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.05);

    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0, t);
    g2.gain.linearRampToValueAtTime((sustainLevel * 0.35) / 2, t + attackTime);
    g2.gain.setValueAtTime((sustainLevel * 0.35) / 2, t + Math.max(dur - releaseTime, t + attackTime + 0.01));
    g2.gain.linearRampToValueAtTime(0.0001, t + dur + 0.05);

    osc.connect(g);   g.connect(dest);
    osc2.connect(g2); g2.connect(dest);
    osc.start(t);  osc.stop(t + dur + 0.15);
    osc2.start(t); osc2.stop(t + dur + 0.15);
  });
}

function noteMarimba(ctx: AudioContext, dest: AudioNode, freq: number, t: number, dur: number) {
  // Fast exponential decay with characteristic 4th harmonic
  const decayTime = Math.min(dur * 0.75, 1.1);

  ([
    [1,  0.21, decayTime],
    [4,  0.08, decayTime * 0.38],
    [10, 0.025, decayTime * 0.18],
  ] as [number, number, number][]).forEach(([mult, amp, dec]) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq * mult;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(amp, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, t + dec);
    osc.connect(g); g.connect(dest);
    osc.start(t); osc.stop(t + dec + 0.05);
  });

  // Mallet surface noise
  const mLen = Math.floor(ctx.sampleRate * 0.018);
  const mBuf = ctx.createBuffer(1, mLen, ctx.sampleRate);
  const mData = mBuf.getChannelData(0);
  for (let i = 0; i < mLen; i++) mData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / mLen, 0.7);
  const mallet = ctx.createBufferSource();
  mallet.buffer = mBuf;
  const malletF = ctx.createBiquadFilter();
  malletF.type = "bandpass";
  malletF.frequency.value = Math.min(900 + freq * 0.6, 4000);
  malletF.Q.value = 1.8;
  const malletG = ctx.createGain();
  malletG.gain.value = 0.06;
  mallet.connect(malletF); malletF.connect(malletG); malletG.connect(dest);
  mallet.start(t);
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAudio() {
  // Restore persisted audio preferences (IIFEs run on every render but only
  // affect the initial hook values on mount — cheap localStorage reads)
  const initSfx   = (() => { try { return localStorage.getItem("chess_audio_sfx")        !== "false"; } catch { return true;        } })();
  const initSong  = (() => { try { return (localStorage.getItem("chess_audio_song")        as SongId)       || "bach";  } catch { return "bach"  as SongId;  } })();
  const initInstr = (() => { try { return (localStorage.getItem("chess_audio_instrument") as InstrumentId) || "piano"; } catch { return "piano" as InstrumentId; } })();

  const ctxRef          = useRef<AudioContext | null>(null);
  const masterRef       = useRef<GainNode | null>(null);
  const bgGainRef       = useRef<GainNode | null>(null);
  // Each call to scheduleLoop gets its own intermediate gain node.
  // Disconnecting it instantly silences all pre-scheduled oscillators for that loop.
  const loopGainRef     = useRef<GainNode | null>(null);
  const bgPlayingRef    = useRef(false);
  const sfxEnabledRef   = useRef(initSfx);
  const songRef         = useRef<SongId>(initSong);
  const instrRef        = useRef<InstrumentId>(initInstr);
  const loopTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextLoopAtRef   = useRef(0);

  const [sfxEnabled,        _setSfxEnabled]       = useState(initSfx);
  const [bgPlaying,         _setBgPlaying]         = useState(false);
  const [currentSong,       _setCurrentSong]       = useState<SongId>(initSong);
  const [currentInstrument, _setCurrentInstrument] = useState<InstrumentId>(initInstr);

  // ── Lazy AudioContext + convolution reverb ─────────────────────────────────
  function getCtx(): AudioContext {
    if (!ctxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      const master = ctx.createGain();
      master.gain.value = 0.85;
      master.connect(ctx.destination);
      masterRef.current = master;

      // Synthetic reverb IR: stereo exponentially-decaying noise
      const reverb = ctx.createConvolver();
      const irLen  = Math.floor(ctx.sampleRate * 2.4);
      const irBuf  = ctx.createBuffer(2, irLen, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = irBuf.getChannelData(ch);
        for (let i = 0; i < irLen; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.6);
        }
      }
      reverb.buffer = irBuf;

      // bgGain → dry path (55%) + wet/reverb path (45%) → master
      const bgGain = ctx.createGain();
      bgGain.gain.value = 0;
      bgGainRef.current = bgGain;

      const dryG = ctx.createGain(); dryG.gain.value = 0.55;
      const wetG = ctx.createGain(); wetG.gain.value = 0.45;

      bgGain.connect(dryG);   dryG.connect(master);
      bgGain.connect(reverb); reverb.connect(wetG); wetG.connect(master);

      ctxRef.current = ctx;
    }
    return ctxRef.current;
  }

  // ── Dispatch to active instrument ──────────────────────────────────────────
  function scheduleNote(ctx: AudioContext, dest: AudioNode, freq: number, t: number, dur: number) {
    switch (instrRef.current) {
      case "harpsichord": return noteHarpsichord(ctx, dest, freq, t, dur);
      case "piano":       return notePiano(ctx, dest, freq, t, dur);
      case "strings":     return noteStrings(ctx, dest, freq, t, dur);
      case "marimba":     return noteMarimba(ctx, dest, freq, t, dur);
    }
  }

  // ── Schedule one full loop of the current song ─────────────────────────────
  // Each loop gets its own intermediate GainNode (loopGain → bgGain → master).
  // Disconnecting loopGain instantly silences every oscillator scheduled for
  // that loop, even ones not yet played — this is the key to clean song switching.
  function scheduleLoop(startT: number) {
    const ctx  = getCtx();
    const song = SONG_META[songRef.current];

    // Disconnect the previous loop's gain node (silences any lingering notes)
    if (loopGainRef.current) {
      try { loopGainRef.current.disconnect(); } catch (_) {}
    }
    const loopGain = ctx.createGain();
    loopGain.gain.value = 1.0;
    loopGain.connect(bgGainRef.current ?? masterRef.current ?? ctx.destination);
    loopGainRef.current = loopGain;

    song.events.forEach(({ n, t, d }) => {
      const freq = F[n];
      if (freq) scheduleNote(ctx, loopGain, freq, startT + t, d);
    });

    const nextStart = startT + song.loop;
    nextLoopAtRef.current = nextStart;
    const msUntil = (nextStart - 0.25 - ctx.currentTime) * 1000;
    loopTimerRef.current = setTimeout(() => {
      if (bgPlayingRef.current) scheduleLoop(nextLoopAtRef.current);
    }, Math.max(0, msUntil));
  }

  // ── SFX: capture — retro descending blip + impact crack ───────────────────
  const playCaptureSound = useCallback(() => {
    if (!sfxEnabledRef.current) return;
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const dest = masterRef.current ?? ctx.destination;
    const now  = ctx.currentTime;

    // Descending triangle-wave pitch sweep (NES triangle channel feel)
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.13);
    const oscG = ctx.createGain();
    oscG.gain.setValueAtTime(0.28, now);
    oscG.gain.linearRampToValueAtTime(0.28, now + 0.01);
    oscG.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(oscG); oscG.connect(dest);
    osc.start(now); osc.stop(now + 0.18);

    // Short impact noise burst at the hit
    const nLen  = Math.floor(ctx.sampleRate * 0.04);
    const nBuf  = ctx.createBuffer(1, nLen, ctx.sampleRate);
    const nData = nBuf.getChannelData(0);
    for (let i = 0; i < nLen; i++)
      nData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nLen, 0.6);
    const noise = ctx.createBufferSource();
    noise.buffer = nBuf;
    const noiseF = ctx.createBiquadFilter();
    noiseF.type = "bandpass";
    noiseF.frequency.value = 1600;
    noiseF.Q.value = 1.2;
    const noiseG = ctx.createGain();
    noiseG.gain.value = 0.18;
    noise.connect(noiseF); noiseF.connect(noiseG); noiseG.connect(dest);
    noise.start(now);
  }, []);

  // ── SFX: wood piece-slide ASMR ─────────────────────────────────────────────
  const playMoveSound = useCallback(() => {
    if (!sfxEnabledRef.current) return;
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const dest = masterRef.current ?? ctx.destination;
    const now  = ctx.currentTime;

    const slideDur = 0.10 + Math.random() * 0.06;
    const sLen  = Math.floor(ctx.sampleRate * slideDur);
    const sBuf  = ctx.createBuffer(1, sLen, ctx.sampleRate);
    const sData = sBuf.getChannelData(0);
    for (let i = 0; i < sLen; i++)
      sData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / sLen, 1.4);
    const slideNoise = ctx.createBufferSource();
    slideNoise.buffer = sBuf;
    const slideFilter = ctx.createBiquadFilter();
    slideFilter.type  = "bandpass";
    slideFilter.frequency.value = 850 + Math.random() * 350;
    slideFilter.Q.value = 1.8;
    const slideGain = ctx.createGain();
    slideGain.gain.setValueAtTime(0.20, now);
    slideGain.gain.exponentialRampToValueAtTime(0.001, now + slideDur);
    slideNoise.connect(slideFilter); slideFilter.connect(slideGain); slideGain.connect(dest);
    slideNoise.start(now);

    const thunkAt = now + slideDur * 0.72;
    const tLen  = Math.floor(ctx.sampleRate * 0.035);
    const tBuf  = ctx.createBuffer(1, tLen, ctx.sampleRate);
    const tData = tBuf.getChannelData(0);
    for (let i = 0; i < tLen; i++)
      tData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / tLen, 0.5);
    const texNoise = ctx.createBufferSource();
    texNoise.buffer = tBuf;
    const texGain = ctx.createGain();
    texGain.gain.value = 0.06;
    texNoise.connect(texGain); texGain.connect(dest);
    texNoise.start(thunkAt);
  }, []);

  // ── Toggle background music ─────────────────────────────────────────────────
  const toggleBgMusic = useCallback(() => {
    const ctx    = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const bgGain = bgGainRef.current!;
    const now    = ctx.currentTime;

    if (bgPlayingRef.current) {
      bgGain.gain.setValueAtTime(bgGain.gain.value, now);
      bgGain.gain.linearRampToValueAtTime(0, now + 1.8);
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
      bgPlayingRef.current = false;
      _setBgPlaying(false);
    } else {
      bgGain.gain.setValueAtTime(0, now);
      bgGain.gain.linearRampToValueAtTime(1.0, now + 2.5);
      scheduleLoop(now + 0.05);
      bgPlayingRef.current = true;
      _setBgPlaying(true);
    }
  }, []);

  // ── Helper: stop old loop instantly, then restart with new song/instrument ──
  function restartLoop() {
    if (loopTimerRef.current)    clearTimeout(loopTimerRef.current);
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);

    // Fade bgGain out quickly for a smooth transition
    const ctx    = getCtx();
    const bgGain = bgGainRef.current!;
    const now    = ctx.currentTime;
    bgGain.gain.cancelScheduledValues(now);
    bgGain.gain.setValueAtTime(bgGain.gain.value, now);
    bgGain.gain.linearRampToValueAtTime(0, now + 0.25);

    // After the fade, disconnect the old loop's gain node — this kills every
    // oscillator that was pre-scheduled for that loop but hasn't played yet.
    // Then schedule the new loop and fade bgGain back up.
    restartTimerRef.current = setTimeout(() => {
      if (loopGainRef.current) {
        try { loopGainRef.current.disconnect(); } catch (_) {}
        loopGainRef.current = null;
      }
      if (!bgPlayingRef.current) return;
      const ctx2   = getCtx();
      const now2   = ctx2.currentTime;
      bgGainRef.current!.gain.cancelScheduledValues(now2);
      bgGainRef.current!.gain.setValueAtTime(0, now2);
      bgGainRef.current!.gain.linearRampToValueAtTime(1.0, now2 + 1.2);
      scheduleLoop(now2 + 0.05);
    }, 300);
  }

  // ── Song selector ──────────────────────────────────────────────────────────
  const setSong = useCallback((id: SongId) => {
    if (id === songRef.current) return;
    songRef.current = id;
    _setCurrentSong(id);
    try { localStorage.setItem("chess_audio_song", id); } catch {}
    if (bgPlayingRef.current) restartLoop();
  }, []);

  // ── Instrument selector ────────────────────────────────────────────────────
  const setInstrument = useCallback((id: InstrumentId) => {
    if (id === instrRef.current) return;
    instrRef.current = id;
    _setCurrentInstrument(id);
    try { localStorage.setItem("chess_audio_instrument", id); } catch {}
    if (bgPlayingRef.current) restartLoop();
  }, []);

  // ── SFX toggle ─────────────────────────────────────────────────────────────
  const setSfxEnabled = useCallback((val: boolean) => {
    sfxEnabledRef.current = val;
    _setSfxEnabled(val);
    try { localStorage.setItem("chess_audio_sfx", String(val)); } catch {}
  }, []);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (loopTimerRef.current)    clearTimeout(loopTimerRef.current);
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (loopGainRef.current) { try { loopGainRef.current.disconnect(); } catch (_) {} }
      ctxRef.current?.close();
    };
  }, []);

  return {
    playMoveSound,
    playCaptureSound,
    sfxEnabled,       setSfxEnabled,
    bgPlaying,        toggleBgMusic,
    currentSong,      setSong,
    currentInstrument, setInstrument,
  };
}
