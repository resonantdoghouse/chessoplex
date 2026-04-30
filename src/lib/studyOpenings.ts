export interface StudyMove {
  san: string;
  tip: string;
}

export interface StudyOpening {
  id: string;
  name: string;
  eco: string;
  category: string;
  studyColor: "white" | "black";
  difficulty: "beginner" | "intermediate" | "advanced";
  description: string;
  keyIdeas: string[];
  moves: StudyMove[];
}

export const STUDY_CATEGORIES = [
  "Open Games",
  "Semi-Open Games",
  "Closed Games",
  "Indian Defenses",
  "Flank Openings",
] as const;

export type StudyCategory = (typeof STUDY_CATEGORIES)[number];

// isUserTurn: true when the user (studyColor side) is to move
export function isUserTurn(opening: StudyOpening, moveIndex: number): boolean {
  const isWhiteMove = moveIndex % 2 === 0;
  return (opening.studyColor === "white") === isWhiteMove;
}

export const STUDY_OPENINGS: StudyOpening[] = [
  // ── Open Games ───────────────────────────────────────────────────────────────
  {
    id: "italian",
    name: "Italian Game",
    eco: "C50",
    category: "Open Games",
    studyColor: "white",
    difficulty: "beginner",
    description:
      "One of the oldest openings. White develops quickly, targets the f7 square with the bishop, and prepares a central pawn break with d4.",
    keyIdeas: [
      "Develop pieces rapidly toward the center",
      "Bc4 eyes the weak f7 square",
      "c3 prepares the d4 pawn break",
      "Fight for center control with d4",
    ],
    moves: [
      { san: "e4", tip: "Open the center — freeing your queen and bishop while controlling d5 and f5." },
      { san: "e5", tip: "Black mirrors, claiming central space. The game is symmetric for now." },
      { san: "Nf3", tip: "Develop the knight and attack Black's e5 pawn. Piece development with tempo." },
      { san: "Nc6", tip: "Black defends e5 and develops a piece. The most natural reply." },
      { san: "Bc4", tip: "The Italian move! The bishop points at the weak f7 square and controls the d5 outpost." },
      { san: "Bc5", tip: "Giuoco Piano — Black responds symmetrically, fighting for d4." },
      { san: "c3", tip: "Prepare the d4 advance. This small move sets up a powerful center." },
      { san: "Nf6", tip: "Black develops and counterattacks e4." },
      { san: "d4", tip: "Strike in the center! White gains space and opens lines for all pieces." },
    ],
  },
  {
    id: "ruy-lopez",
    name: "Ruy Lopez",
    eco: "C60",
    category: "Open Games",
    studyColor: "white",
    difficulty: "intermediate",
    description:
      "The most classical of all openings. White pins the knight defending e5, creating long-term strategic pressure without immediate tactics.",
    keyIdeas: [
      "Bb5 pins Nc6, indirectly pressuring e5",
      "Castle early for king safety",
      "Re1 supports the e4 pawn",
      "Queenside pawn expansion with a4 and d4",
    ],
    moves: [
      { san: "e4", tip: "\"Best by test\" — the most popular first move at grandmaster level." },
      { san: "e5", tip: "The principled reply, contesting central control." },
      { san: "Nf3", tip: "Attack e5 and develop. The most natural second move." },
      { san: "Nc6", tip: "Defend e5 with development." },
      { san: "Bb5", tip: "The Ruy Lopez! Pin the knight — if it moves, e5 is undefended. Long-term positional pressure." },
      { san: "a6", tip: "Morphy Defense — Black challenges the bishop immediately." },
      { san: "Ba4", tip: "Retreat to maintain the pin. The bishop stays active on the a4-e8 diagonal." },
      { san: "Nf6", tip: "Black attacks e4. Development with threats." },
      { san: "O-O", tip: "Castle and connect the rooks. Prepare Re1 to support e4 next." },
    ],
  },
  {
    id: "kings-gambit",
    name: "King's Gambit",
    eco: "C30",
    category: "Open Games",
    studyColor: "white",
    difficulty: "intermediate",
    description:
      "A romantic, aggressive opening — White sacrifices a pawn for rapid development, an open f-file, and attacking chances against the Black king.",
    keyIdeas: [
      "Offer f-pawn to accelerate development",
      "Open the f-file for the rook",
      "Fast Bc4 + Nf3 + d4 development",
      "Attack the king before Black consolidates",
    ],
    moves: [
      { san: "e4", tip: "Open the game for tactical battles." },
      { san: "e5", tip: "Black fights for the center." },
      { san: "f4", tip: "The King's Gambit! Offer a pawn to destroy Black's center and open the f-file." },
      { san: "exf4", tip: "Black accepts the gambit, winning material but falling behind in development." },
      { san: "Nf3", tip: "Develop and stop ...g5-g4 ideas. Rapid mobilization is White's compensation." },
      { san: "d6", tip: "Black consolidates. Now White must act before the extra pawn counts." },
      { san: "d4", tip: "Dominate the center. White's two center pawns give excellent piece activity." },
      { san: "g5", tip: "Black tries to hold the f4 pawn. An ambitious but risky counter." },
      { san: "Nc3", tip: "Develop and keep pressure on the center. White's initiative is worth the pawn." },
    ],
  },
  {
    id: "scotch",
    name: "Scotch Game",
    eco: "C44",
    category: "Open Games",
    studyColor: "white",
    difficulty: "beginner",
    description:
      "White immediately challenges the center with d4 on move three. Results in open, tactical positions with clear plans for both sides.",
    keyIdeas: [
      "Open center with d4 immediately",
      "Trade pawns to activate pieces",
      "Nxd4 recentralizes the knight",
      "Fight for e4 square",
    ],
    moves: [
      { san: "e4", tip: "Control the center." },
      { san: "e5", tip: "Black claims central space." },
      { san: "Nf3", tip: "Develop and attack e5." },
      { san: "Nc6", tip: "Defend e5 and develop." },
      { san: "d4", tip: "The Scotch! Immediately challenge Black's center pawn on move three." },
      { san: "exd4", tip: "Black captures, eliminating White's d-pawn." },
      { san: "Nxd4", tip: "Recapture and centralize the knight — now it occupies a powerful d4 post." },
      { san: "Nf6", tip: "Black develops and attacks e4." },
      { san: "Nxc6", tip: "Exchange knight for knight, giving Black doubled c-pawns as a structural weakness." },
    ],
  },

  // ── Semi-Open Games ──────────────────────────────────────────────────────────
  {
    id: "sicilian-najdorf",
    name: "Sicilian — Najdorf",
    eco: "B90",
    category: "Semi-Open Games",
    studyColor: "black",
    difficulty: "advanced",
    description:
      "The most popular opening at elite level. Black avoids symmetry, fights for d4, and builds complex counterplay while White attacks on the kingside.",
    keyIdeas: [
      "...c5 fights for d4 without blocking the d-pawn",
      "Asymmetric pawn structure creates imbalances",
      "...a6 stops Bb5+ and prepares ...b5 queenside expansion",
      "Black counterattacks, not just defends",
    ],
    moves: [
      { san: "e4", tip: "White opens the game — now you need a fighting reply." },
      { san: "c5", tip: "The Sicilian! Fight for d4 asymmetrically. Your c-pawn controls d4 without blocking the d-pawn." },
      { san: "Nf3", tip: "White develops and prepares d4." },
      { san: "d6", tip: "Prepare Nf6. This flexible move supports a future ...e5." },
      { san: "d4", tip: "White opens the center." },
      { san: "cxd4", tip: "Trade pawns to undermine White's center. Now White's center is gone." },
      { san: "Nxd4", tip: "White recaptures in the center." },
      { san: "Nf6", tip: "Develop the knight and attack e4." },
      { san: "Nc3", tip: "White defends e4." },
      { san: "a6", tip: "The Najdorf move! Stop Bb5+ and prepare the ...b5 queenside advance. Maximum flexibility." },
    ],
  },
  {
    id: "french",
    name: "French Defense",
    eco: "C00",
    category: "Semi-Open Games",
    studyColor: "black",
    difficulty: "intermediate",
    description:
      "Solid and counterattacking. Black builds a pawn chain on e6-d5 and strikes back at White's center with ...c5, sacrificing short-term activity for long-term structure.",
    keyIdeas: [
      "Build solid pawn chain e6-d5",
      "Counterattack with ...c5 against White's d4",
      "Queenside piece activity compensates for cramped position",
      "Activate the bad c8 bishop via ...b6 or exchange",
    ],
    moves: [
      { san: "e4", tip: "White grabs central territory." },
      { san: "e6", tip: "The French! Solid preparation for ...d5. Temporarily passive but structurally sound." },
      { san: "d4", tip: "White builds a strong center." },
      { san: "d5", tip: "Challenge White's center immediately! This is the key move of the French." },
      { san: "Nc3", tip: "White supports e4 — Classical variation." },
      { san: "Nf6", tip: "Attack e4 and develop." },
      { san: "Bg5", tip: "White pins your knight, increasing pressure on d5." },
      { san: "Be7", tip: "Break the pin and prepare to castle. Safe and solid." },
      { san: "e5", tip: "White gains space, pushing your knight back." },
      { san: "Nfd7", tip: "Retreat the knight. Now prepare ...c5 — your main counter in the French!" },
    ],
  },
  {
    id: "caro-kann",
    name: "Caro-Kann Defense",
    eco: "B10",
    category: "Semi-Open Games",
    studyColor: "black",
    difficulty: "intermediate",
    description:
      "A solid, reliable defense. Black supports d5 with c6, avoiding the cramped positions of the French and keeping the c8 bishop active.",
    keyIdeas: [
      "c6 supports d5 without blocking the c8 bishop",
      "Solid pawn structure from the start",
      "Develop the bishop before e6 closes the diagonal",
      "Endgame-oriented — excellent in the long run",
    ],
    moves: [
      { san: "e4", tip: "White opens the center." },
      { san: "c6", tip: "The Caro-Kann! Prepare d5 while keeping the c8 bishop free — unlike the French." },
      { san: "d4", tip: "White builds a full center." },
      { san: "d5", tip: "Challenge! Now e4 is under pressure." },
      { san: "Nc3", tip: "White defends e4 — Classical variation." },
      { san: "dxe4", tip: "Capture! Open the position and free your bishop." },
      { san: "Nxe4", tip: "White recaptures, centralizing the knight." },
      { san: "Bf5", tip: "The key move — develop your bishop before playing ...e6. This is the Caro-Kann's great advantage!" },
      { san: "Ng3", tip: "White chases the bishop." },
      { san: "Bg6", tip: "Retreat the bishop — it stays active on the g6 square." },
    ],
  },
  {
    id: "pirc",
    name: "Pirc Defense",
    eco: "B07",
    category: "Semi-Open Games",
    studyColor: "black",
    difficulty: "intermediate",
    description:
      "A hypermodern counterattacking defense. Black invites White to build a big center, then undermines it with pieces and pawns.",
    keyIdeas: [
      "Let White have the center temporarily",
      "Fianchetto the king's bishop to g7",
      "Undermine with ...c5 or ...e5",
      "Counterattack the center with pieces",
    ],
    moves: [
      { san: "e4", tip: "White opens." },
      { san: "d6", tip: "Prepare ...Nf6 and ...g6. Flexible and hypermodern." },
      { san: "d4", tip: "White builds a big center. Let them — for now." },
      { san: "Nf6", tip: "Attack e4 and prepare the fianchetto setup." },
      { san: "Nc3", tip: "White reinforces the center." },
      { san: "g6", tip: "Prepare to fianchetto. The bishop will be a powerful dragon on g7." },
      { san: "Be3", tip: "White develops and controls d4." },
      { san: "Bg7", tip: "Fianchetto the bishop — now it controls the long diagonal including d4." },
      { san: "Qd2", tip: "White prepares to castle queenside and launch a kingside attack." },
      { san: "c6", tip: "Prepare ...d5 or ...Qa5 counterplay. Stake your claim in the center." },
    ],
  },

  // ── Closed Games ─────────────────────────────────────────────────────────────
  {
    id: "queens-gambit-declined",
    name: "Queen's Gambit Declined",
    eco: "D30",
    category: "Closed Games",
    studyColor: "white",
    difficulty: "intermediate",
    description:
      "A timeless, strategic opening. White offers the c4 pawn to gain center control. When Black declines, a rich positional battle unfolds.",
    keyIdeas: [
      "Offer c4 pawn to dominate the center",
      "Bg5 pins Nf6 and controls d5",
      "Minority attack on the queenside (b4-b5)",
      "Piece coordination for long-term pressure",
    ],
    moves: [
      { san: "d4", tip: "Fight for the center with the d-pawn. A classical approach." },
      { san: "d5", tip: "Black contests the center head-on." },
      { san: "c4", tip: "The Queen's Gambit! Attack d5 and offer to trade a flank pawn for central control." },
      { san: "e6", tip: "Black declines — solidly supports d5." },
      { san: "Nc3", tip: "Develop and support a future e4 advance." },
      { san: "Nf6", tip: "Black develops, attacking e4 if it arrives." },
      { san: "Bg5", tip: "Pin the Nf6! This increases pressure on d5 and threatens to damage Black's pawn structure." },
      { san: "Be7", tip: "Black breaks the pin, preparing to castle." },
      { san: "e3", tip: "Support d4 and prepare Bd3 + Nf3. Solid and purposeful." },
      { san: "O-O", tip: "Black castles to safety." },
    ],
  },
  {
    id: "queens-gambit-accepted",
    name: "Queen's Gambit Accepted",
    eco: "D20",
    category: "Closed Games",
    studyColor: "white",
    difficulty: "beginner",
    description:
      "Black accepts the c4 pawn. White regains it quickly and gains a central pawn majority — leading to open, active play.",
    keyIdeas: [
      "Accept the pawn, then regain with e4",
      "Build strong center with d4 and e4",
      "Rapid piece development",
      "Use central pawn majority for space",
    ],
    moves: [
      { san: "d4", tip: "Secure the center." },
      { san: "d5", tip: "Black fights for the center." },
      { san: "c4", tip: "Offer the gambit pawn." },
      { san: "dxc4", tip: "Black accepts! Now you need to regain this pawn." },
      { san: "e3", tip: "Support d4 and prepare Bxc4 to recapture the pawn." },
      { san: "Nf6", tip: "Black develops and stops e4 for now." },
      { san: "Bxc4", tip: "Recapture the pawn. Your bishop is very active on c4." },
      { san: "e6", tip: "Black solidifies. Now the e6 pawn controls d5." },
      { san: "Nf3", tip: "Develop and stop ...e5. You have excellent central control." },
    ],
  },
  {
    id: "slav",
    name: "Slav Defense",
    eco: "D10",
    category: "Closed Games",
    studyColor: "black",
    difficulty: "intermediate",
    description:
      "A solid defense to the Queen's Gambit. Black supports d5 with c6, keeping the c8 bishop free — unlike the QGD where it gets locked in.",
    keyIdeas: [
      "c6 supports d5 without blocking bishop",
      "...dxc4 accepts the gambit to fight back",
      "Solid, durable pawn structure",
      "Active piece play compensates for passive setup",
    ],
    moves: [
      { san: "d4", tip: "White opens with d4." },
      { san: "d5", tip: "Fight for the center." },
      { san: "c4", tip: "The Queen's Gambit." },
      { san: "c6", tip: "The Slav! Support d5 and keep your c8 bishop free to develop." },
      { san: "Nf3", tip: "White develops." },
      { san: "Nf6", tip: "Develop and fight for the center." },
      { san: "Nc3", tip: "White reinforces the center." },
      { san: "dxc4", tip: "Accept the gambit! Grab the pawn and make White work to get it back." },
      { san: "a4", tip: "White prevents ...b5." },
      { san: "Bf5", tip: "Develop the bishop before White can play e3 to lock it in. This is the key move!" },
    ],
  },

  // ── Indian Defenses ──────────────────────────────────────────────────────────
  {
    id: "kings-indian",
    name: "King's Indian Defense",
    eco: "E60",
    category: "Indian Defenses",
    studyColor: "black",
    difficulty: "advanced",
    description:
      "A dynamic, hypermodern defense beloved by Kasparov and Fischer. Black lets White build a big center, then attacks it with a powerful fianchettoed bishop and central pawn breaks.",
    keyIdeas: [
      "Let White have the center — then attack it",
      "Fianchetto bishop on g7 — a long-range powerhouse",
      "...e5 is the key move to challenge White's center",
      "Kingside attack with ...f5 or ...Ng4",
    ],
    moves: [
      { san: "d4", tip: "White builds the center." },
      { san: "Nf6", tip: "Develop and prepare g6 fianchetto. The KID starts here." },
      { san: "c4", tip: "White expands the center even further." },
      { san: "g6", tip: "Prepare to fianchetto. The bishop on g7 will become an attacking monster." },
      { san: "Nc3", tip: "White reinforces the center." },
      { san: "Bg7", tip: "Fianchetto! This bishop controls the long diagonal. It's your most important piece." },
      { san: "e4", tip: "White establishes a massive center: pawns on c4, d4, and e4." },
      { san: "d6", tip: "Support a future ...e5. Prepare ...Nd7 and then ...e5." },
      { san: "Nf3", tip: "White controls d4 and develops." },
      { san: "O-O", tip: "Castle quickly — the king is safe behind the fianchettoed bishop." },
      { san: "Be2", tip: "White develops and prepares to castle." },
      { san: "e5", tip: "The key KID move! Challenge White's massive center. Open lines for your pieces." },
    ],
  },
  {
    id: "nimzo-indian",
    name: "Nimzo-Indian Defense",
    eco: "E20",
    category: "Indian Defenses",
    studyColor: "black",
    difficulty: "advanced",
    description:
      "A highly principled defense — Black pins White's knight and controls the e4 square, creating lasting strategic pressure and weaknesses in White's pawn structure.",
    keyIdeas: [
      "Bb4 pins Nc3 and controls e4",
      "Force doubled c-pawns to weaken White's structure",
      "Fight for the e4 square throughout the game",
      "Trade bishop for knight only when it creates lasting weaknesses",
    ],
    moves: [
      { san: "d4", tip: "White opens." },
      { san: "Nf6", tip: "Develop. The Indian defense systems all start with ...Nf6." },
      { san: "c4", tip: "White builds the center." },
      { san: "e6", tip: "Prepare ...d5 or ...Bb4. Solid and flexible." },
      { san: "Nc3", tip: "White develops — and creates your opportunity!" },
      { san: "Bb4", tip: "The Nimzo-Indian! Pin the knight. Now Nc3 cannot support e4, giving you control of that square." },
      { san: "e3", tip: "White develops solidly, supporting d4." },
      { san: "O-O", tip: "Castle to safety. Your bishop on b4 is already doing its job." },
      { san: "Bd3", tip: "White develops the bishop toward the kingside." },
      { san: "d5", tip: "Challenge the center. Fight for the critical d5 square." },
    ],
  },
  {
    id: "queens-indian",
    name: "Queen's Indian Defense",
    eco: "E12",
    category: "Indian Defenses",
    studyColor: "black",
    difficulty: "intermediate",
    description:
      "Black avoids the Nimzo-Indian and fianchettos the queen's bishop to b7, fighting for central control from a distance.",
    keyIdeas: [
      "Fianchetto to b7 controls the long diagonal",
      "Fight for e4 and d5 with pieces, not pawns",
      "Flexible — avoid committing pawns early",
      "Strong endgame thanks to solid structure",
    ],
    moves: [
      { san: "d4", tip: "White opens." },
      { san: "Nf6", tip: "Develop and prevent e4." },
      { san: "c4", tip: "White builds the center." },
      { san: "e6", tip: "Solid center. Prepare ...b6 fianchetto." },
      { san: "Nf3", tip: "White avoids Nc3 to prevent the Nimzo-Indian." },
      { san: "b6", tip: "The Queen's Indian! Prepare to fianchetto the bishop to b7." },
      { san: "g3", tip: "White fianchettos too, fighting for the long diagonal." },
      { san: "Bb7", tip: "The bishop is active on b7, controlling e4 and the long diagonal." },
      { san: "Bg2", tip: "White's own fianchetto. A battle of bishops on the long diagonals!" },
      { san: "Be7", tip: "Develop and prepare to castle. Your position is solid and ready to castle." },
    ],
  },

  // ── Flank Openings ───────────────────────────────────────────────────────────
  {
    id: "london",
    name: "London System",
    eco: "D02",
    category: "Flank Openings",
    studyColor: "white",
    difficulty: "beginner",
    description:
      "A solid, low-theory system. White develops the dark-squared bishop to f4 before playing e3, building a reliable setup that works against almost anything Black plays.",
    keyIdeas: [
      "Develop Bf4 before e3 closes the diagonal",
      "Build solid pawn chain: d4-e3-c3",
      "Ne5 outpost gives attacking chances",
      "Consistent setup regardless of Black's moves",
    ],
    moves: [
      { san: "d4", tip: "Secure the center." },
      { san: "d5", tip: "Black claims central space." },
      { san: "Bf4", tip: "The London! Develop the bishop BEFORE playing e3 — after e3, this diagonal is closed." },
      { san: "Nf6", tip: "Black develops." },
      { san: "e3", tip: "Now e3 is safe. The bishop is already out." },
      { san: "e6", tip: "Black solidifies — typical London setup for Black." },
      { san: "Nf3", tip: "Complete development." },
      { san: "c5", tip: "Black counterattacks d4." },
      { san: "c3", tip: "Support d4. Your central pawn chain d4-e3-c3 is rock solid." },
    ],
  },
  {
    id: "kings-indian-attack",
    name: "King's Indian Attack",
    eco: "A07",
    category: "Flank Openings",
    studyColor: "white",
    difficulty: "beginner",
    description:
      "A flexible, easy-to-learn system. White sets up the same structure every game — fianchetto on g2, Nf3, d3, and a kingside attack with e5.",
    keyIdeas: [
      "Same setup regardless of Black's play",
      "Fianchetto bishop on g2 — strong long-term",
      "Castle kingside and launch e5 attack",
      "f4-f5 kingside expansion",
    ],
    moves: [
      { san: "Nf3", tip: "Develop and keep options open. Don't commit your pawns yet." },
      { san: "Nf6", tip: "Black develops." },
      { san: "g3", tip: "Prepare the fianchetto — your bishop will be powerful on g2." },
      { san: "d5", tip: "Black claims the center." },
      { san: "Bg2", tip: "Complete the fianchetto. This bishop will become very active." },
      { san: "c5", tip: "Black builds a solid center with pawns." },
      { san: "O-O", tip: "Castle quickly. Your king is safe behind the fianchettoed bishop." },
      { san: "Nc6", tip: "Black develops the knight." },
      { san: "d3", tip: "Support e4. Build your setup — e4 comes next." },
    ],
  },
  {
    id: "english",
    name: "English Opening",
    eco: "A10",
    category: "Flank Openings",
    studyColor: "white",
    difficulty: "intermediate",
    description:
      "A hypermodern flank opening. White controls the d5 square from c4 and remains flexible, able to transpose into many systems or play independently.",
    keyIdeas: [
      "c4 controls d5 from a distance — hypermodern",
      "Flexible: can transpose to Queen's Gambit or Indian systems",
      "Fianchetto g3-Bg2 for long-term pressure",
      "Queenside expansion with b4",
    ],
    moves: [
      { san: "c4", tip: "The English! Control d5 from a distance. No central pawns yet — pure hypermodernism." },
      { san: "e5", tip: "Black occupies the center. Now you control d5 and fight back." },
      { san: "Nc3", tip: "Develop and control d5 and e4." },
      { san: "Nf6", tip: "Black develops and attacks e4." },
      { san: "g3", tip: "Prepare to fianchetto. The bishop on g2 will be very powerful." },
      { san: "d5", tip: "Black stakes a claim in the center." },
      { san: "cxd5", tip: "Trade! Open the c-file for your rook." },
      { san: "Nxd5", tip: "Black recaptures, centralizing the knight." },
      { san: "Bg2", tip: "Complete the fianchetto. Your bishop eyes d5 and the queenside." },
    ],
  },
];
