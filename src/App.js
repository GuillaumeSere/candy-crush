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
const savedGameKey = "candy-crush-current-game";
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

const createGiftImage = (accent, label) => {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="${label}">
            <defs>
                <linearGradient id="giftFrame" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.94" />
                    <stop offset="100%" stop-color="${accent}" stop-opacity="0.35" />
                </linearGradient>
            </defs>
            <rect x="8" y="8" width="104" height="104" rx="24" fill="url(#giftFrame)" stroke="${accent}" stroke-width="4" />
            <rect x="25" y="32" width="70" height="56" rx="18" fill="${accent}" opacity="0.95" />
            <rect x="27" y="34" width="66" height="52" rx="16" fill="#ffffff" opacity="0.18" />
            <path d="M43 46c0-8 7-14 15-14s15 6 15 14c0 8-7 10-15 18-8-8-15-10-15-18Z" fill="#ffffff" opacity="0.92" />
            <path d="M77 46c0-8 7-14 15-14s15 6 15 14c0 8-7 10-15 18-8-8-15-10-15-18Z" fill="#ffffff" opacity="0.92" />
            <path d="M57 56h6v20h-6zM67 56h6v20h-6zM49 74h28v6H49z" fill="#ffffff" opacity="0.86" />
            <circle cx="60" cy="88" r="7" fill="#ffffff" opacity="0.88" />
            <text x="60" y="104" text-anchor="middle" font-size="10" font-family="Arial, Helvetica, sans-serif" fill="#351a53" font-weight="700">CADEAU</text>
        </svg>
    `;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const giftCatalog = [
    { level: 5, name: "Coffret bleu", image: createGiftImage("#45c9ff", "Coffret bleu") },
    { level: 10, name: "Tresor vert", image: createGiftImage("#59dc8f", "Tresor vert") },
    { level: 15, name: "Bonus orange", image: createGiftImage("#ff9a3d", "Bonus orange") },
    { level: 20, name: "Cristal violet", image: createGiftImage("#b86bff", "Cristal violet") },
    { level: 25, name: "Rubis sucre", image: createGiftImage("#ff5c7a", "Rubis sucre") },
    { level: 30, name: "Etoile doree", image: createGiftImage("#ffd447", "Etoile doree") }
];

const randomCandy = () => candyColors[Math.floor(Math.random() * candyColors.length)];
const getGiftRewardPoints = (giftIndex) => (giftIndex + 1) * 50;

// Ajoute un cadeau tous les 5 niveaux, en reutilisant le catalogue en boucle.
const buildGiftsForLevel = (level) => {
    const giftCount = Math.floor(level / 5);

    return Array.from({ length: giftCount }, (_, index) => {
        const catalogGift = giftCatalog[index % giftCatalog.length];
        const rewardLevel = (index + 1) * 5;

        return {
            ...catalogGift,
            id: `gift-${rewardLevel}`,
            level: rewardLevel,
            rewardPoints: getGiftRewardPoints(index)
        };
    });
};

const getNextGiftLevel = (level) => Math.ceil((level + 1) / 5) * 5;

// Retourne une nouvelle grille avec deux cases inversees.
const swapCandies = (board, sourceIndex, targetIndex) => {
    const nextBoard = [...board];
    const draggedCandy = nextBoard[sourceIndex];
    nextBoard[sourceIndex] = nextBoard[targetIndex];
    nextBoard[targetIndex] = draggedCandy;
    return nextBoard;
};

// Deux cases sont voisines si elles se touchent horizontalement ou verticalement.
const isAdjacent = (sourceIndex, targetIndex) => {
    if (sourceIndex === null || targetIndex === null) return false;

    const sourceRow = Math.floor(sourceIndex / width);
    const targetRow = Math.floor(targetIndex / width);
    const sourceColumn = sourceIndex % width;
    const targetColumn = targetIndex % width;

    return Math.abs(sourceRow - targetRow) + Math.abs(sourceColumn - targetColumn) === 1;
};

// Parcourt la grille pour trouver tous les groupes de 3 bonbons ou plus.
const findMatches = (board) => {
    const matches = new Set();
    const groups = [];

    // Recherche des alignements horizontaux, ligne par ligne.
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

    // Recherche des alignements verticaux, colonne par colonne.
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

// Fait tomber les bonbons dans chaque colonne et remplit le haut avec de nouveaux bonbons.
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

// Cree une grille sans match deja present, pour que la partie commence proprement.
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

// Cherche un mouvement jouable en testant les echanges avec les voisins de droite et du bas.
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

// Reconstruit la grille tant qu'aucun mouvement possible n'a ete trouve.
const buildPlayableBoard = () => {
    let board = buildFreshBoard();
    let attempts = 0;

    while (findHint(board).length === 0 && attempts < 50) {
        board = buildFreshBoard();
        attempts++;
    }

    return board;
};

// Evite de restaurer une sauvegarde incomplete ou incompatible avec les bonbons actuels.
const isSavedBoardValid = (board) => (
    Array.isArray(board) &&
    board.length === boardSize &&
    board.every((candy) => candyColors.includes(candy))
);

// Recupere la partie depuis localStorage, avec des valeurs par defaut si besoin.
const loadSavedGame = () => {
    try {
        const savedGame = JSON.parse(localStorage.getItem(savedGameKey));

        if (!savedGame || !isSavedBoardValid(savedGame.board)) {
            return null;
        }

        return {
            board: savedGame.board,
            score: Number.isFinite(savedGame.score) ? savedGame.score : 0,
            moves: Number.isFinite(savedGame.moves) ? savedGame.moves : 0,
            streak: Number.isFinite(savedGame.streak) ? savedGame.streak : 0,
            bestMatch: Number.isFinite(savedGame.bestMatch) ? savedGame.bestMatch : 0,
            claimedGiftIds: Array.isArray(savedGame.claimedGiftIds) ? savedGame.claimedGiftIds : []
        };
    } catch {
        return null;
    }
};

const App = () => {

    const savedGame = useRef(loadSavedGame());
    const [currentColorArrangement, setCurrentColorArrangement] = useState(() => savedGame.current?.board || buildPlayableBoard());
    const [scoreDisplay, setScoreDisplay] = useState(() => savedGame.current?.score || 0);
    const [moves, setMoves] = useState(() => savedGame.current?.moves || 0);
    const [streak, setStreak] = useState(() => savedGame.current?.streak || 0);
    const [bestMatch, setBestMatch] = useState(() => savedGame.current?.bestMatch || 0);
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [matchedSquares, setMatchedSquares] = useState(new Set());
    const [hintSquares, setHintSquares] = useState([]);
    const [invalidSquares, setInvalidSquares] = useState(new Set());
    const [isResolving, setIsResolving] = useState(false);
    const [message, setMessage] = useState(savedGame.current ? "Partie restauree" : "Pret");
    const [levelNotification, setLevelNotification] = useState(null);
    const [giftNotification, setGiftNotification] = useState(null);
    const [claimedGiftIds, setClaimedGiftIds] = useState(() => savedGame.current?.claimedGiftIds || []);
    const currentBoard = useRef(currentColorArrangement);
    const previousLevel = useRef(Math.floor(scoreDisplay / 120) + 1);
    const draggedSquare = useRef(null);
    const droppedSquare = useRef(null);
    const timers = useRef([]);

    useEffect(() => {
        // Garde une reference toujours a jour pour les handlers et timers asynchrones.
        currentBoard.current = currentColorArrangement;
    }, [currentColorArrangement]);

    useEffect(() => {
        // Sauvegarde automatiquement la progression apres chaque changement important.
        const gameToSave = {
            board: currentColorArrangement,
            score: scoreDisplay,
            moves,
            streak,
            bestMatch,
            claimedGiftIds
        };

        try {
            localStorage.setItem(savedGameKey, JSON.stringify(gameToSave));
        } catch {
            setMessage("Sauvegarde indisponible");
        }
    }, [currentColorArrangement, scoreDisplay, moves, streak, bestMatch, claimedGiftIds]);

    useEffect(() => {
        // Un niveau correspond a 120 points, avec une notification au passage de palier.
        const nextLevel = Math.floor(scoreDisplay / 120) + 1;

        if (nextLevel > previousLevel.current) {
            setLevelNotification(`Niveau ${nextLevel}`);
            setMessage(`Niveau ${nextLevel}`);
            schedule(() => setLevelNotification(null), 1800);

            if (nextLevel % 5 === 0) {
                const availableGifts = buildGiftsForLevel(nextLevel);
                const unlockedGift = availableGifts[availableGifts.length - 1];

                setGiftNotification(unlockedGift);
                setMessage(`Cadeau: ${unlockedGift.name}`);
                schedule(() => setGiftNotification(null), 2400);
            }
        }

        previousLevel.current = nextLevel;
    }, [scoreDisplay]);

    useEffect(() => {
        return () => {
            timers.current.forEach((timer) => clearTimeout(timer));
        };
    }, []);

    const clearTimers = () => {
        // Annule les animations en attente lors d'un reset ou d'un melange.
        timers.current.forEach((timer) => clearTimeout(timer));
        timers.current = [];
    };

    const schedule = (callback, delay) => {
        // Centralise les timeouts pour pouvoir les nettoyer proprement.
        const timer = setTimeout(() => {
            timers.current = timers.current.filter((queuedTimer) => queuedTimer !== timer);
            callback();
        }, delay);

        timers.current.push(timer);
    };

    // Resout les matchs, applique le score, puis relance la resolution si une cascade apparait.
    const resolveBoard = (board, cascade = 1) => {
        const { matches, longest } = findMatches(board);

        if (matches.size === 0) {
            // Quand la grille est stabilisee, on verifie qu'elle contient encore un coup possible.
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

        // Sequence visuelle: faire disparaitre, laisser tomber, puis chercher les cascades.
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

    // Tente un echange et l'annule si le mouvement ne cree aucun match.
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
        // Premier clic: selection. Deuxieme clic: tentative d'echange avec la case choisie.
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
        // Le drag and drop partage la meme logique de validation que le clic.
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
        // Remet toute la partie dans son etat initial et supprime la sauvegarde.
        clearTimers();
        localStorage.removeItem(savedGameKey);
        previousLevel.current = 1;
        setCurrentColorArrangement(buildPlayableBoard());
        setScoreDisplay(0);
        setMoves(0);
        setStreak(0);
        setBestMatch(0);
        setClaimedGiftIds([]);
        setSelectedSquare(null);
        setMatchedSquares(new Set());
        setHintSquares([]);
        setInvalidSquares(new Set());
        setIsResolving(false);
        setLevelNotification(null);
        setGiftNotification(null);
        setMessage("Pret");
    };

    const shuffleBoard = () => {
        // Melange manuel: on repart d'une grille jouable sans toucher au score.
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
        // Affiche temporairement deux cases dont l'echange produira un match.
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

    const claimGift = (giftId) => {
        if (isResolving || claimedGiftIds.includes(giftId)) return;

        const giftToClaim = buildGiftsForLevel(level).find((gift) => gift.id === giftId);

        if (!giftToClaim) return;

        setClaimedGiftIds((currentGiftIds) => [...currentGiftIds, giftId]);
        setScoreDisplay((score) => score + giftToClaim.rewardPoints);
        setMessage(`Cadeau reclame: +${giftToClaim.rewardPoints} points`);
    };

    const level = Math.floor(scoreDisplay / 120) + 1;
    const progress = Math.min(100, Math.round(((scoreDisplay % 120) / 120) * 100));
    const unlockedGifts = buildGiftsForLevel(level);
    const latestGift = unlockedGifts[unlockedGifts.length - 1] || null;
    const nextGiftLevel = getNextGiftLevel(level);

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
                        <div className={`level-toast ${levelNotification ? "is-visible" : ""}`} aria-live="assertive">
                            <span>Bravo !</span>
                            <strong>{levelNotification}</strong>
                        </div>
                        <div className={`gift-toast ${giftNotification ? "is-visible" : ""}`} aria-live="assertive">
                            {giftNotification && (
                                <>
                                    <img src={giftNotification.image} alt="" aria-hidden="true" />
                                    <span>Nouveau cadeau</span>
                                    <strong>{giftNotification.name}</strong>
                                </>
                            )}
                        </div>
                    </div>

                    <ScoreBoard
                        score={scoreDisplay}
                        moves={moves}
                        streak={streak}
                        bestMatch={bestMatch}
                        level={level}
                        progress={progress}
                        gifts={unlockedGifts}
                        latestGift={latestGift}
                        nextGiftLevel={nextGiftLevel}
                        claimedGiftIds={claimedGiftIds}
                        onClaimGift={claimGift}
                    />
                </div>
            </section>
        </main>
    );
}

export default App;
