// used this prompt to generate this code: "please create a code where two players can play battleship on a 28x85 flipboard of black-and-white dots. Each player has a 41x28 playfield on their side of the flipboard, separated by a 3-column divider. Players take turns clicking on the opponent's field to guess ship locations. Ships are represented as 2x2 blocks of white dots, and hits/misses are indicated by flipping the corresponding dot to white/black. The game should enforce standard battleship rules, including no adjacent ships and turn-based play. Include hover effects to highlight potential target cells on the opponent's field."
// the code is barely functional and doesn't fully work as intended. there's still a lot of bugs but it's a start.


"use client";

import { useState, useRef, useEffect } from "react";

// Removed FONT constant and textToPixels function as they are no longer needed.
export default function FlipboardGame() {
  // State for hover effect
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);
  // Flipboard and playfield config
  const rows = 28;
  const cols = 85;
  const dividerWidth = 3; // 3 columns for divider
  const fieldCols = Math.floor((cols - dividerWidth) / 2); // 41
  const fieldRows = rows; // 28
  const sectionSize = 2; // Each ship section is 2x2 dots

  // Battleship config
  const shipLengths = [5, 4, 3, 3, 2, 2, 1]; // 7 ships per player
  const numPlayers = 2;

  // Helper: create empty field
  function createEmptyField() {
    return Array.from({ length: fieldRows }, () => Array(fieldCols).fill(0));
  }

  // Helper: random ship placement with no adjacent ships
  function placeShips() {
    // 0 = empty, 1 = ship, -1 = blocked (adjacent)
    const field = createEmptyField();
    const ships = [];
    for (const len of shipLengths) {
      let placed = false;
      for (let tries = 0; tries < 100 && !placed; tries++) {
        // Random orientation
        const horizontal = Math.random() < 0.5;
        const maxRow = horizontal ? fieldRows - sectionSize : fieldRows - sectionSize * len;
        const maxCol = horizontal ? fieldCols - sectionSize * len : fieldCols - sectionSize;
        const row = Math.floor(Math.random() * (maxRow + 1));
        const col = Math.floor(Math.random() * (maxCol + 1));
        // Check if fits
        let fits = true;
        for (let i = 0; i < len; i++) {
          for (let dr = -1; dr <= sectionSize; dr++) {
            for (let dc = -1; dc <= sectionSize; dc++) {
              const rr = row + (horizontal ? dr : i * sectionSize + dr);
              const cc = col + (horizontal ? i * sectionSize + dc : dc);
              if (
                rr >= 0 && rr < fieldRows &&
                cc >= 0 && cc < fieldCols &&
                field[rr][cc] !== 0
              ) {
                fits = false;
              }
            }
          }
        }
        if (!fits) continue;
        // Place ship
        const shipSections = [];
        for (let i = 0; i < len; i++) {
          for (let dr = 0; dr < sectionSize; dr++) {
            for (let dc = 0; dc < sectionSize; dc++) {
              const rr = row + (horizontal ? dr : i * sectionSize + dr);
              const cc = col + (horizontal ? i * sectionSize + dc : dc);
              field[rr][cc] = 1;
              shipSections.push([rr, cc]);
            }
          }
        }
        // Block adjacent
        for (let i = 0; i < len; i++) {
          for (let dr = -1; dr <= sectionSize; dr++) {
            for (let dc = -1; dc <= sectionSize; dc++) {
              const rr = row + (horizontal ? dr : i * sectionSize + dr);
              const cc = col + (horizontal ? i * sectionSize + dc : dc);
              if (
                rr >= 0 && rr < fieldRows &&
                cc >= 0 && cc < fieldCols &&
                field[rr][cc] === 0
              ) {
                field[rr][cc] = -1;
              }
            }
          }
        }
        ships.push({ len, horizontal, row, col, sections: shipSections });
        placed = true;
      }
    }
    // Clean up blocked
    for (let r = 0; r < fieldRows; r++) {
      for (let c = 0; c < fieldCols; c++) {
        if (field[r][c] === -1) field[r][c] = 0;
      }
    }
    return { field, ships };
  }

  // State: fields, hits, misses, turn, animating misses
  const [fields, setFields] = useState(() => [placeShips(), placeShips()]);
  const [hits, setHits] = useState([
    createEmptyField(),
    createEmptyField(),
  ]);
  const [misses, setMisses] = useState([
    createEmptyField(),
    createEmptyField(),
  ]);
  const [turn, setTurn] = useState(0); // 0 or 1
  const [animFrame, setAnimFrame] = useState(0);

  // Animate misses (flip color)
  useEffect(() => {
    const id = setInterval(() => setAnimFrame(f => f + 1), 500);
    return () => clearInterval(id);
  }, []);

  // Handle click on a flipboard cell
  function handleFlipboardCellClick(r: number, c: number) {
    // Only allow clicking on opponent's field
    const oppFieldStart = turn === 0 ? fieldCols + dividerWidth : 0;
    const oppFieldEnd = turn === 0 ? cols : fieldCols;
    if (c < oppFieldStart || c >= oppFieldEnd) return;
    // Convert to field-relative coordinates
    const relCol = c - oppFieldStart;
    const relRow = r;
    // Only allow clicking if not already hit/missed
    if (hits[turn][relRow][relCol] || misses[turn][relRow][relCol]) return;
    // Check if hit or miss
    const opponentField = turn === 0 ? fields[1].field : fields[0].field;
    if (opponentField[relRow][relCol] === 1) {
      // Register hit
      setHits(prev => {
        const next = prev.map(arr => arr.map(row => [...row]));
        next[turn][relRow][relCol] = 1;
        return next;
      });
      // Do not switch player on hit
    } else {
      // Register miss
      setMisses(prev => {
        const next = prev.map(arr => arr.map(row => [...row]));
        next[turn][relRow][relCol] = 1;
        return next;
      });
      // Switch player after a short delay
      setTimeout(() => {
        setTurn(t => 1 - t);
      }, 500);
    }
  }

  // Build flipboard pixels
  const pixels: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );
  // Draw divider
  for (let r = 0; r < rows; r++) {
    for (let c = fieldCols; c < fieldCols + dividerWidth; c++) {
      pixels[r][c] = true;
    }
  }
  // Draw hits, misses, and ships for both fields
  for (let p = 0; p < numPlayers; p++) {
    const fieldStart = p === 0 ? 0 : fieldCols + dividerWidth;
    for (let r = 0; r < fieldRows; r++) {
      for (let c = 0; c < fieldCols; c++) {
        if (hits[p][r][c]) {
          pixels[r][fieldStart + c] = true; // hit = white
        } else if (misses[p][r][c]) {
          // Animate miss: flip color
          pixels[r][fieldStart + c] = animFrame % 2 === 0;
        } else if (fields[p].field[r][c] === 1) {
          // Show ships as white dots (for player's own side only)
          if (p === turn) {
            pixels[r][fieldStart + c] = true;
          }
        }
      }
    }
  }
  // Draw hover effect: only flip to white if not a ship location
  if (hovered) {
    if (hovered.col < fieldCols) {
      // Hovering on left side, highlight right side
      const otherCol = hovered.col + fieldCols + dividerWidth;
      // Only flip if not a ship location for player 2
      if (fields[1].field[hovered.row][hovered.col] !== 1) {
        pixels[hovered.row][otherCol] = true;
      }
    } else if (hovered.col >= fieldCols + dividerWidth) {
      // Hovering on right side, highlight left side
      const otherCol = hovered.col - fieldCols - dividerWidth;
      // Only flip if not a ship location for player 1
      if (fields[0].field[hovered.row][otherCol] !== 1) {
        pixels[hovered.row][otherCol] = true;
      }
    }
  }

  // Render playfields below flipboard
  // Always show the current player's ships below, matching the flipboard
  function renderPlayfield(playerIdx: number) {
    // Show the current player's field for both playfields
    const { field } = fields[turn];
    return (
      <div
        className="grid border border-gray-400"
        style={{
          gridTemplateColumns: `repeat(${fieldCols}, 12px)`,
          gridTemplateRows: `repeat(${fieldRows}, 12px)`,
          gap: 1,
          margin: 4,
        }}
      >
        {field.flatMap((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: cell === 1 ? "#4ade80" : "#222",
                borderRadius: "2px",
              }}
            />
          ))
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Flipboard grid */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          width: `${cols * 10}px`,
          height: `${rows * 10}px`,
          gap: "1px",
        }}
      >
        {pixels.flatMap((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              style={{
                backgroundColor: cell ? "white" : "black",
                cursor:
                  // Only allow clicking on opponent's field and not already hit/missed
                  ((turn === 0 && c >= fieldCols + dividerWidth) || (turn === 1 && c < fieldCols)) &&
                  !(hits[turn][r][c - (turn === 0 ? fieldCols + dividerWidth : 0)] || misses[turn][r][c - (turn === 0 ? fieldCols + dividerWidth : 0)])
                    ? "pointer"
                    : "default",
              }}
              className="rounded-sm"
              onClick={() => handleFlipboardCellClick(r, c)}
              onMouseEnter={() => setHovered({ row: r, col: c })}
              onMouseLeave={() => setHovered(null)}
            />
          ))
        )}
      </div>
      {/* Playfields below */}
      <div className="flex flex-row gap-8 mt-4">
        <div>
          <div className="text-center mb-1 text-xs">Player 1</div>
          {renderPlayfield(0)}
        </div>
        <div>
          <div className="text-center mb-1 text-xs">Player 2</div>
          {renderPlayfield(1)}
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-400">Current turn: Player {turn + 1}</div>
    </div>
  );
}
