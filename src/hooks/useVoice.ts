"use client";
import { useCallback, useEffect, useState } from "react";

const PIECE_NAMES: Record<string, string> = {
  N: "Knight",
  B: "Bishop",
  R: "Rook",
  Q: "Queen",
  K: "King",
};

export function sanToSpeech(san: string): string {
  if (san === "O-O") return "Kingside Castle";
  if (san === "O-O-O") return "Queenside Castle";

  let s = san;

  const isCheckmate = s.endsWith("#");
  const isCheck = s.endsWith("+");
  s = s.replace(/[+#]$/, "");

  const promMatch = s.match(/=([QRBN])$/);
  s = s.replace(/=[QRBN]$/, "");

  let text = "";
  const pieceMatch = s.match(/^([NBRQK])/);
  if (pieceMatch) {
    text = PIECE_NAMES[pieceMatch[1]] + " ";
    s = s.slice(1);
  } else {
    text = "Pawn ";
  }

  const isCapture = s.includes("x");
  s = s.replace("x", "");

  // Destination is always the last two characters after stripping disambiguation
  const dest = s.slice(-2).toUpperCase();

  text += isCapture ? `takes ${dest}` : `to ${dest}`;

  if (promMatch) {
    text += `, promotes to ${PIECE_NAMES[promMatch[1]]}`;
  }
  if (isCheckmate) {
    text += ", checkmate";
  } else if (isCheck) {
    text += ", check";
  }

  return text;
}

export type VoiceVerbosity = "full" | "brief" | "events";

export function useVoice() {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0.4);
  const [verbosity, setVerbosity] = useState<VoiceVerbosity>("brief");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [selectedLang, setSelectedLang] = useState<string>("");

  const voiceSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!voiceSupported) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length === 0) return;
      setVoices(v);
      // Default to first English voice if available
      const defaultVoice = v.find((x) => x.lang.startsWith("en")) ?? v[0];
      setSelectedLang((prev) => prev || defaultVoice.lang.split("-")[0]);
      setSelectedVoiceURI((prev) => prev || defaultVoice.voiceURI);
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [voiceSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabled || !voiceSupported) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.volume = voiceVolume;
      if (selectedVoiceURI) {
        const voice = voices.find((v) => v.voiceURI === selectedVoiceURI);
        if (voice) utterance.voice = voice;
      }
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled, voiceSupported, voiceVolume, selectedVoiceURI, voices],
  );

  return {
    speak,
    voiceEnabled, setVoiceEnabled,
    voiceVolume, setVoiceVolume,
    verbosity, setVerbosity,
    voices,
    selectedVoiceURI, setSelectedVoiceURI,
    selectedLang, setSelectedLang,
    voiceSupported,
  };
}
