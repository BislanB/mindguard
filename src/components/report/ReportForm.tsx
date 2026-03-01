import { useState, useEffect, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { useAppStore } from '../../store/index.js';
import { FieldRenderer } from '../common/FormFields.js';
import { reportToClipboardText, reportToMarkdown, copyToClipboard } from '../../utils/export.js';
import type { ReportEntry } from '../../types/index.js';

interface ReportFormProps {
  report?: ReportEntry;
  templateId?: string;
  onSave: (report: ReportEntry) => void;
  onCancel: () => void;
}

export function ReportForm({ report, templateId, onSave, onCancel }: ReportFormProps) {
  const templates = useAppStore((s) => s.templates);
  const settings = useAppStore((s) => s.settings);
  const saveReport = useAppStore((s) => s.saveReport);

  const initialTemplateId = report?.templateId ?? templateId ?? settings.defaultTemplateId ?? templates[0]?.id ?? '';
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId);
  const [values, setValues] = useState<Record<string, any>>(report?.values ?? {});
  const [isShortMode, setIsShortMode] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');

  const template = templates.find((t) => t.id === selectedTemplateId) ?? templates[0];

  const setValue = useCallback((key: string, val: any) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!template) return;
    const timer = setInterval(() => {
      const entry: ReportEntry = {
        id: report?.id ?? uuid(),
        templateId: template.id,
        templateName: template.name,
        date: report?.date ?? new Date().toISOString(),
        values,
        isDraft: true,
        createdAt: report?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveReport(entry);
    }, 30000);
    return () => clearInterval(timer);
  }, [values, template, report, saveReport]);

  if (!template) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">📋</div>
        <div className="empty-state__text">Нет шаблонов. Создайте первый в настройках.</div>
      </div>
    );
  }

  const sections = [...template.sections].filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  const handleSave = (isDraft: boolean) => {
    const entry: ReportEntry = {
      id: report?.id ?? uuid(),
      templateId: template.id,
      templateName: template.name,
      date: report?.date ?? new Date().toISOString(),
      values,
      isDraft,
      createdAt: report?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(entry);
  };

  const handleCopy = async (format: 'clipboard' | 'markdown') => {
    const entry: ReportEntry = {
      id: report?.id ?? uuid(),
      templateId: template.id,
      templateName: template.name,
      date: report?.date ?? new Date().toISOString(),
      values,
      isDraft: false,
      createdAt: report?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const text = format === 'clipboard'
      ? reportToClipboardText(entry, template)
      : reportToMarkdown(entry, template);
    await copyToClipboard(text);
    setCopyMsg('Скопировано!');
    setTimeout(() => setCopyMsg(''), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">{report ? 'Редактирование' : 'Новый отчёт'}</h1>
          <div className="page-header__subtitle">{template.name}</div>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={onCancel}>Назад</button>
      </div>

      {/* Template selector */}
      {!report && templates.length > 1 && (
        <div className="form-group">
          <select
            className="select"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Mode toggle */}
      <div className="mode-toggle">
        <button
          className={`mode-toggle__btn${!isShortMode ? ' mode-toggle__btn--active' : ''}`}
          onClick={() => setIsShortMode(false)}
        >
          Полный
        </button>
        <button
          className={`mode-toggle__btn${isShortMode ? ' mode-toggle__btn--active' : ''}`}
          onClick={() => setIsShortMode(true)}
        >
          Краткий
        </button>
      </div>

      {/* Sections and fields */}
      {sections.map((section) => {
        const fields = template.fields
          .filter((f) => f.section === section.id && f.enabled)
          .filter((f) => !isShortMode || f.shortReport)
          .sort((a, b) => a.order - b.order);

        if (fields.length === 0) return null;

        return (
          <div key={section.id}>
            <div className="section-header">
              <span className="section-header__emoji">{section.emoji}</span>
              {section.name}
            </div>
            {fields.map((field) => (
              <div key={field.key} className="form-group">
                {field.type !== 'checkbox' && (
                  <label className="form-label">
                    {field.emoji && <span className="form-label__emoji">{field.emoji}</span>}
                    {field.label}
                    {field.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                  </label>
                )}
                <FieldRenderer
                  field={field}
                  value={values[field.key]}
                  onChange={(val) => setValue(field.key, val)}
                />
              </div>
            ))}
          </div>
        );
      })}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
        <button className="btn btn--primary btn--lg" onClick={() => handleSave(false)}>
          Сохранить
        </button>
        <button className="btn btn--secondary btn--lg" onClick={() => handleSave(true)}>
          Сохранить как черновик
        </button>
        <div className="btn-group" style={{ justifyContent: 'center' }}>
          <button className="btn btn--ghost btn--sm" onClick={() => handleCopy('clipboard')}>
            Копировать
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => handleCopy('markdown')}>
            Markdown
          </button>
        </div>
        {copyMsg && (
          <div style={{ textAlign: 'center', color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>
            {copyMsg}
          </div>
        )}
      </div>
    </div>
  );
}
