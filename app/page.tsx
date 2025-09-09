"use client";

import { useState, useRef } from "react";

// 5x7 font (A–Z, 0–9, space, punctuation)
const FONT: Record<string, string[]> = {
  A: ["01110","10001","10001","11111","10001","10001","10001"],
  B: ["11110","10001","10001","11110","10001","10001","11110"],
  C: ["01111","10000","10000","10000","10000","10000","01111"],
  D: ["11110","10001","10001","10001","10001","10001","11110"],
  E: ["11111","10000","10000","11110","10000","10000","11111"],
  F: ["11111","10000","10000","11110","10000","10000","10000"],
  G: ["01111","10000","10000","10011","10001","10001","01111"],
  H: ["10001","10001","10001","11111","10001","10001","10001"],
  I: ["11111","00100","00100","00100","00100","00100","11111"],
  J: ["00111","00010","00010","00010","10010","10010","01100"],
  K: ["10001","10010","10100","11000","10100","10010","10001"],
  L: ["10000","10000","10000","10000","10000","10000","11111"],
  M: ["10001","11011","10101","10101","10001","10001","10001"],
  N: ["10001","10001","11001","10101","10011","10001","10001"],
  O: ["01110","10001","10001","10001","10001","10001","01110"],
  P: ["11110","10001","10001","11110","10000","10000","10000"],
  Q: ["01110","10001","10001","10001","10101","10010","01101"],
  R: ["11110","10001","10001","11110","10100","10010","10001"],
  S: ["01111","10000","10000","01110","00001","00001","11110"],
  T: ["11111","00100","00100","00100","00100","00100","00100"],
  U: ["10001","10001","10001","10001","10001","10001","01110"],
  V: ["10001","10001","10001","10001","01010","01010","00100"],
  W: ["10001","10001","10001","10101","10101","10101","01010"],
  X: ["10001","01010","00100","00100","00100","01010","10001"],
  Y: ["10001","01010","00100","00100","00100","00100","00100"],
  Z: ["11111","00001","00010","00100","01000","10000","11111"],

  "0": ["01110","10001","10011","10101","11001","10001","01110"],
  "1": ["00100","01100","00100","00100","00100","00100","01110"],
  "2": ["01110","10001","00001","00010","00100","01000","11111"],
  "3": ["11110","00001","00001","01110","00001","00001","11110"],
  "4": ["00010","00110","01010","10010","11111","00010","00010"],
  "5": ["11111","10000","10000","11110","00001","00001","11110"],
  "6": ["01110","10000","10000","11110","10001","10001","01110"],
  "7": ["11111","00001","00010","00100","01000","10000","10000"],
  "8": ["01110","10001","10001","01110","10001","10001","01110"],
  "9": ["01110","10001","10001","01111","00001","00001","01110"],

  " ": ["00000","00000","00000","00000","00000","00000","00000"],
  "!": ["00100","00100","00100","00100","00100","00000","00100"],
  ".": ["00000","00000","00000","00000","00000","00000","00100"],
  ":": ["00000","00100","00000","00000","00100","00000","00000"]
};

// Convert text to centered boolean grid
function textToPixels(text: string, rows: number, cols: number): boolean[][] {
  const fontHeight = 7;
  const fontWidth = 5;
  const spacing = 1;

  // Render each row of text
  const renderedRows: string[] = Array(fontHeight).fill("");
  for (const char of text.toUpperCase()) {
    const glyph = FONT[char] ?? FONT[" "];
    for (let r = 0; r < fontHeight; r++) {
      renderedRows[r] += glyph[r] + "0".repeat(spacing);
    }
  }

  // Build the grid (rows × cols)
  const grid: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );
  const startRow = Math.floor((rows - fontHeight) / 2);
  const startCol = Math.floor((cols - renderedRows[0].length) / 2);

  for (let r = 0; r < fontHeight; r++) {
    for (let c = 0; c < renderedRows[r].length; c++) {
      if (renderedRows[r][c] === "1") {
        if (
          startRow + r >= 0 &&
          startRow + r < rows &&
          startCol + c >= 0 &&
          startCol + c < cols
        ) {
          grid[startRow + r][startCol + c] = true;
        }
      }
    }
  }
  return grid;
}

export default function FlipboardGame() {
  const rows = 28;
  const cols = 85;

  const [phase, setPhase] = useState<
    "ready" | "waiting" | "go" | "result" | "toosoon"
  >("ready");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [reaction, setReaction] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Game logic
  const startRound = () => {
    clearTimeout(timerRef.current as NodeJS.Timeout);
    setReaction(null);
    setPhase("waiting");
    const delay = 1000 + Math.random() * 2000;
    timerRef.current = setTimeout(() => {
      setStartTime(performance.now());
      setPhase("go");
    }, delay);
  };

  const handleClick = () => {
    if (phase === "ready") {
      startRound();
    } else if (phase === "waiting") {
      clearTimeout(timerRef.current as NodeJS.Timeout);
      setPhase("toosoon");
    } else if (phase === "go" && startTime) {
      const ms = performance.now() - startTime;
      setReaction(ms);
      setPhase("result");
    } else if (phase === "result" || phase === "toosoon") {
      setPhase("ready");
    }
  };

  // Choose message
  let pixels: boolean[][] = [];

if (phase === "go") {
  // All dots ON (white)
  pixels = Array.from({ length: rows }, () =>
    Array(cols).fill(true)
  );
} else {
  // Other phases show text
  let message = "";
  if (phase === "ready") message = "CLICK TO START";
  if (phase === "waiting") message = "WAIT";
  if (phase === "toosoon") message = "TOO SOON";
  if (phase === "result") message = `${reaction?.toFixed(0)}MS GOOD JOB`;

  pixels = textToPixels(message, rows, cols);
}

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Flipboard grid */}
      <div
        className="grid cursor-pointer"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          width: `${cols * 10}px`,
          height: `${rows * 10}px`,
          gap: "1px",
        }}
        onClick={handleClick}
      >
        {pixels.flatMap((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              style={{
                backgroundColor: cell ? "white" : "black",
              }}
              className="rounded-sm"
            />
          ))
        )}
      </div>
    </div>
  );
}
