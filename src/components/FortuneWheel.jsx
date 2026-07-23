import { useMemo, useState } from "react";

const createRewardIcon = (icon, background) => {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="${icon}">
            <rect x="10" y="10" width="100" height="100" rx="26" fill="${background}" opacity="0.92" />
            <text x="60" y="72" text-anchor="middle" font-size="56" font-family="Segoe UI Emoji, Apple Color Emoji, sans-serif">${icon}</text>
        </svg>
    `;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const wheelRewards = [
    { id: "score-60", label: "Score +60", type: "score", amount: 60, color: "#45c9ff", icon: createRewardIcon("⭐", "#45c9ff") },
    { id: "gift-1", label: "Cadeau", type: "gift", color: "#ffd447", icon: createRewardIcon("🎁", "#ffd447") },
    { id: "level-1", label: "+1 niveau", type: "level", color: "#59dc8f", icon: createRewardIcon("🏆", "#59dc8f") },
    { id: "score-100", label: "Score +100", type: "score", amount: 100, color: "#ff5c7a", icon: createRewardIcon("💎", "#ff5c7a") },
    { id: "gift-2", label: "Bonus gift", type: "gift", color: "#b86bff", icon: createRewardIcon("🎀", "#b86bff") },
    { id: "score-80", label: "Score +80", type: "score", amount: 80, color: "#ff9a3d", icon: createRewardIcon("✨", "#ff9a3d") }
];

const FortuneWheel = ({ onReward, onEnterGame }) => {
    const [rotation, setRotation] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState(null);

    const segmentAngle = 360 / wheelRewards.length;
    const wheelRadius = 100;

    const wheelGradient = useMemo(() => {
        const stops = wheelRewards.map((reward, index) => {
            const start = index * segmentAngle;
            const end = start + segmentAngle;
            return `${reward.color} ${start}deg ${end}deg`;
        });

        return `conic-gradient(${stops.join(", ")})`;
    }, [segmentAngle]);

    const spinWheel = () => {
        if (spinning) return;

        const winningIndex = Math.floor(Math.random() * wheelRewards.length);
        const reward = wheelRewards[winningIndex];
        const spins = 360 * 4 + (360 - (winningIndex * segmentAngle + segmentAngle / 2));

        setSpinning(true);
        setRotation((currentRotation) => currentRotation + spins);

        window.setTimeout(() => {
            setSpinning(false);
            setResult(reward);
            onReward(reward);
            onEnterGame();
        }, 3200);
    };

    return (
        <section className="fortune-screen" aria-label="Mini jeu roue de la fortune">
            <div className="fortune-card">
                <div className="fortune-header">
                    <p>Mini jeu bonus</p>
                    <h2>Roue de la fortune</h2>
                </div>

                <p className="fortune-copy">
                    Lance la roue pour débloquer un bonus avant d’entrer dans Candy Crush.
                </p>

                <div className="fortune-stage">
                    <div className="fortune-pointer" aria-hidden="true" />
                    <div
                        className={`fortune-wheel ${spinning ? "is-spinning" : ""}`}
                        style={{
                            background: wheelGradient,
                            transform: `rotate(${rotation}deg)`
                        }}
                    >
                        {wheelRewards.map((reward, index) => {
                            const angle = index * segmentAngle + segmentAngle / 2;
                            const angleInRadians = (angle - 90) * (Math.PI / 180);
                            const x = Math.cos(angleInRadians) * wheelRadius;
                            const y = Math.sin(angleInRadians) * wheelRadius;

                            return (
                                <span
                                    key={reward.id}
                                    className="fortune-label"
                                    style={{
                                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                                    }}
                                >
                                    <img src={reward.icon} alt={reward.label} aria-hidden="true" />
                                </span>
                            );
                        })}

                        <div className="fortune-wheel-center">GO</div>
                    </div>
                </div>

                <div className="fortune-actions">
                    <button type="button" className="action-button action-button-primary" onClick={spinWheel} disabled={spinning}>
                        Lancer la roue
                    </button>
                </div>

                <div className={`fortune-result ${result ? "is-visible" : ""}`} aria-live="polite">
                    {result ? `Bonus obtenu : ${result.label}` : "Aucun bonus encore"}
                </div>
            </div>
        </section>
    );
};

export default FortuneWheel;
