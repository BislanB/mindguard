import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/index.js';
import { QuickCards } from '../components/dashboard/QuickCards.js';
import { StreakBadge } from '../components/dashboard/StreakBadge.js';

export function DashboardPage() {
  const navigate = useNavigate();
  const reports = useAppStore((s) => s.reports);
  const currentFocusSession = useAppStore((s) => s.currentFocusSession);

  const today = new Date().toISOString().slice(0, 10);
  const todayReport = reports.find((r) => !r.isDraft && r.date.slice(0, 10) === today);

  const dateStr = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">MindGuard</h1>
          <div className="page-header__subtitle">{dateStr}</div>
        </div>
      </div>

      <StreakBadge />

      <QuickCards />

      {!todayReport ? (
        <button
          className="btn btn--primary btn--lg"
          onClick={() => navigate('/report')}
        >
          Создать отчёт за сегодня
        </button>
      ) : (
        <button
          className="btn btn--secondary btn--lg"
          onClick={() => navigate(`/report/${todayReport.id}`)}
        >
          Редактировать отчёт
        </button>
      )}

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button
          className="btn btn--secondary"
          style={{ flex: 1 }}
          onClick={() => navigate('/analytics')}
        >
          Аналитика
        </button>
        <button
          className="btn btn--secondary"
          style={{ flex: 1 }}
          onClick={() => navigate('/templates')}
        >
          Шаблоны
        </button>
      </div>

      {/* Mini focus session indicator */}
      {currentFocusSession && currentFocusSession.status === 'running' && (
        <div
          className="card"
          style={{ marginTop: 16, cursor: 'pointer', textAlign: 'center' }}
          onClick={() => navigate('/focus')}
        >
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            Фокус-сессия активна
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(currentFocusSession.remainingSeconds)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>
            Нажмите для управления
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
