const ScoreBoard = ({ score, moves, streak, bestMatch, level, progress, gifts, latestGift, nextGiftLevel, claimedGiftIds, onClaimGift }) => {
  // Une liste unique permet d'afficher les tuiles de statistiques avec le meme rendu.
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

      <div className="gift-panel">
        <div className="gift-panel-header">
          <span>Cadeaux</span>
          <strong>{gifts.length}</strong>
        </div>

        <div className="latest-gift">
          {latestGift ? (
            <>
              <img src={latestGift.image} alt="" aria-hidden="true" />
              <div>
                <span>Dernier cadeau</span>
                <strong>{latestGift.name}</strong>
              </div>
            </>
          ) : (
            <>
              <div className="gift-placeholder" aria-hidden="true">?</div>
              <div>
                <span>Prochain cadeau</span>
                <strong>Niveau {nextGiftLevel}</strong>
              </div>
            </>
          )}
        </div>

        {gifts.length > 0 && (
          <div className="gift-list" aria-label="Cadeaux debloques">
            {gifts.map((gift) => {
              const isClaimed = claimedGiftIds.includes(gift.id);

              return (
                <button
                  type="button"
                  className={`gift-badge ${isClaimed ? "is-claimed" : ""}`}
                  key={gift.id}
                  title={`${gift.name} - niveau ${gift.level} - +${gift.rewardPoints} points`}
                  onClick={() => onClaimGift(gift.id)}
                  disabled={isClaimed}
                >
                  <img src={gift.image} alt="" aria-hidden="true" />
                  <span>{gift.level}</span>
                  <small>{isClaimed ? "OK" : `+${gift.rewardPoints}`}</small>
                </button>
              );
            })}
          </div>
        )}

        <p>Prochain au niveau {nextGiftLevel}</p>
      </div>
    </aside>
  );
};

export default ScoreBoard;
