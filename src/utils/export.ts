import type { ReportEntry, ReportTemplate } from '../types/index.js';

export function reportToClipboardText(
  report: ReportEntry,
  template: ReportTemplate,
): string {
  const lines: string[] = [];
  const date = new Date(report.date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  lines.push(`📊 ${template.name} — ${date}`);
  lines.push('');

  for (const section of [...template.sections].sort((a, b) => a.order - b.order)) {
    if (!section.enabled) continue;
    const sectionFields = template.fields
      .filter((f) => f.section === section.id && f.enabled)
      .sort((a, b) => a.order - b.order);

    const filledFields = sectionFields.filter((f) => {
      const v = report.values[f.key];
      return v !== undefined && v !== '' && v !== false && v !== null;
    });
    if (filledFields.length === 0) continue;

    lines.push(`${section.emoji} ${section.name}`);
    for (const field of filledFields) {
      const v = report.values[field.key];
      const emoji = field.emoji ? `${field.emoji} ` : '';
      const suffix = field.suffix ? ` ${field.suffix}` : '';
      const formatted = formatValue(v, field.type);
      lines.push(`${emoji}${field.label}: ${formatted}${suffix}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

export function reportToMarkdown(
  report: ReportEntry,
  template: ReportTemplate,
): string {
  const lines: string[] = [];
  const date = new Date(report.date).toLocaleDateString('ru-RU');
  lines.push(`# ${template.name} — ${date}`);
  lines.push('');

  for (const section of [...template.sections].sort((a, b) => a.order - b.order)) {
    if (!section.enabled) continue;
    const sectionFields = template.fields
      .filter((f) => f.section === section.id && f.enabled)
      .sort((a, b) => a.order - b.order);

    const filledFields = sectionFields.filter((f) => {
      const v = report.values[f.key];
      return v !== undefined && v !== '' && v !== false && v !== null;
    });
    if (filledFields.length === 0) continue;

    lines.push(`## ${section.emoji} ${section.name}`);
    lines.push('');
    for (const field of filledFields) {
      const v = report.values[field.key];
      const suffix = field.suffix ? ` ${field.suffix}` : '';
      const formatted = formatValue(v, field.type);
      lines.push(`- **${field.label}**: ${formatted}${suffix}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

export function reportToPlainText(
  report: ReportEntry,
  template: ReportTemplate,
): string {
  const lines: string[] = [];
  const date = new Date(report.date).toLocaleDateString('ru-RU');
  lines.push(`${template.name} — ${date}`);
  lines.push('');

  for (const section of [...template.sections].sort((a, b) => a.order - b.order)) {
    if (!section.enabled) continue;
    const sectionFields = template.fields
      .filter((f) => f.section === section.id && f.enabled)
      .sort((a, b) => a.order - b.order);

    const filledFields = sectionFields.filter((f) => {
      const v = report.values[f.key];
      return v !== undefined && v !== '' && v !== false && v !== null;
    });
    if (filledFields.length === 0) continue;

    lines.push(`[${section.name}]`);
    for (const field of filledFields) {
      const v = report.values[field.key];
      const suffix = field.suffix ? ` ${field.suffix}` : '';
      const formatted = formatValue(v, field.type);
      lines.push(`${field.label}: ${formatted}${suffix}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

function formatValue(value: any, type: string): string {
  if (Array.isArray(value)) return value.join(', ');
  if (type === 'checkbox') return value ? 'Да' : 'Нет';
  if (type === 'tristate') {
    if (value === 'yes') return 'Да';
    if (value === 'partial') return 'Частично';
    if (value === 'no') return 'Нет';
  }
  if (type === 'rating') return `${value}/10`;
  return String(value);
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
