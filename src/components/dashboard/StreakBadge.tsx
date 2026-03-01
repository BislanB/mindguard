import { useAppStore } from '../../store/index.js';

export function StreakBadge() {
  const calculateStreak = useAppStore((s) => s.calculateStreak);
  const streak = calculateStreak();

  if (streak === 0) return null;

  const fire = streak >= 30 ? '🔥🔥🔥' : streak >= 14 ? '🔥🔥' : streak >= 7 ? '🔥' : '✨';

  return (
    <div className="streak-badge">
      <span style={{ fontSize: 28 }}>{fire}</span>
      <div>
        <div className="streak-badge__number">{streak}</div>
        <div className="streak-badge__text">
          {streak === 1 ? 'день подряд' : streak < 5 ? 'дня подряд' : 'дней подряд'}
        </div>
      </div>
    </div>
  );
}
