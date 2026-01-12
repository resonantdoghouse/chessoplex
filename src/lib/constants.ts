export const BOARD_THEMES = {
  default: { name: "Classic", light: "#f0d9b5", dark: "#b58863" },
  emerald: { name: "Emerald", light: "#E8F5E9", dark: "#2E7D32" },
  royal: { name: "Royal", light: "#E3F2FD", dark: "#1565C0" },
  stone: { name: "Stone", light: "#E0E0E0", dark: "#616161" },
  obsidian: { name: "Obsidian", light: "#BDBDBD", dark: "#212121" },
  slate: { name: "Slate", light: "#ECEFF1", dark: "#455A64" },
  marble: { name: "Marble", light: "#F5F5F5", dark: "#9E9E9E" },
  amethyst: { name: "Amethyst", light: "#F3E5F5", dark: "#7B1FA2" },
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
