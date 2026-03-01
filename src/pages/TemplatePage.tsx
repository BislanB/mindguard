import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/index.js';
import { TemplateEditor } from '../components/templates/TemplateEditor.js';
import { v4 as uuid } from 'uuid';
import type { ReportTemplate } from '../types/index.js';
import { ALL_SECTIONS, ALL_FIELDS } from '../utils/defaultTemplates.js';

export function TemplatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const templates = useAppStore((s) => s.templates);
  const saveTemplate = useAppStore((s) => s.saveTemplate);
  const deleteTemplate = useAppStore((s) => s.deleteTemplate);

  if (id) {
    const template = templates.find((t) => t.id === id);
    if (!template) {
      return (
        <div className="empty-state">
          <div className="empty-state__text">Шаблон не найден</div>
          <button className="btn btn--primary" onClick={() => navigate('/templates')}>Назад</button>
        </div>
      );
    }
    return (
      <TemplateEditor
        template={template}
        onSave={async (t) => {
          await saveTemplate(t);
          navigate('/templates');
        }}
        onCancel={() => navigate('/templates')}
      />
    );
  }

  const handleCreate = () => {
    const now = new Date().toISOString();
    const newTemplate: ReportTemplate = {
      id: uuid(),
      name: 'Новый шаблон',
      description: '',
      isDefault: false,
      sections: ALL_SECTIONS.map((s) => ({ ...s })),
      fields: ALL_FIELDS.map((f) => ({ ...f, enabled: false })),
      createdAt: now,
      updatedAt: now,
    };
    navigate(`/templates/${newTemplate.id}`);
    saveTemplate(newTemplate);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Шаблоны</h1>
        <button className="btn btn--primary btn--sm" onClick={handleCreate}>Создать</button>
      </div>

      {templates.map((t) => (
        <div key={t.id} className="card" style={{ marginBottom: 10, cursor: 'pointer' }}>
          <div onClick={() => navigate(`/templates/${t.id}`)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>{t.name}</span>
              {t.isDefault && <span className="badge badge--accent">По умолчанию</span>}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
              {t.description}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {t.sections.filter((s) => s.enabled).length} секций · {t.fields.filter((f) => f.enabled).length} полей
            </div>
          </div>
          {!t.isDefault && (
            <button
              className="btn btn--ghost btn--sm"
              style={{ color: 'var(--danger)', marginTop: 8 }}
              onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}
            >
              Удалить
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
