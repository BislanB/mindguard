import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/index.js';
import { ConfirmModal } from '../components/common/Modal.js';

export function HistoryPage() {
  const navigate = useNavigate();
  const reports = useAppStore((s) => s.reports);
  const templates = useAppStore((s) => s.templates);
  const deleteReport = useAppStore((s) => s.deleteReport);

  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'7' | '30' | 'all'>('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const now = Date.now();
  const periodMs = period === '7' ? 7 * 86400000 : period === '30' ? 30 * 86400000 : Infinity;

  const filtered = reports
    .filter((r) => {
      if (period !== 'all' && now - new Date(r.date).getTime() > periodMs) return false;
      if (templateFilter !== 'all' && r.templateId !== templateFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesTemplate = r.templateName.toLowerCase().includes(q);
        const matchesValues = Object.values(r.values).some(
          (v) => typeof v === 'string' && v.toLowerCase().includes(q),
        );
        if (!matchesTemplate && !matchesValues) return false;
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleDelete = () => {
    if (deleteId) {
      deleteReport(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">История</h1>
      </div>

      <div className="search-bar">
        <svg className="search-bar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          className="search-bar__input"
          placeholder="Поиск..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-row">
        <select className="select" value={period} onChange={(e) => setPeriod(e.target.value as any)}>
          <option value="7">7 дней</option>
          <option value="30">30 дней</option>
          <option value="all">Все</option>
        </select>
        <select className="select" value={templateFilter} onChange={(e) => setTemplateFilter(e.target.value)}>
          <option value="all">Все шаблоны</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📋</div>
          <div className="empty-state__text">
            {reports.length === 0 ? 'Нет отчётов. Создайте первый!' : 'Ничего не найдено'}
          </div>
          {reports.length === 0 && (
            <button className="btn btn--primary" onClick={() => navigate('/report')}>
              Создать отчёт
            </button>
          )}
        </div>
      ) : (
        filtered.map((r) => {
          const date = new Date(r.date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
          const mood = r.values.mood;
          const energy = r.values.energy;
          const sleep = r.values.sleep_hours;

          return (
            <div key={r.id} className="history-item" onClick={() => navigate(`/report/${r.id}`)}>
              <div style={{ flex: 1 }}>
                <div className="history-item__date">{date}</div>
                <div className="history-item__template">
                  {r.templateName}
                  {r.isDraft && <span className="badge badge--warning" style={{ marginLeft: 6 }}>Черновик</span>}
                </div>
                <div className="history-item__metrics">
                  {mood != null && <span>😊 {mood}</span>}
                  {energy != null && <span>⚡ {energy}</span>}
                  {sleep != null && <span>😴 {sleep}ч</span>}
                </div>
              </div>
              <button
                className="btn btn--ghost btn--sm"
                style={{ color: 'var(--danger)', padding: '4px 8px' }}
                onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }}
              >
                ✕
              </button>
            </div>
          );
        })
      )}

      <ConfirmModal
        open={deleteId !== null}
        title="Удалить отчёт?"
        message="Это действие нельзя отменить."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
