const ScoreBoard = ({ score, moves, streak, bestMatch, level, progress }) => {
  const stats = [
    { label: "Score", value: score },
    { label: "Coups", value: moves },
    { label: "Combo", value: streak > 0 ? `x${streak}` : "-" },
    { label: "Record", value: bestMatch || "-" }
  ];

  return (
    <aside className="score-board" aria-label="Statistiques">
      {stats.map((stat) => (
        <div className="stat-tile" key={stat.label}>
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
        </div>
      ))}

      <div className="level-panel">
        <div className="level-row">
          <span>Niveau {level}</span>
          <strong>{progress}%</strong>
        </div>
        <div className="level-track" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
    </aside>
  );
};

export default ScoreBoard;
