import type { TemplateField } from '../../types/index.js';

interface FieldProps {
  field: TemplateField;
  value: any;
  onChange: (val: any) => void;
}

export function FieldRenderer({ field, value, onChange }: FieldProps) {
  switch (field.type) {
    case 'number':
      return <NumberField field={field} value={value} onChange={onChange} />;
    case 'rating':
      return <RatingSlider field={field} value={value} onChange={onChange} />;
    case 'time':
      return <TimeField value={value} onChange={onChange} />;
    case 'text':
      return <TextField field={field} value={value} onChange={onChange} />;
    case 'textarea':
      return <TextareaField field={field} value={value} onChange={onChange} />;
    case 'checkbox':
      return <CheckboxField field={field} value={value} onChange={onChange} />;
    case 'checklist':
      return <ChecklistField field={field} value={value} onChange={onChange} />;
    case 'select':
      return <SelectField field={field} value={value} onChange={onChange} />;
    case 'multi-select':
      return <MultiSelectField field={field} value={value} onChange={onChange} />;
    case 'tristate':
      return <TristateToggle value={value} onChange={onChange} />;
    default:
      return null;
  }
}

function NumberField({ field, value, onChange }: FieldProps) {
  return (
    <div className="input-with-suffix">
      <input
        className="input"
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        min={field.min}
        max={field.max}
        step={field.step}
        placeholder={field.placeholder}
        inputMode="decimal"
      />
      {field.suffix && <span className="input-with-suffix__suffix">{field.suffix}</span>}
    </div>
  );
}

function RatingSlider({ field, value, onChange }: FieldProps) {
  const min = field.min ?? 1;
  const max = field.max ?? 10;
  const current = value ?? min;
  const pct = ((current - min) / (max - min)) * 100;

  const color =
    pct < 30 ? 'var(--danger)' : pct < 60 ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="rating-slider">
      <div className="rating-slider__value" style={{ color }}>{current}</div>
      <div className="rating-slider__bar">
        <span className="rating-slider__min">{min}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={current}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, ${color} ${pct}%, var(--bg-input) ${pct}%)`,
          }}
        />
        <span className="rating-slider__max">{max}</span>
      </div>
    </div>
  );
}

function TimeField({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  return (
    <input
      className="input"
      type="time"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function TextField({ field, value, onChange }: FieldProps) {
  return (
    <input
      className="input"
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
    />
  );
}

function TextareaField({ field, value, onChange }: FieldProps) {
  return (
    <textarea
      className="textarea"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      rows={3}
    />
  );
}

function CheckboxField({ field, value, onChange }: FieldProps) {
  return (
    <div
      className={`toggle${value ? ' toggle--active' : ''}`}
      onClick={() => onChange(!value)}
    >
      <div className="toggle__track">
        <div className="toggle__thumb" />
      </div>
      <span className="toggle__label">{field.label}</span>
    </div>
  );
}

function ChecklistField({ field, value, onChange }: FieldProps) {
  const selected: string[] = value ?? [];
  const toggle = (v: string) => {
    if (selected.includes(v)) {
      onChange(selected.filter((s) => s !== v));
    } else {
      onChange([...selected, v]);
    }
  };
  return (
    <div className="checklist">
      {field.options?.map((opt) => (
        <div
          key={opt.value}
          className={`checklist__item${selected.includes(opt.value) ? ' checklist__item--checked' : ''}`}
          onClick={() => toggle(opt.value)}
        >
          <div className="checklist__checkbox">
            {selected.includes(opt.value) && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="checklist__label">{opt.label}</span>
        </div>
      ))}
    </div>
  );
}

function SelectField({ field, value, onChange }: FieldProps) {
  return (
    <select
      className="select"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Выберите...</option>
      {field.options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function MultiSelectField({ field, value, onChange }: FieldProps) {
  const selected: string[] = value ?? [];
  const toggle = (v: string) => {
    if (selected.includes(v)) {
      onChange(selected.filter((s) => s !== v));
    } else {
      onChange([...selected, v]);
    }
  };
  return (
    <div className="chips">
      {field.options?.map((opt) => (
        <button
          key={opt.value}
          className={`chip${selected.includes(opt.value) ? ' chip--active' : ''}`}
          onClick={() => toggle(opt.value)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function TristateToggle({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  return (
    <div className="tristate">
      <button
        className={`tristate__btn tristate__btn--yes${value === 'yes' ? ' tristate__btn--active' : ''}`}
        onClick={() => onChange(value === 'yes' ? null : 'yes')}
        type="button"
      >
        Да
      </button>
      <button
        className={`tristate__btn tristate__btn--partial${value === 'partial' ? ' tristate__btn--active' : ''}`}
        onClick={() => onChange(value === 'partial' ? null : 'partial')}
        type="button"
      >
        Частично
      </button>
      <button
        className={`tristate__btn tristate__btn--no${value === 'no' ? ' tristate__btn--active' : ''}`}
        onClick={() => onChange(value === 'no' ? null : 'no')}
        type="button"
      >
        Нет
      </button>
    </div>
  );
}
