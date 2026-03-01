import { useState } from 'react';
import { useAppStore } from '../store/index.js';
import { getAverages, getTrendData, getCorrelation, generateInsights } from '../utils/analytics.js';
import { TrendChart } from '../components/analytics/TrendChart.js';
import { CorrelationCard } from '../components/analytics/CorrelationCard.js';

const trendConfigs = [
  { key: 'sleep_hours', title: 'Сон', color: '#818cf8', suffix: ' ч' },
  { key: 'energy', title: 'Энергия', color: '#fbbf24', suffix: '/10' },
  { key: 'stress', title: 'Стресс', color: '#f87171', suffix: '/10' },
  { key: 'mood', title: 'Настроение', color: '#4ade80', suffix: '/10' },
  { key: 'deep_work_hours', title: 'Глубокая работа', color: '#6366f1', suffix: ' ч' },
  { key: 'steps', title: 'Шаги', color: '#22d3ee' },
];

const correlationConfigs = [
  { a: 'sleep_hours', b: 'energy', labelA: 'Сон', labelB: 'Энергия' },
  { a: 'deep_work_hours', b: 'mood', labelA: 'Глубокая работа', labelB: 'Настроение' },
  { a: 'stress', b: 'mood', labelA: 'Стресс', labelB: 'Настроение' },
  { a: 'sleep_hours', b: 'mood', labelA: 'Сон', labelB: 'Настроение' },
];

const avgDisplay = [
  { key: 'sleep_hours', label: 'Сон', emoji: '😴', suffix: ' ч' },
  { key: 'energy', label: 'Энергия', emoji: '⚡', suffix: '/10' },
  { key: 'stress', label: 'Стресс', emoji: '😰', suffix: '/10' },
  { key: 'mood', label: 'Настроение', emoji: '😊', suffix: '/10' },
  { key: 'deep_work_hours', label: 'Работа', emoji: '🎯', suffix: ' ч' },
  { key: 'overall_rating', label: 'Оценка', emoji: '🌟', suffix: '/10' },
];

export function AnalyticsPage() {
  const reports = useAppStore((s) => s.reports);
  const [days, setDays] = useState(7);

  const averages = getAverages(reports, days);
  const insights = generateInsights(reports);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Аналитика</h1>
      </div>

      <div className="tabs">
        <button
          className={`tabs__item${days === 7 ? ' tabs__item--active' : ''}`}
          onClick={() => setDays(7)}
        >
          7 дней
        </button>
        <button
          className={`tabs__item${days === 30 ? ' tabs__item--active' : ''}`}
          onClick={() => setDays(30)}
        >
          30 дней
        </button>
      </div>

      {/* Averages */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card__header">Средние значения</div>
        <div className="quick-cards" style={{ margin: 0 }}>
          {avgDisplay.map((m) => (
            <div key={m.key} className="quick-card" style={{ boxShadow: 'none', border: 'none', padding: 8 }}>
              <div style={{ fontSize: 16 }}>{m.emoji}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {averages[m.key] !== undefined ? `${averages[m.key]}${m.suffix}` : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trends */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Тренды</h2>
        {trendConfigs.map((c) => (
          <TrendChart
            key={c.key}
            data={getTrendData(reports, c.key, days)}
            title={c.title}
            color={c.color}
            suffix={c.suffix}
          />
        ))}
      </div>

      {/* Correlations */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Корреляции</h2>
        {correlationConfigs.map((c) => {
          const corr = getCorrelation(reports, c.a, c.b);
          return (
            <CorrelationCard
              key={`${c.a}-${c.b}`}
              labelA={c.labelA}
              labelB={c.labelB}
              coefficient={corr.coefficient}
              insight={corr.insight}
            />
          );
        })}
      </div>

      {/* Insights */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Инсайты</h2>
        {insights.map((text, i) => (
          <div key={i} className="card" style={{ marginBottom: 8, fontSize: 14 }}>
            💡 {text}
          </div>
        ))}
      </div>
    </div>
  );
}
