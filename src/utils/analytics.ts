import type { ReportEntry } from '../types/index.js';

export function getReportsForPeriod(reports: ReportEntry[], days: number): ReportEntry[] {
  const cutoff = Date.now() - days * 86400000;
  return reports
    .filter((r) => !r.isDraft && new Date(r.date).getTime() >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getAverages(reports: ReportEntry[], days: number): Record<string, number> {
  const filtered = getReportsForPeriod(reports, days);
  if (filtered.length === 0) return {};

  const sums: Record<string, { total: number; count: number }> = {};
  for (const r of filtered) {
    for (const [key, val] of Object.entries(r.values)) {
      if (typeof val === 'number') {
        if (!sums[key]) sums[key] = { total: 0, count: 0 };
        sums[key].total += val;
        sums[key].count += 1;
      }
    }
  }

  const result: Record<string, number> = {};
  for (const [key, { total, count }] of Object.entries(sums)) {
    result[key] = Math.round((total / count) * 10) / 10;
  }
  return result;
}

export function getTrendData(
  reports: ReportEntry[],
  field: string,
  days: number,
): Array<{ date: string; value: number }> {
  return getReportsForPeriod(reports, days)
    .filter((r) => typeof r.values[field] === 'number')
    .map((r) => ({
      date: r.date.slice(0, 10),
      value: r.values[field] as number,
    }));
}

export function getCorrelation(
  reports: ReportEntry[],
  fieldA: string,
  fieldB: string,
): { coefficient: number; insight: string } {
  const pairs: Array<[number, number]> = [];
  for (const r of reports.filter((r) => !r.isDraft)) {
    const a = r.values[fieldA];
    const b = r.values[fieldB];
    if (typeof a === 'number' && typeof b === 'number') {
      pairs.push([a, b]);
    }
  }

  if (pairs.length < 5) return { coefficient: 0, insight: 'Недостаточно данных' };

  const n = pairs.length;
  const sumA = pairs.reduce((s, p) => s + p[0], 0);
  const sumB = pairs.reduce((s, p) => s + p[1], 0);
  const sumAB = pairs.reduce((s, p) => s + p[0] * p[1], 0);
  const sumA2 = pairs.reduce((s, p) => s + p[0] * p[0], 0);
  const sumB2 = pairs.reduce((s, p) => s + p[1] * p[1], 0);

  const num = n * sumAB - sumA * sumB;
  const den = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));

  const r = den === 0 ? 0 : num / den;
  const rounded = Math.round(r * 100) / 100;

  const strength = Math.abs(rounded) > 0.6 ? 'сильная' : Math.abs(rounded) > 0.3 ? 'умеренная' : 'слабая';
  const direction = rounded > 0 ? 'положительная' : 'отрицательная';

  return {
    coefficient: rounded,
    insight: `Корреляция ${strength} ${direction} (r=${rounded})`,
  };
}

const FIELD_LABELS: Record<string, string> = {
  sleep_hours: 'сон',
  energy: 'энергия',
  stress: 'стресс',
  mood: 'настроение',
  deep_work_hours: 'глубокая работа',
  meditation: 'медитация',
  exercise: 'тренировка',
  steps: 'шаги',
};

export function generateInsights(reports: ReportEntry[]): string[] {
  const insights: string[] = [];
  const recent = reports.filter((r) => !r.isDraft).sort((a, b) => b.date.localeCompare(a.date));
  if (recent.length < 3) return ['Заполните больше отчётов для получения инсайтов'];

  const last7 = recent.filter(
    (r) => Date.now() - new Date(r.date).getTime() < 7 * 86400000,
  );

  // Sleep → energy correlation insight
  const sleepEnergyPairs = recent
    .filter((r) => typeof r.values.sleep_hours === 'number' && typeof r.values.energy === 'number')
    .map((r) => ({ sleep: r.values.sleep_hours as number, energy: r.values.energy as number }));

  if (sleepEnergyPairs.length >= 5) {
    const goodSleep = sleepEnergyPairs.filter((p) => p.sleep >= 7);
    const badSleep = sleepEnergyPairs.filter((p) => p.sleep < 7);
    if (goodSleep.length > 0 && badSleep.length > 0) {
      const avgGood = goodSleep.reduce((s, p) => s + p.energy, 0) / goodSleep.length;
      const avgBad = badSleep.reduce((s, p) => s + p.energy, 0) / badSleep.length;
      if (avgGood > avgBad) {
        insights.push(
          `Когда сон ≥ 7ч, ваша энергия в среднем ${avgGood.toFixed(1)}/10 vs ${avgBad.toFixed(1)}/10`,
        );
      }
    }
  }

  // Average stress
  const stressVals = last7.map((r) => r.values.stress).filter((v) => typeof v === 'number') as number[];
  if (stressVals.length > 0) {
    const avg = stressVals.reduce((s, v) => s + v, 0) / stressVals.length;
    insights.push(`Средний стресс за неделю: ${avg.toFixed(1)}/10`);
  }

  // Meditation count
  const meditationDays = last7.filter((r) => r.values.meditation === true).length;
  insights.push(`Медитация: ${meditationDays} из ${last7.length} дней за неделю`);

  // Deep work trend
  const dwValues = last7.map((r) => r.values.deep_work_hours).filter((v) => typeof v === 'number') as number[];
  if (dwValues.length > 0) {
    const avg = dwValues.reduce((s, v) => s + v, 0) / dwValues.length;
    insights.push(`Средняя глубокая работа за неделю: ${avg.toFixed(1)} ч/день`);
  }

  // Best mood day
  const moodReports = last7
    .filter((r) => typeof r.values.mood === 'number')
    .sort((a, b) => (b.values.mood as number) - (a.values.mood as number));
  if (moodReports.length > 0) {
    const best = moodReports[0];
    const day = new Date(best.date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'short' });
    insights.push(`Лучшее настроение за неделю: ${best.values.mood}/10 (${day})`);
  }

  return insights;
}
