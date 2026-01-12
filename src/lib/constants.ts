export const BOARD_THEMES = {
  default: {
    name: "Classic",
    light: "#f0d9b5",
    dark: "#b58863",
    backgroundGradient:
      "radial-gradient(circle at center, #8a6c4b 0%, #2f2015 100%)", // Warm wood tones
  },
  emerald: {
    name: "Emerald",
    light: "#E8F5E9",
    dark: "#2E7D32",
    backgroundGradient:
      "linear-gradient(135deg, #134E5E 0%, #71B280 100%)", // Deep forest green
  },
  royal: {
    name: "Royal",
    light: "#E3F2FD",
    dark: "#1565C0",
    backgroundGradient:
      "linear-gradient(to right, #243B55, #141E30)", // Deep ocean blue
  },
  stone: {
    name: "Stone",
    light: "#E0E0E0",
    dark: "#616161",
    backgroundGradient:
      "radial-gradient(circle at top right, #606c88 0%, #3f4c6b 100%)", // Cool slate grey
  },
  obsidian: {
    name: "Obsidian",
    light: "#BDBDBD",
    dark: "#212121",
    backgroundGradient:
      "linear-gradient(to bottom, #000000, #434343)", // Pure black to charcoal
  },
  slate: {
    name: "Slate",
    light: "#ECEFF1",
    dark: "#455A64",
    backgroundGradient:
      "linear-gradient(315deg, #2b4162 0%, #12100e 74%)", // Dark blue-grey
  },
  marble: {
    name: "Marble",
    light: "#F5F5F5",
    dark: "#9E9E9E",
    backgroundGradient:
      "linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)", // Soft white/grey
  },
  amethyst: {
    name: "Amethyst",
    light: "#F3E5F5",
    dark: "#7B1FA2",
    backgroundGradient:
      "radial-gradient(circle at bottom left, #4A00E0 0%, #8E2DE2 100%)", // Deep purple
  },
} as const;

export type BoardTheme = keyof typeof BOARD_THEMES;

export const OPPONENT_NAMES = [
  // Classic/Russian
  "Grandmaster Vladimir",
  "Igor the Terrible",
  "Boris the Blade",
  "Sergei of Siberia",
  "Dimitri the Destroyer",
  "Garry Gambit",
  "Anatoly Analysis",

  // Female
  "Olga of the Open File",
  "Natasha Knight",
  "Svetlana Strategy",
  "Queen Catherine",
  "Maria Mate",
  "Alexandra Attack",
  "Valentina Victory",
  "Polina Pin",

  // Computer / Tech
  "The Iron Engine",
  "Deep Blue's Cousin",
  "Undefined Variable",
  "System Process 9000",
  "Neural Net Zero",
  "Checkmate Chassis",
  "Bishop Bot",
  "Rook Rookie",
  "Pawn Star",
  "Knight Rider",
  "A.I. Al",
  "Silicon Sorcerer",
  "Execute.exe",
  "Runtime Error",
  "Stack Overflow",
  "Binary Beast",
  "Logic Gate",
  "Mainframe Monster",

  // Sassy / Personality
  "I Let You Win",
  "Too Easy",
  "Why Do You Try?",
  "Calculated Risk",
  "Predictable Human",
  "GG EZ",
  "Try Harder",
  "Not Even Trying",
  "404 Skill Not Found",

  // Wizards & Fantasy
  "Gandalf the Grey Square",
  "Saruman the White Pieces",
  "Merlin the Mate",
  "Harry Patzer",
  "Albus Dumble-draw",
  "Lord of the Kings",
  "Samwise Gam-bit",
  "Rook of Rohan",
  "Knight of Gondor",
  "Sauron's Sicilian",
  "Bilbo Bishop",
];
