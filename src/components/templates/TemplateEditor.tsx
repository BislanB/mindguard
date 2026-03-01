import { useState } from 'react';
import type { ReportTemplate, TemplateField, TemplateSection } from '../../types/index.js';

interface TemplateEditorProps {
  template: ReportTemplate;
  onSave: (t: ReportTemplate) => void;
  onCancel: () => void;
}

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [sections, setSections] = useState<TemplateSection[]>([...template.sections]);
  const [fields, setFields] = useState<TemplateField[]>([...template.fields]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    );
  };

  const toggleField = (key: string) => {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)),
    );
  };

  const toggleShortReport = (key: string) => {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, shortReport: !f.shortReport } : f)),
    );
  };

  const moveSection = (id: string, dir: -1 | 1) => {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const newOrder = sorted[swapIdx].order;
    sorted[swapIdx] = { ...sorted[swapIdx], order: sorted[idx].order };
    sorted[idx] = { ...sorted[idx], order: newOrder };
    setSections(sorted);
  };

  const handleSave = () => {
    onSave({
      ...template,
      name,
      description,
      sections,
      fields,
      updatedAt: new Date().toISOString(),
    });
  };

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Редактор шаблона</h1>
        <button className="btn btn--ghost btn--sm" onClick={onCancel}>Назад</button>
      </div>

      <div className="form-group">
        <label className="form-label">Название</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Описание</label>
        <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      {sortedSections.map((section, idx) => {
        const sectionFields = fields
          .filter((f) => f.section === section.id)
          .sort((a, b) => a.order - b.order);

        const isExpanded = expandedSection === section.id;

        return (
          <div key={section.id} className="card" style={{ marginTop: 12 }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              onClick={() => setExpandedSection(isExpanded ? null : section.id)}
            >
              <span style={{ fontSize: 20 }}>{section.emoji}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{section.name}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={(e) => { e.stopPropagation(); moveSection(section.id, -1); }}
                  disabled={idx === 0}
                  style={{ padding: '2px 6px', fontSize: 16 }}
                >
                  ↑
                </button>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={(e) => { e.stopPropagation(); moveSection(section.id, 1); }}
                  disabled={idx === sortedSections.length - 1}
                  style={{ padding: '2px 6px', fontSize: 16 }}
                >
                  ↓
                </button>
              </div>
              <div
                className={`toggle${section.enabled ? ' toggle--active' : ''}`}
                onClick={(e) => { e.stopPropagation(); toggleSection(section.id); }}
              >
                <div className="toggle__track"><div className="toggle__thumb" /></div>
              </div>
            </div>

            {isExpanded && (
              <div style={{ marginTop: 12 }}>
                {sectionFields.map((field) => (
                  <div key={field.key} className="template-field-row">
                    <span className="template-field-row__label">
                      {field.emoji && `${field.emoji} `}{field.label}
                    </span>
                    <div className="template-field-row__badges">
                      <button
                        className={`chip${field.shortReport ? ' chip--active' : ''}`}
                        onClick={() => toggleShortReport(field.key)}
                        style={{ fontSize: 11, padding: '2px 8px' }}
                        type="button"
                      >
                        Кратко
                      </button>
                    </div>
                    <div
                      className={`toggle${field.enabled ? ' toggle--active' : ''}`}
                      onClick={() => toggleField(field.key)}
                      style={{ transform: 'scale(0.8)' }}
                    >
                      <div className="toggle__track"><div className="toggle__thumb" /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: 24 }}>
        <button className="btn btn--primary btn--lg" onClick={handleSave}>
          Сохранить шаблон
        </button>
      </div>
    </div>
  );
}
