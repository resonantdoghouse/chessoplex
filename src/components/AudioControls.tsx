"use client";

interface AudioControlsProps {
  sfxEnabled: boolean;
  onToggleSfx: () => void;
  bgPlaying: boolean;
  onToggleBgMusic: () => void;
  isLightUi?: boolean;
}

export default function AudioControls({
  sfxEnabled,
  onToggleSfx,
  bgPlaying,
  onToggleBgMusic,
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

  return (
    <div className={`flex p-1 rounded-xl border shrink-0 shadow-lg ${panelBase}`}>
      {/* Sound effects toggle */}
      <button
        onClick={onToggleSfx}
        title={sfxEnabled ? "Mute sound effects" : "Enable sound effects"}
        aria-label={sfxEnabled ? "Mute sound effects" : "Enable sound effects"}
        className={`flex-1 py-2 px-2 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${sfxEnabled ? activeClass : inactiveClass}`}
      >
        <span style={{ fontSize: 14 }}>{sfxEnabled ? "🔊" : "🔇"}</span>
        <span className="text-xs tracking-wide">SFX</span>
      </button>

      {/* Background music toggle */}
      <button
        onClick={onToggleBgMusic}
        title={bgPlaying ? "Stop music" : "Play classical music"}
        aria-label={bgPlaying ? "Stop background music" : "Play background music"}
        className={`flex-1 py-2 px-2 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${bgPlaying ? activeClass : inactiveClass}`}
      >
        {bgPlaying ? (
          <>
            <span style={{ fontSize: 14 }}>⏸</span>
            <span className="text-xs tracking-wide">Music</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 14 }}>🎵</span>
            <span className="text-xs tracking-wide">Music</span>
          </>
        )}
      </button>
    </div>
  );
}
