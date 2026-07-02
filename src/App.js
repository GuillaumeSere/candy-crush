import { useEffect, useRef, useState } from "react";
import blueCandy from './images/blue-candy.png';
import greenCandy from './images/green-candy.png';
import orangeCandy from './images/orange-candy.png';
import purpleCandy from './images/purple-candy.png';
import redCandy from './images/red-candy.png';
import yellowCandy from './images/yellow-candy.png';
import blank from './images/blank.png';
import ScoreBoard from "./components/ScoreBoard";

const width = 8;
const boardSize = width * width;
const candyDetails = [
    { src: blueCandy, name: "Bonbon bleu", accent: "#45c9ff" },
    { src: orangeCandy, name: "Bonbon orange", accent: "#ff9a3d" },
    { src: purpleCandy, name: "Bonbon violet", accent: "#b86bff" },
    { src: redCandy, name: "Bonbon rouge", accent: "#ff5c7a" },
    { src: yellowCandy, name: "Bonbon jaune", accent: "#ffd447" },
    { src: greenCandy, name: "Bonbon vert", accent: "#59dc8f" }
];
const candyColors = candyDetails.map((candy) => candy.src);
const candyBySrc = candyDetails.reduce((candies, candy) => {
    candies[candy.src] = candy;
    return candies;
}, {});

const randomCandy = () => candyColors[Math.floor(Math.random() * candyColors.length)];

const swapCandies = (board, sourceIndex, targetIndex) => {
    const nextBoard = [...board];
    const draggedCandy = nextBoard[sourceIndex];
    nextBoard[sourceIndex] = nextBoard[targetIndex];
    nextBoard[targetIndex] = draggedCandy;
    return nextBoard;
};

const isAdjacent = (sourceIndex, targetIndex) => {
    if (sourceIndex === null || targetIndex === null) return false;

    const sourceRow = Math.floor(sourceIndex / width);
    const targetRow = Math.floor(targetIndex / width);
    const sourceColumn = sourceIndex % width;
    const targetColumn = targetIndex % width;

    return Math.abs(sourceRow - targetRow) + Math.abs(sourceColumn - targetColumn) === 1;
};

const findMatches = (board) => {
    const matches = new Set();
    const groups = [];

    for (let row = 0; row < width; row++) {
        let column = 0;

        while (column < width) {
            const start = row * width + column;
            const candy = board[start];
            let runLength = 1;

            while (
                column + runLength < width &&
                candy !== blank &&
                board[start + runLength] === candy
            ) {
                runLength++;
            }

            if (candy !== blank && runLength >= 3) {
                const group = Array.from({ length: runLength }, (_, offset) => start + offset);
                group.forEach((index) => matches.add(index));
                groups.push(group);
            }

            column += runLength;
        }
    }

    for (let column = 0; column < width; column++) {
        let row = 0;

        while (row < width) {
            const start = row * width + column;
            const candy = board[start];
            let runLength = 1;

            while (
                row + runLength < width &&
                candy !== blank &&
                board[start + runLength * width] === candy
            ) {
                runLength++;
            }

            if (candy !== blank && runLength >= 3) {
                const group = Array.from({ length: runLength }, (_, offset) => start + offset * width);
                group.forEach((index) => matches.add(index));
                groups.push(group);
            }

            row += runLength;
        }
    }

    const longest = groups.reduce((longestGroup, group) => Math.max(longestGroup, group.length), 0);

    return { matches, groups, longest };
};

const collapseBoard = (board) => {
    const nextBoard = Array(boardSize).fill(blank);

    for (let column = 0; column < width; column++) {
        let writeIndex = boardSize - width + column;

        for (let row = width - 1; row >= 0; row--) {
            const readIndex = row * width + column;

            if (board[readIndex] !== blank) {
                nextBoard[writeIndex] = board[readIndex];
                writeIndex -= width;
            }
        }

        while (writeIndex >= 0) {
            nextBoard[writeIndex] = randomCandy();
            writeIndex -= width;
        }
    }

    return nextBoard;
};

const buildFreshBoard = () => {
    const board = [];

    for (let index = 0; index < boardSize; index++) {
        const availableCandies = candyColors.filter((candy) => {
            const makesRowMatch =
                index % width >= 2 &&
                board[index - 1] === candy &&
                board[index - 2] === candy;
            const makesColumnMatch =
                index >= width * 2 &&
                board[index - width] === candy &&
                board[index - width * 2] === candy;

            return !makesRowMatch && !makesColumnMatch;
        });

        board.push(availableCandies[Math.floor(Math.random() * availableCandies.length)]);
    }

    return board;
};

const findHint = (board) => {
    for (let index = 0; index < boardSize; index++) {
        const neighbours = [];

        if (index % width < width - 1) neighbours.push(index + 1);
        if (index < boardSize - width) neighbours.push(index + width);

        for (const neighbour of neighbours) {
            const swappedBoard = swapCandies(board, index, neighbour);
            const { matches } = findMatches(swappedBoard);

            if (matches.size > 0) {
                return [index, neighbour];
            }
        }
    }

    return [];
};

const buildPlayableBoard = () => {
    let board = buildFreshBoard();
    let attempts = 0;

    while (findHint(board).length === 0 && attempts < 50) {
        board = buildFreshBoard();
        attempts++;
    }

    return board;
};

const App = () => {

    const [currentColorArrangement, setCurrentColorArrangement] = useState(() => buildPlayableBoard());
    const [scoreDisplay, setScoreDisplay] = useState(0);
    const [moves, setMoves] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestMatch, setBestMatch] = useState(0);
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [matchedSquares, setMatchedSquares] = useState(new Set());
    const [hintSquares, setHintSquares] = useState([]);
    const [invalidSquares, setInvalidSquares] = useState(new Set());
    const [isResolving, setIsResolving] = useState(false);
    const [message, setMessage] = useState("Pret");
    const currentBoard = useRef(currentColorArrangement);
    const draggedSquare = useRef(null);
    const droppedSquare = useRef(null);
    const timers = useRef([]);

    useEffect(() => {
        currentBoard.current = currentColorArrangement;
    }, [currentColorArrangement]);

    useEffect(() => {
        return () => {
            timers.current.forEach((timer) => clearTimeout(timer));
        };
    }, []);

    const clearTimers = () => {
        timers.current.forEach((timer) => clearTimeout(timer));
        timers.current = [];
    };

    const schedule = (callback, delay) => {
        const timer = setTimeout(() => {
            timers.current = timers.current.filter((queuedTimer) => queuedTimer !== timer);
            callback();
        }, delay);

        timers.current.push(timer);
    };

    const resolveBoard = (board, cascade = 1) => {
        const { matches, longest } = findMatches(board);

        if (matches.size === 0) {
            const completedCascades = cascade - 1;

            setMatchedSquares(new Set());
            setStreak(completedCascades > 1 ? completedCascades : 0);

            if (findHint(board).length === 0) {
                setCurrentColorArrangement(buildPlayableBoard());
                setMessage("Nouveau mix");
            } else if (completedCascades > 1) {
                setMessage(`Combo x${completedCascades}`);
            }

            setIsResolving(false);
            return;
        }

        const matchedIndexes = new Set(matches);
        setMatchedSquares(matchedIndexes);
        setScoreDisplay((score) => score + matchedIndexes.size * cascade);
        setBestMatch((best) => Math.max(best, longest));
        setStreak(cascade);
        setMessage(cascade > 1 ? `Cascade x${cascade}` : longest >= 5 ? "Mega match" : longest === 4 ? "Super match" : "Joli match");

        schedule(() => {
            const clearedBoard = board.map((candy, index) => (matchedIndexes.has(index) ? blank : candy));
            setCurrentColorArrangement(clearedBoard);

            schedule(() => {
                const collapsedBoard = collapseBoard(clearedBoard);
                setCurrentColorArrangement(collapsedBoard);
                setMatchedSquares(new Set());

                schedule(() => resolveBoard(collapsedBoard, cascade + 1), 220);
            }, 120);
        }, 320);
    };

    const attemptSwap = (sourceIndex, targetIndex) => {
        if (isResolving || sourceIndex === null || targetIndex === null || sourceIndex === targetIndex) return;

        setHintSquares([]);

        if (!isAdjacent(sourceIndex, targetIndex)) {
            setSelectedSquare(targetIndex);
            setMessage("Case voisine");
            return;
        }

        const boardBeforeMove = currentBoard.current;
        const swappedBoard = swapCandies(boardBeforeMove, sourceIndex, targetIndex);
        const { matches } = findMatches(swappedBoard);

        setSelectedSquare(null);
        setIsResolving(true);
        setCurrentColorArrangement(swappedBoard);

        if (matches.size === 0) {
            setMessage("Pas de match");
            setInvalidSquares(new Set([sourceIndex, targetIndex]));

            schedule(() => {
                setCurrentColorArrangement(boardBeforeMove);
                setInvalidSquares(new Set());
                setIsResolving(false);
            }, 380);
            return;
        }

        setMoves((moveCount) => moveCount + 1);
        resolveBoard(swappedBoard);
    };

    const handleCandyClick = (index) => {
        if (isResolving) return;

        if (selectedSquare === null) {
            setSelectedSquare(index);
            return;
        }

        if (selectedSquare === index) {
            setSelectedSquare(null);
            return;
        }

        attemptSwap(selectedSquare, index);
    };

    const dragStart = (event, index) => {
        if (isResolving) return;

        event.dataTransfer.effectAllowed = "move";
        draggedSquare.current = index;
        setSelectedSquare(index);
    };

    const dragDrop = (event, index) => {
        event.preventDefault();
        droppedSquare.current = index;
    };

    const dragEnd = () => {
        attemptSwap(draggedSquare.current, droppedSquare.current);
        draggedSquare.current = null;
        droppedSquare.current = null;
    };

    const restartGame = () => {
        clearTimers();
        setCurrentColorArrangement(buildPlayableBoard());
        setScoreDisplay(0);
        setMoves(0);
        setStreak(0);
        setBestMatch(0);
        setSelectedSquare(null);
        setMatchedSquares(new Set());
        setHintSquares([]);
        setInvalidSquares(new Set());
        setIsResolving(false);
        setMessage("Pret");
    };

    const shuffleBoard = () => {
        if (isResolving) return;

        clearTimers();
        setCurrentColorArrangement(buildPlayableBoard());
        setSelectedSquare(null);
        setMatchedSquares(new Set());
        setHintSquares([]);
        setInvalidSquares(new Set());
        setMessage("Plateau mixe");
    };

    const showHint = () => {
        if (isResolving) return;

        const hint = findHint(currentBoard.current);

        if (hint.length === 0) {
            shuffleBoard();
            return;
        }

        setHintSquares(hint);
        setMessage("Indice");
        schedule(() => setHintSquares([]), 1300);
    };

    const level = Math.floor(scoreDisplay / 120) + 1;
    const progress = Math.min(100, Math.round(((scoreDisplay % 120) / 120) * 100));

    return (
        <main className="app-shell">
            <section className="game-stage" aria-label="Candy Crush">
                <header className="topbar">
                    <div className="title-block">
                        <p>Sweet arcade</p>
                        <h1>Candy Crush</h1>
                    </div>
                    <div className="actions" aria-label="Actions de partie">
                        <button type="button" className="action-button" onClick={showHint} disabled={isResolving}>
                            Indice
                        </button>
                        <button type="button" className="action-button" onClick={shuffleBoard} disabled={isResolving}>
                            Melanger
                        </button>
                        <button type="button" className="action-button action-button-primary" onClick={restartGame}>
                            Rejouer
                        </button>
                    </div>
                </header>

                <div className="play-layout">
                    <div className="board-wrap">
                        <div className={`game-board ${isResolving ? "is-resolving" : ""}`} aria-label="Plateau de jeu">
                            {currentColorArrangement.map((candyColor, index) => {
                                const candy = candyBySrc[candyColor] || { name: "Case vide", accent: "#ffffff" };
                                const classNames = [
                                    "candy-cell",
                                    selectedSquare === index ? "is-selected" : "",
                                    matchedSquares.has(index) ? "is-matched" : "",
                                    invalidSquares.has(index) ? "is-invalid" : "",
                                    hintSquares.includes(index) ? "is-hint" : "",
                                    isResolving ? "is-disabled" : ""
                                ].filter(Boolean).join(" ");

                                return (
                                    <button
                                        key={`${index}-${candyColor}`}
                                        type="button"
                                        className={classNames}
                                        style={{
                                            "--candy-accent": candy.accent,
                                            "--cell-delay": `${(index % width) * 12}ms`
                                        }}
                                        aria-label={`${candy.name} ${index + 1}`}
                                        data-id={index}
                                        draggable={!isResolving}
                                        onClick={() => handleCandyClick(index)}
                                        onDragStart={(event) => dragStart(event, index)}
                                        onDragOver={(event) => event.preventDefault()}
                                        onDragEnter={(event) => event.preventDefault()}
                                        onDrop={(event) => dragDrop(event, index)}
                                        onDragEnd={dragEnd}
                                    >
                                        <img src={candyColor} alt="" aria-hidden="true" draggable={false} />
                                    </button>
                                );
                            })}
                        </div>
                        <div className={`status-bubble ${message ? "is-visible" : ""}`} aria-live="polite">
                            {message}
                        </div>
                    </div>

                    <ScoreBoard
                        score={scoreDisplay}
                        moves={moves}
                        streak={streak}
                        bestMatch={bestMatch}
                        level={level}
                        progress={progress}
                    />
                </div>
            </section>
        </main>
    );
}

export default App;
