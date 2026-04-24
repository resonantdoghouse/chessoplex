"use client";
import { SongId, InstrumentId, SONG_META, INSTRUMENT_META } from "@/hooks/useAudio";

const SONG_IDS:  SongId[]       = ["bach","gymnopedie","moonlight","pachelbel"];
const INSTR_IDS: InstrumentId[] = ["piano","strings","marimba","harpsichord"];

interface AudioControlsProps {
  sfxEnabled:        boolean;
  onToggleSfx:       () => void;
  bgPlaying:         boolean;
  onToggleBgMusic:   () => void;
  currentSong:       SongId;
  onSetSong:         (id: SongId) => void;
  currentInstrument: InstrumentId;
  onSetInstrument:   (id: InstrumentId) => void;
  isLightUi?:        boolean;
}

export default function AudioControls({
  sfxEnabled,
  onToggleSfx,
  bgPlaying,
  onToggleBgMusic,
  currentSong,
  onSetSong,
  currentInstrument,
  onSetInstrument,
  isLightUi = false,
}: AudioControlsProps) {
  const panelBase = isLightUi
    ? "bg-white/90 border-black/10 shadow-xl"
    : "bg-white/80 dark:bg-zinc-900/80 border-white/20 dark:border-white/10";

  const activeClass = isLightUi
    ? "bg-zinc-900 text-white shadow-md"
    : "bg-zinc-800 text-white shadow-md dark:bg-white dark:text-zinc-900";

  const inactiveClass = isLightUi
    ? "text-zinc-500 hover:bg-black/5"
    : "text-zinc-500 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5";

  const labelClass = isLightUi
    ? "text-zinc-600"
    : "text-zinc-500 dark:text-zinc-400";

  return (
    <div className={`flex flex-col gap-2 p-2 rounded-xl border shrink-0 shadow-lg ${panelBase}`}>

      {/* ── Row 1: SFX + Music toggles ── */}
      <div className="flex gap-1">
        <button
          onClick={onToggleSfx}
          title={sfxEnabled ? "Mute sound effects" : "Enable sound effects"}
          aria-label={sfxEnabled ? "Mute sound effects" : "Enable sound effects"}
          className={`flex-1 py-1.5 px-2 font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1 ${sfxEnabled ? activeClass : inactiveClass}`}
        >
          <span style={{ fontSize: 13 }}>{sfxEnabled ? "🔊" : "🔇"}</span>
          <span className="text-xs tracking-wide">SFX</span>
        </button>

        <button
          onClick={onToggleBgMusic}
          title={bgPlaying ? "Stop music" : "Play classical music"}
          aria-label={bgPlaying ? "Stop background music" : "Play background music"}
          className={`flex-1 py-1.5 px-2 font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1 ${bgPlaying ? activeClass : inactiveClass}`}
        >
          <span style={{ fontSize: 13 }}>{bgPlaying ? "⏸" : "🎵"}</span>
          <span className="text-xs tracking-wide">Music</span>
        </button>
      </div>

      {/* ── Row 2: Song selector ── */}
      <div className="flex flex-col gap-1">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-0.5 ${labelClass}`}>
          Song
        </span>
        <div className="grid grid-cols-4 gap-1">
          {SONG_IDS.map((id) => (
            <button
              key={id}
              onClick={() => onSetSong(id)}
              title={`Play ${SONG_META[id].label}`}
              aria-label={`Select song: ${SONG_META[id].label}`}
              className={`py-1.5 text-[10px] font-bold rounded-lg transition-all duration-200 ${currentSong === id ? activeClass : inactiveClass}`}
            >
              {SONG_META[id].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Row 3: Instrument selector ── */}
      <div className="flex flex-col gap-1">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-0.5 ${labelClass}`}>
          Sound
        </span>
        <div className="grid grid-cols-4 gap-1">
          {INSTR_IDS.map((id) => (
            <button
              key={id}
              onClick={() => onSetInstrument(id)}
              title={`Use ${INSTRUMENT_META[id].label} sound`}
              aria-label={`Select instrument: ${INSTRUMENT_META[id].label}`}
              className={`py-1.5 text-[10px] font-bold rounded-lg transition-all duration-200 ${currentInstrument === id ? activeClass : inactiveClass}`}
            >
              {INSTRUMENT_META[id].label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
