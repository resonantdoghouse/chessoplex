"use client";
import { useRef, useState, useEffect, useCallback } from "react";

// ── Note frequencies (Hz) ─────────────────────────────────────────────────────
const F: Record<string, number> = {
  A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, "F#4": 369.99, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, "F#5": 739.99, G5: 783.99,
};

// ── Baroque harpsichord loop ───────────────────────────────────────────────────
// 8 bars of arpeggiated chords: G – Em – C – D – G(hi) – Em(hi) – Am – D
// Each bar = 8 eighth notes. BPM 78 → eighth note ≈ 0.385 s → loop ≈ 24.6 s.
const BPM = 78;
const E8 = 60 / BPM / 2; // eighth-note duration in seconds

const SEQ: string[] = [
  // Bar 1 – G major (ascending + descending)
  "G3","D4","G4","B4","D5","B4","G4","D4",
  // Bar 2 – E minor
  "E3","B3","E4","G4","B4","G4","E4","B3",
  // Bar 3 – C major
  "C4","E4","G4","C5","E5","C5","G4","E4",
  // Bar 4 – D major
  "D4","F#4","A4","D5","A4","F#4","D4","A3",
  // Bar 5 – G major (high register variation)
  "G4","B4","D5","G5","D5","B4","G4","D4",
  // Bar 6 – E minor (high)
  "E4","G4","B4","E5","G5","E5","B4","G4",
  // Bar 7 – A minor
  "A3","E4","A4","C5","E5","C5","A4","E4",
  // Bar 8 – D major resolving
  "D3","A3","D4","F#4","A4","F#4","D4","A3",
];

const LOOP_DURATION = SEQ.length * E8; // ~24.6 s

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAudio() {
  const ctxRef        = useRef<AudioContext | null>(null);
  const masterRef     = useRef<GainNode | null>(null);
  const bgGainRef     = useRef<GainNode | null>(null);
  const bgPlayingRef  = useRef(false);
  const sfxEnabledRef = useRef(true);
  const loopTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextLoopAtRef = useRef(0);

  const [sfxEnabled, _setSfxEnabled] = useState(true);
  const [bgPlaying,  _setBgPlaying]  = useState(false);

  // ── Lazy AudioContext init ────────────────────────────────────────────────
  function getCtx(): AudioContext {
    if (!ctxRef.current) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      const master = ctx.createGain();
      master.gain.value = 0.85;
      master.connect(ctx.destination);
      masterRef.current = master;

      const bgGain = ctx.createGain();
      bgGain.gain.value = 0; // silent until music starts
      bgGain.connect(master);
      bgGainRef.current = bgGain;

      ctxRef.current = ctx;
    }
    return ctxRef.current;
  }

  // ── SFX: wood ASMR (slide + placement thunk) ─────────────────────────────
  const playMoveSound = useCallback(() => {
    if (!sfxEnabledRef.current) return;
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const dest = masterRef.current ?? ctx.destination;
    const now  = ctx.currentTime;

    // 1) Wood slide — bandpass-filtered noise fading out
    const slideDur = 0.10 + Math.random() * 0.06;
    const sLen     = Math.floor(ctx.sampleRate * slideDur);
    const sBuf     = ctx.createBuffer(1, sLen, ctx.sampleRate);
    const sData    = sBuf.getChannelData(0);
    for (let i = 0; i < sLen; i++) {
      sData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / sLen, 1.4);
    }
    const slideNoise  = ctx.createBufferSource();
    slideNoise.buffer = sBuf;

    const slideFilter        = ctx.createBiquadFilter();
    slideFilter.type         = "bandpass";
    slideFilter.frequency.value = 850 + Math.random() * 350;
    slideFilter.Q.value      = 1.8;

    const slideGain = ctx.createGain();
    slideGain.gain.setValueAtTime(0.20, now);
    slideGain.gain.exponentialRampToValueAtTime(0.001, now + slideDur);

    slideNoise.connect(slideFilter);
    slideFilter.connect(slideGain);
    slideGain.connect(dest);
    slideNoise.start(now);

    // 2) Piece placement — surface texture noise burst only
    const thunkAt = now + slideDur * 0.72;

    // Surface texture: short noise burst
    const tLen  = Math.floor(ctx.sampleRate * 0.035);
    const tBuf  = ctx.createBuffer(1, tLen, ctx.sampleRate);
    const tData = tBuf.getChannelData(0);
    for (let i = 0; i < tLen; i++) {
      tData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / tLen, 0.5);
    }
    const texNoise  = ctx.createBufferSource();
    texNoise.buffer = tBuf;
    const texGain   = ctx.createGain();
    texGain.gain.value = 0.06;
    texNoise.connect(texGain);
    texGain.connect(dest);
    texNoise.start(thunkAt);
  }, []);

  // ── Background music: schedule a single harpsichord note ─────────────────
  function scheduleNote(ctx: AudioContext, freq: number, t: number, dur: number) {
    const dest = bgGainRef.current ?? masterRef.current ?? ctx.destination;

    // Fundamental sine — main pitch
    const osc1 = ctx.createOscillator();
    osc1.type           = "sine";
    osc1.frequency.value = freq;
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0, t);
    g1.gain.linearRampToValueAtTime(0.18, t + 0.003);
    g1.gain.exponentialRampToValueAtTime(0.001, t + Math.min(dur * 0.88, 0.52));
    osc1.connect(g1);
    g1.connect(dest);
    osc1.start(t);
    osc1.stop(t + dur + 0.05);

    // 2nd harmonic (octave) — adds brightness
    const osc2 = ctx.createOscillator();
    osc2.type            = "sine";
    osc2.frequency.value = freq * 2;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0, t);
    g2.gain.linearRampToValueAtTime(0.07, t + 0.003);
    g2.gain.exponentialRampToValueAtTime(0.001, t + Math.min(dur * 0.60, 0.30));
    osc2.connect(g2);
    g2.connect(dest);
    osc2.start(t);
    osc2.stop(t + dur + 0.05);

    // Pluck click — tiny filtered noise burst mimics the jack action
    const cLen  = Math.floor(ctx.sampleRate * 0.007);
    const cBuf  = ctx.createBuffer(1, cLen, ctx.sampleRate);
    const cData = cBuf.getChannelData(0);
    for (let i = 0; i < cLen; i++) {
      cData[i] = (Math.random() * 2 - 1) * (1 - i / cLen);
    }
    const clickNoise  = ctx.createBufferSource();
    clickNoise.buffer = cBuf;
    const clickHp     = ctx.createBiquadFilter();
    clickHp.type      = "highpass";
    clickHp.frequency.value = 1800;
    const clickGain   = ctx.createGain();
    clickGain.gain.value = 0.04;
    clickNoise.connect(clickHp);
    clickHp.connect(clickGain);
    clickGain.connect(dest);
    clickNoise.start(t);
  }

  // ── Schedule one full loop of the sequence ────────────────────────────────
  function scheduleLoop(startT: number) {
    const ctx = getCtx();

    SEQ.forEach((name, i) => {
      const freq = F[name];
      if (freq) scheduleNote(ctx, freq, startT + i * E8, E8 * 0.85);
    });

    const nextStart      = startT + LOOP_DURATION;
    nextLoopAtRef.current = nextStart;

    // Re-schedule ~200 ms before the next loop begins
    const msUntil = (nextStart - 0.2 - ctx.currentTime) * 1000;
    loopTimerRef.current = setTimeout(() => {
      if (bgPlayingRef.current) scheduleLoop(nextLoopAtRef.current);
    }, Math.max(0, msUntil));
  }

  // ── Toggle background music (fade in / fade out) ──────────────────────────
  const toggleBgMusic = useCallback(() => {
    const ctx    = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const bgGain = bgGainRef.current!;
    const now    = ctx.currentTime;

    if (bgPlayingRef.current) {
      // Fade out
      bgGain.gain.setValueAtTime(bgGain.gain.value, now);
      bgGain.gain.linearRampToValueAtTime(0, now + 1.8);
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
      bgPlayingRef.current = false;
      _setBgPlaying(false);
    } else {
      // Fade in and start loop
      bgGain.gain.setValueAtTime(0, now);
      bgGain.gain.linearRampToValueAtTime(1.0, now + 2.5);
      scheduleLoop(now + 0.05);
      bgPlayingRef.current = true;
      _setBgPlaying(true);
    }
  }, []);

  // ── Public sfxEnabled setter (keeps ref in sync) ──────────────────────────
  const setSfxEnabled = useCallback((val: boolean) => {
    sfxEnabledRef.current = val;
    _setSfxEnabled(val);
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
      ctxRef.current?.close();
    };
  }, []);

  return { playMoveSound, sfxEnabled, setSfxEnabled, bgPlaying, toggleBgMusic };
}
