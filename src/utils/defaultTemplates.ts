import type { TemplateField, TemplateSection, ReportTemplate } from '../types/index.js';
import { v4 as uuid } from 'uuid';

const S_HEALTH = 'health';
const S_DAY = 'day-review';
const S_MIND = 'consciousness';
const S_EGE = 'ege';
const S_COLLEGE = 'college';
const S_REFLECTION = 'reflection';

export const ALL_SECTIONS: TemplateSection[] = [
  { id: S_HEALTH, name: 'Здоровье', emoji: '🏥', order: 0, enabled: true },
  { id: S_DAY, name: 'Обзор дня', emoji: '📋', order: 1, enabled: true },
  { id: S_MIND, name: 'Сознание', emoji: '🧠', order: 2, enabled: true },
  { id: S_EGE, name: 'ЕГЭ', emoji: '📚', order: 3, enabled: true },
  { id: S_COLLEGE, name: 'Колледж', emoji: '🎓', order: 4, enabled: true },
  { id: S_REFLECTION, name: 'Рефлексия', emoji: '💭', order: 5, enabled: true },
];

let _order = 0;
function f(
  partial: Omit<TemplateField, 'id' | 'order' | 'required' | 'enabled'> & {
    required?: boolean;
    enabled?: boolean;
  },
): TemplateField {
  return {
    id: partial.key,
    required: false,
    enabled: true,
    order: _order++,
    ...partial,
  } as TemplateField;
}

const healthFields: TemplateField[] = [
  f({ key: 'sleep_hours', label: 'Часы сна', type: 'number', section: S_HEALTH, shortReport: true, min: 0, max: 12, step: 0.5, emoji: '😴', suffix: 'ч' }),
  f({ key: 'sleep_quality', label: 'Качество сна', type: 'rating', section: S_HEALTH, shortReport: true, min: 1, max: 10, emoji: '🌙' }),
  f({ key: 'wake_time', label: 'Время подъёма', type: 'time', section: S_HEALTH, shortReport: false, emoji: '⏰' }),
  f({ key: 'bed_time', label: 'Время отбоя', type: 'time', section: S_HEALTH, shortReport: false, emoji: '🛏️' }),
  f({ key: 'energy', label: 'Энергия', type: 'rating', section: S_HEALTH, shortReport: true, min: 1, max: 10, emoji: '⚡' }),
  f({ key: 'stress', label: 'Стресс', type: 'rating', section: S_HEALTH, shortReport: true, min: 1, max: 10, emoji: '😰' }),
  f({ key: 'mood', label: 'Настроение', type: 'rating', section: S_HEALTH, shortReport: true, min: 1, max: 10, emoji: '😊' }),
  f({ key: 'weight', label: 'Вес', type: 'number', section: S_HEALTH, shortReport: false, min: 30, max: 200, step: 0.1, suffix: 'кг' }),
  f({ key: 'steps', label: 'Шаги', type: 'number', section: S_HEALTH, shortReport: false, min: 0, max: 50000, emoji: '🚶' }),
  f({ key: 'water_glasses', label: 'Стаканы воды', type: 'number', section: S_HEALTH, shortReport: false, min: 0, max: 20, emoji: '💧' }),
  f({ key: 'exercise', label: 'Тренировка', type: 'checkbox', section: S_HEALTH, shortReport: false, emoji: '💪' }),
  f({ key: 'exercise_type', label: 'Тип тренировки', type: 'text', section: S_HEALTH, shortReport: false, placeholder: 'Бег, йога, зал...' }),
  f({ key: 'exercise_duration', label: 'Длительность тренировки', type: 'number', section: S_HEALTH, shortReport: false, min: 0, max: 300, suffix: 'мин' }),
  f({ key: 'medications', label: 'Лекарства приняты', type: 'checkbox', section: S_HEALTH, shortReport: false, emoji: '💊' }),
  f({ key: 'symptoms', label: 'Симптомы / жалобы', type: 'textarea', section: S_HEALTH, shortReport: false, placeholder: 'Опишите, если есть...' }),
];

_order = 0;
const dayFields: TemplateField[] = [
  f({ key: 'deep_work_hours', label: 'Глубокая работа', type: 'number', section: S_DAY, shortReport: true, min: 0, max: 16, step: 0.5, emoji: '🎯', suffix: 'ч' }),
  f({ key: 'productive_hours', label: 'Продуктивные часы', type: 'number', section: S_DAY, shortReport: false, min: 0, max: 16, step: 0.5, suffix: 'ч' }),
  f({ key: 'main_achievement', label: 'Главное достижение', type: 'text', section: S_DAY, shortReport: true, emoji: '🏆', placeholder: 'Что главное сделал?' }),
  f({ key: 'tasks_completed', label: 'Задач выполнено', type: 'number', section: S_DAY, shortReport: false, min: 0, max: 50, emoji: '✅' }),
  f({ key: 'tasks_planned', label: 'Задач запланировано', type: 'number', section: S_DAY, shortReport: false, min: 0, max: 50, emoji: '📝' }),
  f({ key: 'distractions', label: 'Отвлечения', type: 'rating', section: S_DAY, shortReport: false, min: 1, max: 10, emoji: '📱' }),
  f({ key: 'meetings_count', label: 'Встречи', type: 'number', section: S_DAY, shortReport: false, min: 0, max: 20 }),
  f({ key: 'breaks_taken', label: 'Перерывы', type: 'number', section: S_DAY, shortReport: false, min: 0, max: 20 }),
  f({ key: 'day_rating', label: 'Оценка дня', type: 'rating', section: S_DAY, shortReport: true, min: 1, max: 10, emoji: '⭐' }),
  f({ key: 'highlight', label: 'Главный момент дня', type: 'textarea', section: S_DAY, shortReport: false, placeholder: 'Что запомнилось?' }),
];

_order = 0;
const mindFields: TemplateField[] = [
  f({ key: 'meditation', label: 'Медитация', type: 'checkbox', section: S_MIND, shortReport: false, emoji: '🧘' }),
  f({ key: 'meditation_minutes', label: 'Минуты медитации', type: 'number', section: S_MIND, shortReport: false, min: 0, max: 120, suffix: 'мин' }),
  f({ key: 'gratitude', label: 'Благодарность', type: 'textarea', section: S_MIND, shortReport: false, emoji: '🙏', placeholder: 'За что благодарен сегодня?' }),
  f({ key: 'journal_entry', label: 'Дневник', type: 'textarea', section: S_MIND, shortReport: false, emoji: '📖', placeholder: 'Свободные мысли...' }),
  f({
    key: 'emotional_state', label: 'Эмоциональное состояние', type: 'select', section: S_MIND, shortReport: false, emoji: '💫',
    options: [
      { value: 'calm', label: 'Спокойствие' },
      { value: 'joy', label: 'Радость' },
      { value: 'anxiety', label: 'Тревога' },
      { value: 'sadness', label: 'Грусть' },
      { value: 'irritation', label: 'Раздражение' },
      { value: 'apathy', label: 'Апатия' },
      { value: 'inspiration', label: 'Воодушевление' },
    ],
  }),
  f({ key: 'triggers', label: 'Триггеры', type: 'textarea', section: S_MIND, shortReport: false, placeholder: 'Что вызвало сильные эмоции?' }),
  f({
    key: 'self_care', label: 'Забота о себе', type: 'checklist', section: S_MIND, shortReport: false, emoji: '💆',
    options: [
      { value: 'walk', label: 'Прогулка' },
      { value: 'reading', label: 'Чтение' },
      { value: 'music', label: 'Музыка' },
      { value: 'bath', label: 'Ванна' },
      { value: 'social', label: 'Общение' },
      { value: 'hobby', label: 'Хобби' },
    ],
  }),
  f({ key: 'screen_time_hours', label: 'Экранное время', type: 'number', section: S_MIND, shortReport: false, min: 0, max: 24, step: 0.5, emoji: '📱', suffix: 'ч' }),
  f({ key: 'social_media_minutes', label: 'Соцсети', type: 'number', section: S_MIND, shortReport: false, min: 0, max: 600, emoji: '📲', suffix: 'мин' }),
];

_order = 0;
const egeFields: TemplateField[] = [
  f({ key: 'ege_study_hours', label: 'Учёба (ЕГЭ)', type: 'number', section: S_EGE, shortReport: true, min: 0, max: 12, step: 0.5, emoji: '📚', suffix: 'ч' }),
  f({
    key: 'ege_subjects', label: 'Предметы', type: 'multi-select', section: S_EGE, shortReport: false, emoji: '📘',
    options: [
      { value: 'math', label: 'Математика' },
      { value: 'russian', label: 'Русский' },
      { value: 'informatics', label: 'Информатика' },
      { value: 'physics', label: 'Физика' },
      { value: 'social', label: 'Обществознание' },
      { value: 'english', label: 'Английский' },
      { value: 'history', label: 'История' },
      { value: 'chemistry', label: 'Химия' },
      { value: 'biology', label: 'Биология' },
    ],
  }),
  f({ key: 'practice_tests', label: 'Пробники', type: 'number', section: S_EGE, shortReport: false, min: 0, max: 10 }),
  f({ key: 'practice_score', label: 'Балл пробника', type: 'number', section: S_EGE, shortReport: false, min: 0, max: 100 }),
  f({ key: 'weak_topics', label: 'Слабые темы', type: 'textarea', section: S_EGE, shortReport: false, placeholder: 'Что надо подтянуть?' }),
  f({ key: 'study_plan_followed', label: 'План учёбы выполнен', type: 'tristate', section: S_EGE, shortReport: false, emoji: '📋' }),
  f({ key: 'tutor_session', label: 'Занятие с репетитором', type: 'checkbox', section: S_EGE, shortReport: false, emoji: '👨‍🏫' }),
  f({ key: 'new_material', label: 'Новый материал', type: 'checkbox', section: S_EGE, shortReport: false }),
  f({ key: 'revision', label: 'Повторение', type: 'checkbox', section: S_EGE, shortReport: false }),
];

_order = 0;
const collegeFields: TemplateField[] = [
  f({ key: 'attended_classes', label: 'Посещено пар', type: 'number', section: S_COLLEGE, shortReport: false, min: 0, max: 10, emoji: '🎓' }),
  f({ key: 'total_classes', label: 'Всего пар', type: 'number', section: S_COLLEGE, shortReport: false, min: 0, max: 10 }),
  f({ key: 'homework_done', label: 'ДЗ выполнено', type: 'tristate', section: S_COLLEGE, shortReport: false, emoji: '📝' }),
  f({ key: 'assignments_due', label: 'Предстоящие задания', type: 'textarea', section: S_COLLEGE, shortReport: false, placeholder: 'Дедлайны, задания...' }),
  f({ key: 'college_notes', label: 'Заметки', type: 'textarea', section: S_COLLEGE, shortReport: false }),
  f({ key: 'college_mood', label: 'Настроение в колледже', type: 'rating', section: S_COLLEGE, shortReport: false, min: 1, max: 10 }),
  f({ key: 'group_project', label: 'Групповой проект', type: 'checkbox', section: S_COLLEGE, shortReport: false }),
];

_order = 0;
const reflectionFields: TemplateField[] = [
  f({ key: 'lessons_learned', label: 'Уроки дня', type: 'textarea', section: S_REFLECTION, shortReport: true, emoji: '💡', placeholder: 'Чему научился?' }),
  f({ key: 'tomorrow_goals', label: 'Цели на завтра', type: 'textarea', section: S_REFLECTION, shortReport: true, emoji: '🎯', placeholder: 'Что сделаю завтра?' }),
  f({ key: 'obstacles', label: 'Препятствия', type: 'textarea', section: S_REFLECTION, shortReport: false, placeholder: 'Что мешало?' }),
  f({ key: 'personal_growth', label: 'Рост и развитие', type: 'textarea', section: S_REFLECTION, shortReport: false, placeholder: 'В чём вырос?' }),
  f({ key: 'overall_rating', label: 'Общая оценка дня', type: 'rating', section: S_REFLECTION, shortReport: true, min: 1, max: 10, emoji: '🌟' }),
  f({ key: 'free_notes', label: 'Свободные заметки', type: 'textarea', section: S_REFLECTION, shortReport: false, placeholder: 'Что угодно...' }),
];

export const ALL_FIELDS: TemplateField[] = [
  ...healthFields,
  ...dayFields,
  ...mindFields,
  ...egeFields,
  ...collegeFields,
  ...reflectionFields,
];

function cloneSections(overrides?: Partial<Record<string, boolean>>): TemplateSection[] {
  return ALL_SECTIONS.map((s) => ({
    ...s,
    enabled: overrides?.[s.id] ?? s.enabled,
  }));
}

function cloneFields(enableOverride?: (f: TemplateField) => boolean): TemplateField[] {
  return ALL_FIELDS.map((field) => ({
    ...field,
    id: field.key,
    enabled: enableOverride ? enableOverride(field) : field.enabled,
  }));
}

export function createDefaultTemplates(): ReportTemplate[] {
  const now = new Date().toISOString();
  return [
    {
      id: uuid(),
      name: 'Базовый день',
      description: 'Полный дневной отчёт — все секции и поля',
      isDefault: true,
      sections: cloneSections(),
      fields: cloneFields(() => true),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      name: 'День с упором на ЕГЭ',
      description: 'Фокус на подготовке к экзаменам',
      isDefault: true,
      sections: cloneSections({ college: false }),
      fields: cloneFields((field) => {
        if (field.section === S_EGE || field.section === S_HEALTH) return true;
        if (field.section === S_COLLEGE) return false;
        if (field.section === S_MIND) return field.key === 'meditation' || field.key === 'screen_time_hours';
        return field.shortReport;
      }),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      name: 'Выходной / восстановление',
      description: 'Здоровье, сознание, рефлексия — без учёбы',
      isDefault: true,
      sections: cloneSections({ ege: false, college: false }),
      fields: cloneFields((field) => {
        if (field.section === S_EGE || field.section === S_COLLEGE) return false;
        return true;
      }),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      name: 'Жёсткий режим',
      description: 'Только ключевые метрики — максимальная дисциплина',
      isDefault: true,
      sections: cloneSections(),
      fields: cloneFields((field) => field.shortReport),
      createdAt: now,
      updatedAt: now,
    },
  ];
}
