interface CorrelationCardProps {
  labelA: string;
  labelB: string;
  coefficient: number;
  insight: string;
}

export function CorrelationCard({ labelA, labelB, coefficient, insight }: CorrelationCardProps) {
  const abs = Math.abs(coefficient);
  const color =
    coefficient > 0.3 ? 'var(--success)' :
    coefficient < -0.3 ? 'var(--danger)' :
    'var(--text-muted)';

  return (
    <div className="correlation-card">
      <div className="correlation-card__fields">
        {labelA} ↔ {labelB}
      </div>
      <div className="correlation-card__bar">
        <div
          className="correlation-card__fill"
          style={{
            width: `${Math.max(abs * 100, 5)}%`,
            background: color,
          }}
        />
      </div>
      <div className="correlation-card__insight">{insight}</div>
    </div>
  );
}
