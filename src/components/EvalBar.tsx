"use client";

interface EvalBarProps {
  evaluation?: number; // in pawns, from white's perspective
  mate?: number;       // e.g. 3 = white mates in 3, -2 = black mates in 2
  isLightUi?: boolean;
}

export default function EvalBar({ evaluation, mate, isLightUi }: EvalBarProps) {
  // Calculate the white percentage (top = white, bottom = black)
  let whitePercent = 50;
  let label = "0.0";

  if (mate !== undefined) {
    if (mate > 0) {
      whitePercent = 100;
      label = `M${mate}`;
    } else if (mate < 0) {
      whitePercent = 0;
      label = `M${Math.abs(mate)}`;
    } else {
      whitePercent = 50;
      label = "M0";
    }
  } else if (evaluation !== undefined) {
    // Clamp to [-10, 10] and map to [0, 100]%
    const clamped = Math.max(-10, Math.min(10, evaluation));
    whitePercent = 50 + (clamped / 10) * 50;
    const abs = Math.abs(evaluation);
    label = abs >= 10 ? (evaluation > 0 ? "+10" : "-10") : evaluation.toFixed(1);
    if (evaluation > 0) label = `+${label}`;
  }

  const blackPercent = 100 - whitePercent;
  const labelOnWhite = whitePercent >= 50;

  const borderColor = isLightUi ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "28px",
        height: "100%",
        flexShrink: 0,
        gap: "6px",
      }}
    >
      {/* Bar */}
      <div
        style={{
          flex: 1,
          width: "100%",
          borderRadius: "6px",
          overflow: "hidden",
          border: `1px solid ${borderColor}`,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Black section (top) */}
        <div
          style={{
            width: "100%",
            height: `${blackPercent}%`,
            background: "#1a1a1a",
            transition: "height 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            flexShrink: 0,
          }}
        />
        {/* White section (bottom) */}
        <div
          style={{
            width: "100%",
            flex: 1,
            background: "#f0f0f0",
            transition: "height 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Label */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: labelOnWhite ? "6px" : undefined,
            top: labelOnWhite ? undefined : "6px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 500,
              fontFamily: "monospace",
              color: labelOnWhite ? "#1a1a1a" : "#f0f0f0",
              lineHeight: 1,
              letterSpacing: "-0.5px",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
