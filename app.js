const STORAGE_KEY = 'mindguard_mvp_v2';

const SUBJECTS = ['Математика', 'Русский', 'Физика', 'Информатика', 'Обществознание'];
const VITAMINS = ['D3', 'Omega-3', 'Magnesium', 'B-complex'];
const MEDS = ['Нет', 'По назначению'];

const defaultTemplates = [
  {
    id: 'base',
    name: 'Базовый день',
    mode: 'full',
    sections: ['health', 'mind', 'ege', 'reflection'],
    customQuestions: []
  },
  {
    id: 'ege',
    name: 'День с упором на ЕГЭ',
    mode: 'full',
    sections: ['health', 'ege', 'mind', 'reflection'],
    customQuestions: ['Какая тема дала самый большой прогресс?']
  },
  {
    id: 'recovery',
    name: 'Выходной/восстановление',
    mode: 'short',
    sections: ['health', 'mind', 'reflection'],
    customQuestions: ['Что помогло восстановиться?']
  },
  {
    id: 'strict',
    name: 'Жёсткий режим (минимум отвлечений)',
    mode: 'short',
    sections: ['health', 'ege', 'reflection'],
    customQuestions: ['Как защитил фокус?']
  },
];

class SystemBlockerAdapter {
  syncRules(_rules) {}
  requestTemporaryBypass(_policy) {
    return Promise.resolve({ supported: false, reason: 'mvp_in_app_only' });
  }
}

const blockerAdapter = new SystemBlockerAdapter();
const state = loadState();
let deferredPrompt;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    parsed.templates ||= defaultTemplates;
    parsed.reports ||= [];
    parsed.focusSessions ||= [];
    parsed.unlockAttempts ||= [];
    parsed.mindPractices ||= [];
    parsed.settings ||= {};
    parsed.settings.pin ||= '1234';
    parsed.settings.accountabilityCode ||= '7777';
    parsed.settings.insightsEnabled ??= true;
    parsed.settings.emergencyEveryDays ||= 7;
    parsed.settings.lastEmergency ||= null;
    parsed.theme ||= 'light';
    parsed.syncQueue ||= [];
    parsed.drafts ||= {};
    parsed.blockRules ||= {
      strictLevel: 3,
      delayMin: 20,
      categories: { social: ['instagram.com', 'tiktok.com', 'vk.com'], adult: ['pornhub.com'], other: [] },
      allowlist: ['wikipedia.org'],
      schedule: '07:00-23:00',
      focusOnly: false,
    };
    return parsed;
  }

  return {
    user: null,
    templates: defaultTemplates,
    reports: [],
    focusSessions: [],
    blockRules: {
      strictLevel: 3,
      delayMin: 20,
      categories: { social: ['instagram.com', 'tiktok.com', 'vk.com'], adult: ['pornhub.com'], other: [] },
      allowlist: ['wikipedia.org'],
      schedule: '07:00-23:00',
      focusOnly: false,
    },
    unlockAttempts: [],
    mindPractices: [],
    settings: { pin: '1234', accountabilityCode: '7777', insightsEnabled: true, emergencyEveryDays: 7, lastEmergency: null },
    drafts: {},
    syncQueue: [],
    theme: 'light',
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function dailyStreak() {
  const days = [...new Set(state.reports.map((r) => r.date))].sort();
  let count = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (days.includes(key)) {
      count += 1;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return count;
}

function numAvg(values) {
  const valid = values.filter((v) => Number.isFinite(v));
  return valid.length ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1) : '-';
}

function templateById(id) {
  return state.templates.find((t) => t.id === id) || state.templates[0];
}

function emptyReportDraft() {
  return {
    templateId: state.templates[0]?.id || 'base',
    mode: 'short',
    sleepHours: 0,
    sleepQuality: 0,
    bedTime: '23:00',
    sleepAt: '23:30',
    wakeTime: '07:00',
    energy: 0,
    stress: 0,
    mood: 0,
    steps: 0,
    workoutEnabled: false,
    workoutMinutes: 0,
    workoutText: '',
    nutritionRating: 0,
    nutritionComment: '',
    kbjuMode: 'частично',
    kbjuNote: '',
    weight: 0,
    waterMl: 0,
    wellness: '',
    recovery: '',
    vitamins: [],
    vitaminsNote: '',
    meds: [],
    medsNote: '',
    vow: false,
    vowText: '',
    obstacles: '',
    control: 'частично',
    counterMeasure: '',
    meditationDone: false,
    meditationMin: 0,
    affirmations: false,
    journal: false,
    gratitude: false,
    breathingCycles: 0,
    urgeSurfingMin: 0,
    bodyScanDone: false,
    digitalMin: 0,
    digitalRating: 0,
    digitalNote: '',
    subjects: [],
    subjectsFree: '',
    deepWorkMin: 0,
    pomodoros: 0,
    practiceTasks: 0,
    accuracy: 0,
    error1: '',
    error2: '',
    error3: '',
    errorReviewMin: 0,
    reviewMin: 0,
    college: '',
    whatsNew: '',
    thought: '',
    share: '',
    better: 'yes',
    betterPrompt: '',
    tomorrow: '',
    customAnswers: {}
  };
}

function currentDraft() {
  state.drafts.report ||= emptyReportDraft();
  return state.drafts.report;
}

function reportText(report) {
  return `Отчёт за ${report.date} (серия ${report.streakIndex})\n\n💪🫀💤 Здоровье\nСон: ${report.health.sleepHours} ч, качество ${report.health.sleepQuality}/5\nЛёг/заснул/проснулся: ${report.health.bedTime} / ${report.health.sleepAt} / ${report.health.wakeTime}\nЭнергия: ${report.health.energy}/10 | Стресс: ${report.health.stress}/10 | Настроение: ${report.health.mood}/10\nДвижение: ${report.health.steps} шагов, тренировка: ${report.health.workoutEnabled ? 'да' : 'нет'} (${report.health.workoutMinutes} мин, ${report.health.workoutText})\nПитание: ${report.health.nutritionRating}/10 — ${report.health.nutritionComment}\nКБЖУ: ${report.health.kbjuMode} (${report.health.kbjuNote})\nВес: ${report.health.weight} кг (Δ ${report.health.weightDelta} к вчера)\nВода: ${report.health.waterMl} мл\nСамочувствие: ${report.health.wellness}\nВосстановление: ${report.health.recovery}\nВитамины: ${report.health.vitamins.join(', ') || '-'} | ${report.health.vitaminsNote}\nЛекарства: ${report.health.meds.join(', ') || '-'} | ${report.health.medsNote}\nОбет: ${report.health.vow ? '✅' : '❌'} ${report.health.vowText}\nРазбор дня: мешало = ${report.health.obstacles}; под контролем = ${report.health.control}; контрмера = ${report.health.counterMeasure}\n\n🌱✨ Сознание\nМедитация: ${report.mind.meditationDone ? '✅' : '❌'} (${report.mind.meditationMin} мин)\nАффирмации: ${report.mind.affirmations ? '✅' : '❌'} | Дневник: ${report.mind.journal ? '✅' : '❌'} | Благодарность: ${report.mind.gratitude ? '✅' : '❌'}\nДыхание box-breath: ${report.mind.breathingCycles} циклов\nUrge surfing: ${report.mind.urgeSurfingMin} мин\nBody scan: ${report.mind.bodyScanDone ? '✅' : '❌'}\nЦифровое благополучие: ${report.mind.digitalMin} мин, оценка ${report.mind.digitalRating}/10 (${report.mind.digitalNote})\n\n📚📖🧮 ЕГЭ\nПредметы: ${report.ege.subjects.join(', ')} ${report.ege.subjectsFree}\nDeep work: ${report.ege.deepWorkMin} мин / ${report.ege.pomodoros} помидоров\nПрактика: ${report.ege.practiceTasks} задач\nТочность: ${report.ege.accuracy}%\nОшибки: 1) ${report.ege.errors[0]} 2) ${report.ege.errors[1]} 3) ${report.ege.errors[2]}\nРазбор ошибок: ${report.ege.errorReviewMin} мин | Повтор: ${report.ege.reviewMin} мин\nКолледж: ${report.ege.college}\n\nРефлексия\nЧто нового: ${report.reflection.whatsNew}\nМысль дня: «${report.reflection.thought}»\nЧем хочу поделиться: ${report.reflection.share}\nСтал на 1% лучше: ${report.reflection.better === 'yes' ? 'да' : 'нет'} ${report.reflection.betterPrompt}\nПланы на завтра: ${report.reflection.tomorrow}\n`;
}

function render() {
  document.body.classList.toggle('dark', state.theme === 'dark');
  renderDashboard();
  renderReport();
  renderHistory();
  renderAnalytics();
  renderFocus();
  renderTemplates();
  persist();
}

function renderDashboard() {
  const root = document.getElementById('dashboard');
  if (!state.user) {
    root.hidden = true;
    return;
  }
  root.hidden = false;
  const t = state.reports.find((r) => r.date === todayStr());
  const yDate = new Date();
  yDate.setDate(yDate.getDate() - 1);
  const y = state.reports.find((r) => r.date === yDate.toISOString().slice(0, 10));

  root.innerHTML = `<div class="card">
    <h2>Привет, ${state.user.email}</h2>
    <p>Серия отчётов: <span class="badge">${dailyStreak()} дней</span></p>
    <div class="grid-2">
      <div class="card"><div class="metric">Сон</div><b>${t?.health.sleepHours ?? '-'} ч</b></div>
      <div class="card"><div class="metric">Энергия</div><b>${t?.health.energy ?? '-'} /10</b></div>
      <div class="card"><div class="metric">Стресс</div><b>${t?.health.stress ?? '-'} /10</b></div>
      <div class="card"><div class="metric">Настроение</div><b>${t?.health.mood ?? '-'} /10</b></div>
      <div class="card"><div class="metric">Deep work</div><b>${t?.ege.deepWorkMin ?? '-'} мин</b></div>
      <div class="card"><div class="metric">Осознанные практики</div><b>${state.mindPractices.length}</b></div>
    </div>
    <p><small>Вчера: deep work ${y?.ege.deepWorkMin ?? '-'} мин, сон ${y?.health.sleepHours ?? '-'} ч</small></p>
    <button id="quickCreate">Создать отчёт</button>
  </div>`;
  document.getElementById('quickCreate').onclick = () => activateTab('report');
}

function renderReport() {
  const root = document.getElementById('report');
  if (!state.user) {
    root.hidden = true;
    return;
  }
  root.hidden = false;
  const d = currentDraft();
  const tpl = templateById(d.templateId);

  root.innerHTML = `<div class="card"><h2>Отчёт за ${todayStr()}</h2>
    <label>Шаблон
      <select id="templateSel">${state.templates.map((t) => `<option value="${t.id}" ${t.id === d.templateId ? 'selected' : ''}>${t.name}</option>`).join('')}</select>
    </label>
    <label>Режим
      <select id="reportMode">
        <option value="short" ${d.mode === 'short' ? 'selected' : ''}>Короткий</option>
        <option value="full" ${d.mode === 'full' ? 'selected' : ''}>Полный</option>
      </select>
    </label>

    <h3>💪🫀💤 Здоровье</h3>
    <div class="grid-2">
      <label>Сон (ч)<input id="sleepHours" type="number" value="${d.sleepHours}"></label>
      <label>Качество сна /5<input id="sleepQuality" type="number" min="1" max="5" value="${d.sleepQuality}"></label>
      <label>Лёг в<input id="bedTime" type="time" value="${d.bedTime}"></label>
      <label>Заснул в<input id="sleepAt" type="time" value="${d.sleepAt}"></label>
      <label>Проснулся<input id="wakeTime" type="time" value="${d.wakeTime}"></label>
      <label>Энергия /10<input id="energy" type="range" min="0" max="10" value="${d.energy}"><small>${d.energy}</small></label>
      <label>Стресс /10<input id="stress" type="range" min="0" max="10" value="${d.stress}"><small>${d.stress}</small></label>
      <label>Настроение /10<input id="mood" type="range" min="0" max="10" value="${d.mood}"><small>${d.mood}</small></label>
      <label>Шаги<input id="steps" type="number" value="${d.steps}"></label>
      <label><input id="workoutEnabled" type="checkbox" ${d.workoutEnabled ? 'checked' : ''}> Тренировка была</label>
      <label>Тренировка (мин)<input id="workoutMinutes" type="number" value="${d.workoutMinutes}"></label>
      <label>Тренировка (описание)<input id="workoutText" value="${d.workoutText}"></label>
      <label>Питание /10<input id="nutritionRating" type="number" min="0" max="10" value="${d.nutritionRating}"></label>
      <label>Питание комментарий<textarea id="nutritionComment">${d.nutritionComment}</textarea></label>
      <label>КБЖУ<select id="kbjuMode"><option ${d.kbjuMode === 'да' ? 'selected' : ''}>да</option><option ${d.kbjuMode === 'нет' ? 'selected' : ''}>нет</option><option ${d.kbjuMode === 'частично' ? 'selected' : ''}>частично</option></select></label>
      <label>КБЖУ заметка<input id="kbjuNote" value="${d.kbjuNote}"></label>
      <label>Вес<input id="weight" type="number" step="0.1" value="${d.weight}"></label>
      <label>Вода (мл)<input id="waterMl" type="number" value="${d.waterMl}"></label>
      <label>Самочувствие<textarea id="wellness">${d.wellness}</textarea></label>
      <label>Восстановление<textarea id="recovery">${d.recovery}</textarea></label>
      <label>Витамины<select id="vitamins" multiple>${VITAMINS.map((v) => `<option ${d.vitamins.includes(v) ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Витамины заметка<input id="vitaminsNote" value="${d.vitaminsNote}"></label>
      <label>Лекарства<select id="meds" multiple>${MEDS.map((m) => `<option ${d.meds.includes(m) ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
      <label>Лекарства заметка<input id="medsNote" value="${d.medsNote}"></label>
      <label><input id="vow" type="checkbox" ${d.vow ? 'checked' : ''}> Обет</label>
      <label>Текст обета<input id="vowText" value="${d.vowText}"></label>
      <label>Что мешало<textarea id="obstacles">${d.obstacles}</textarea></label>
      <label>Под контролем?<select id="control"><option ${d.control === 'yes' ? 'selected' : ''}>yes</option><option ${d.control === 'no' ? 'selected' : ''}>no</option><option ${d.control === 'частично' ? 'selected' : ''}>частично</option></select></label>
      <label>Контрмера<textarea id="counterMeasure">${d.counterMeasure}</textarea></label>
    </div>

    <h3>🌱✨ Сознание + новые практики</h3>
    <div class="grid-2">
      <label><input id="meditationDone" type="checkbox" ${d.meditationDone ? 'checked' : ''}> Медитация</label>
      <label>Медитация (мин)<input id="meditationMin" type="number" value="${d.meditationMin}"></label>
      <label><input id="affirmations" type="checkbox" ${d.affirmations ? 'checked' : ''}> Аффирмации</label>
      <label><input id="journal" type="checkbox" ${d.journal ? 'checked' : ''}> Дневник</label>
      <label><input id="gratitude" type="checkbox" ${d.gratitude ? 'checked' : ''}> Благодарность</label>
      <label>Box-breath cycles<input id="breathingCycles" type="number" value="${d.breathingCycles}"></label>
      <label>Urge surfing (мин)<input id="urgeSurfingMin" type="number" value="${d.urgeSurfingMin}"></label>
      <label><input id="bodyScanDone" type="checkbox" ${d.bodyScanDone ? 'checked' : ''}> Body scan</label>
      <label>Digital wellbeing (мин)<input id="digitalMin" type="number" value="${d.digitalMin}"></label>
      <label>Digital wellbeing /10<input id="digitalRating" type="number" min="0" max="10" value="${d.digitalRating}"></label>
      <label>Digital note<textarea id="digitalNote">${d.digitalNote}</textarea></label>
    </div>

    ${d.mode === 'full' ? `<h3>📚📖🧮 ЕГЭ + Колледж</h3>
    <div class="grid-2">
      <label>Предметы<select id="subjects" multiple>${SUBJECTS.map((s) => `<option ${d.subjects.includes(s) ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      <label>Свободный ввод предмета<input id="subjectsFree" value="${d.subjectsFree}"></label>
      <label>Deep work (мин)<input id="deepWorkMin" type="number" value="${d.deepWorkMin}"></label>
      <label>Помидоры<input id="pomodoros" type="number" value="${d.pomodoros}"></label>
      <label>Практика задач<input id="practiceTasks" type="number" value="${d.practiceTasks}"></label>
      <label>Точность %<input id="accuracy" type="number" value="${d.accuracy}"></label>
      <label>Ошибка 1<textarea id="error1">${d.error1}</textarea></label>
      <label>Ошибка 2<textarea id="error2">${d.error2}</textarea></label>
      <label>Ошибка 3<textarea id="error3">${d.error3}</textarea></label>
      <label>Разбор ошибок (мин)<input id="errorReviewMin" type="number" value="${d.errorReviewMin}"></label>
      <label>Повтор/карточки (мин)<input id="reviewMin" type="number" value="${d.reviewMin}"></label>
      <label>Колледж<textarea id="college">${d.college}</textarea></label>
    </div>` : '<p><small>Короткий режим: блок ЕГЭ скрыт.</small></p>'}

    <h3>Рефлексия</h3>
    <div class="grid-2">
      <label>Что нового?<textarea id="whatsNew">${d.whatsNew}</textarea></label>
      <label>Мысль дня<textarea id="thought">${d.thought}</textarea></label>
      <label>Чем поделиться?<textarea id="share">${d.share}</textarea></label>
      <label>Стал на 1% лучше?
        <select id="better"><option value="yes" ${d.better === 'yes' ? 'selected' : ''}>yes</option><option value="no" ${d.better === 'no' ? 'selected' : ''}>no</option></select>
      </label>
      ${d.better === 'no' ? '<p class="warn">Подсказка: начни с фразы “что я...”</p>' : ''}
      <label>Если нет — продолжи мысль<input id="betterPrompt" value="${d.betterPrompt}"></label>
      <label>Планы на завтра<textarea id="tomorrow">${d.tomorrow}</textarea></label>
    </div>

    <h3>Кастомные вопросы шаблона</h3>
    <div class="grid-2">
      ${tpl.customQuestions.map((q, idx) => `<label>${q}<textarea data-custom="${idx}">${d.customAnswers[q] || ''}</textarea></label>`).join('') || '<small>Нет кастомных вопросов</small>'}
    </div>

    <div class="row">
      <button id="saveReport">Сохранить отчёт</button>
      <button id="copyReport">Скопировать отчёт</button>
      <button id="exportMd">Экспорт Markdown</button>
      <button id="resetDraft">Сбросить черновик</button>
    </div>
  </div>`;

  const ids = ['templateSel','reportMode','sleepHours','sleepQuality','bedTime','sleepAt','wakeTime','energy','stress','mood','steps','workoutEnabled','workoutMinutes','workoutText','nutritionRating','nutritionComment','kbjuMode','kbjuNote','weight','waterMl','wellness','recovery','vitamins','vitaminsNote','meds','medsNote','vow','vowText','obstacles','control','counterMeasure','meditationDone','meditationMin','affirmations','journal','gratitude','breathingCycles','urgeSurfingMin','bodyScanDone','digitalMin','digitalRating','digitalNote','subjects','subjectsFree','deepWorkMin','pomodoros','practiceTasks','accuracy','error1','error2','error3','errorReviewMin','reviewMin','college','whatsNew','thought','share','better','betterPrompt','tomorrow'];

  const pickMulti = (id) => [...(document.getElementById(id)?.selectedOptions || [])].map((o) => o.value);

  function saveDraftFromUi() {
    const next = currentDraft();
    next.templateId = document.getElementById('templateSel').value;
    next.mode = document.getElementById('reportMode').value;
    next.sleepHours = Number(document.getElementById('sleepHours').value || 0);
    next.sleepQuality = Number(document.getElementById('sleepQuality').value || 0);
    next.bedTime = document.getElementById('bedTime').value;
    next.sleepAt = document.getElementById('sleepAt').value;
    next.wakeTime = document.getElementById('wakeTime').value;
    next.energy = Number(document.getElementById('energy').value || 0);
    next.stress = Number(document.getElementById('stress').value || 0);
    next.mood = Number(document.getElementById('mood').value || 0);
    next.steps = Number(document.getElementById('steps').value || 0);
    next.workoutEnabled = document.getElementById('workoutEnabled').checked;
    next.workoutMinutes = Number(document.getElementById('workoutMinutes').value || 0);
    next.workoutText = document.getElementById('workoutText').value;
    next.nutritionRating = Number(document.getElementById('nutritionRating').value || 0);
    next.nutritionComment = document.getElementById('nutritionComment').value;
    next.kbjuMode = document.getElementById('kbjuMode').value;
    next.kbjuNote = document.getElementById('kbjuNote').value;
    next.weight = Number(document.getElementById('weight').value || 0);
    next.waterMl = Number(document.getElementById('waterMl').value || 0);
    next.wellness = document.getElementById('wellness').value;
    next.recovery = document.getElementById('recovery').value;
    next.vitamins = pickMulti('vitamins');
    next.vitaminsNote = document.getElementById('vitaminsNote').value;
    next.meds = pickMulti('meds');
    next.medsNote = document.getElementById('medsNote').value;
    next.vow = document.getElementById('vow').checked;
    next.vowText = document.getElementById('vowText').value;
    next.obstacles = document.getElementById('obstacles').value;
    next.control = document.getElementById('control').value;
    next.counterMeasure = document.getElementById('counterMeasure').value;
    next.meditationDone = document.getElementById('meditationDone').checked;
    next.meditationMin = Number(document.getElementById('meditationMin').value || 0);
    next.affirmations = document.getElementById('affirmations').checked;
    next.journal = document.getElementById('journal').checked;
    next.gratitude = document.getElementById('gratitude').checked;
    next.breathingCycles = Number(document.getElementById('breathingCycles').value || 0);
    next.urgeSurfingMin = Number(document.getElementById('urgeSurfingMin').value || 0);
    next.bodyScanDone = document.getElementById('bodyScanDone').checked;
    next.digitalMin = Number(document.getElementById('digitalMin').value || 0);
    next.digitalRating = Number(document.getElementById('digitalRating').value || 0);
    next.digitalNote = document.getElementById('digitalNote').value;
    next.subjects = pickMulti('subjects');
    next.subjectsFree = document.getElementById('subjectsFree')?.value || '';
    next.deepWorkMin = Number(document.getElementById('deepWorkMin')?.value || 0);
    next.pomodoros = Number(document.getElementById('pomodoros')?.value || 0);
    next.practiceTasks = Number(document.getElementById('practiceTasks')?.value || 0);
    next.accuracy = Number(document.getElementById('accuracy')?.value || 0);
    next.error1 = document.getElementById('error1')?.value || '';
    next.error2 = document.getElementById('error2')?.value || '';
    next.error3 = document.getElementById('error3')?.value || '';
    next.errorReviewMin = Number(document.getElementById('errorReviewMin')?.value || 0);
    next.reviewMin = Number(document.getElementById('reviewMin')?.value || 0);
    next.college = document.getElementById('college')?.value || '';
    next.whatsNew = document.getElementById('whatsNew').value;
    next.thought = document.getElementById('thought').value;
    next.share = document.getElementById('share').value;
    next.better = document.getElementById('better').value;
    next.betterPrompt = document.getElementById('betterPrompt').value;
    next.tomorrow = document.getElementById('tomorrow').value;

    tpl.customQuestions.forEach((q, idx) => {
      const el = document.querySelector(`[data-custom='${idx}']`);
      next.customAnswers[q] = el?.value || '';
    });

    persist();
  }

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
      saveDraftFromUi();
      if (id === 'templateSel' || id === 'reportMode' || id === 'better') renderReport();
    });
  });
  tpl.customQuestions.forEach((_, idx) => {
    const el = document.querySelector(`[data-custom='${idx}']`);
    if (el) el.addEventListener('input', saveDraftFromUi);
  });

  document.getElementById('resetDraft').onclick = () => {
    state.drafts.report = emptyReportDraft();
    renderReport();
  };

  document.getElementById('saveReport').onclick = () => {
    saveDraftFromUi();
    const draft = currentDraft();
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const prevDay = state.reports.find((r) => r.date === y.toISOString().slice(0, 10));
    const existing = state.reports.find((r) => r.date === todayStr());
    const record = {
      id: existing?.id || crypto.randomUUID(),
      date: todayStr(),
      templateId: draft.templateId,
      streakIndex: dailyStreak() + (existing ? 0 : 1),
      mode: draft.mode,
      health: {
        sleepHours: draft.sleepHours,
        sleepQuality: draft.sleepQuality,
        bedTime: draft.bedTime,
        sleepAt: draft.sleepAt,
        wakeTime: draft.wakeTime,
        energy: draft.energy,
        stress: draft.stress,
        mood: draft.mood,
        steps: draft.steps,
        workoutEnabled: draft.workoutEnabled,
        workoutMinutes: draft.workoutMinutes,
        workoutText: draft.workoutText,
        nutritionRating: draft.nutritionRating,
        nutritionComment: draft.nutritionComment,
        kbjuMode: draft.kbjuMode,
        kbjuNote: draft.kbjuNote,
        weight: draft.weight,
        weightDelta: (draft.weight - (prevDay?.health.weight || 0)).toFixed(1),
        waterMl: draft.waterMl,
        wellness: draft.wellness,
        recovery: draft.recovery,
        vitamins: draft.vitamins,
        vitaminsNote: draft.vitaminsNote,
        meds: draft.meds,
        medsNote: draft.medsNote,
        vow: draft.vow,
        vowText: draft.vowText,
        obstacles: draft.obstacles,
        control: draft.control,
        counterMeasure: draft.counterMeasure,
      },
      mind: {
        meditationDone: draft.meditationDone,
        meditationMin: draft.meditationMin,
        affirmations: draft.affirmations,
        journal: draft.journal,
        gratitude: draft.gratitude,
        breathingCycles: draft.breathingCycles,
        urgeSurfingMin: draft.urgeSurfingMin,
        bodyScanDone: draft.bodyScanDone,
        digitalMin: draft.digitalMin,
        digitalRating: draft.digitalRating,
        digitalNote: draft.digitalNote,
      },
      ege: {
        subjects: draft.subjects,
        subjectsFree: draft.subjectsFree,
        deepWorkMin: draft.deepWorkMin,
        pomodoros: draft.pomodoros,
        practiceTasks: draft.practiceTasks,
        accuracy: draft.accuracy,
        errors: [draft.error1, draft.error2, draft.error3],
        errorReviewMin: draft.errorReviewMin,
        reviewMin: draft.reviewMin,
        college: draft.college,
      },
      reflection: {
        whatsNew: draft.whatsNew,
        thought: draft.thought,
        share: draft.share,
        better: draft.better,
        betterPrompt: draft.betterPrompt,
        tomorrow: draft.tomorrow,
      },
      customAnswers: draft.customAnswers,
    };

    state.reports = state.reports.filter((r) => r.id !== record.id).concat(record).sort((a, b) => a.date.localeCompare(b.date));
    state.mindPractices.push({
      id: crypto.randomUUID(),
      date: todayStr(),
      breathingCycles: draft.breathingCycles,
      urgeSurfingMin: draft.urgeSurfingMin,
      bodyScanDone: draft.bodyScanDone,
      meditationMin: draft.meditationMin,
    });
    state.syncQueue.push({ type: 'report_upsert', id: record.id, ts: Date.now() });
    alert('Отчёт сохранён');
    render();
  };

  document.getElementById('copyReport').onclick = async () => {
    const latest = state.reports[state.reports.length - 1];
    if (!latest) {
      alert('Сначала сохраните отчёт');
      return;
    }
    await navigator.clipboard.writeText(reportText(latest));
    alert('Скопировано в буфер');
  };

  document.getElementById('exportMd').onclick = () => {
    const latest = state.reports[state.reports.length - 1];
    if (!latest) {
      alert('Сначала сохраните отчёт');
      return;
    }
    const blob = new Blob([reportText(latest)], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mindguard-${latest.date}.md`;
    a.click();
  };
}

function renderHistory() {
  const root = document.getElementById('history');
  if (!state.user) {
    root.hidden = true;
    return;
  }
  root.hidden = false;
  const items = [...state.reports].sort((a, b) => b.date.localeCompare(a.date));

  root.innerHTML = `<div class="card"><h2>History</h2>
    <label>Поиск<input id="historySearch" placeholder="дата/мысль/шаблон"></label>
    <label>Фильтр шаблона
      <select id="historyTemplateFilter"><option value="">Все</option>${state.templates.map((t) => `<option value="${t.id}">${t.name}</option>`).join('')}</select>
    </label>
    <div id="historyList">${items.map((r) => `<div class="list-item" data-template="${r.templateId}"><b>${r.date}</b> • ${templateById(r.templateId).name}
    <div>Deep work: ${r.ege.deepWorkMin} мин, мысль: ${r.reflection.thought || '-'}</div>
    <button class="editReport" data-id="${r.id}">Открыть и редактировать</button>
    </div>`).join('')}</div>
  </div>`;

  const filterList = () => {
    const q = document.getElementById('historySearch').value.toLowerCase();
    const t = document.getElementById('historyTemplateFilter').value;
    root.querySelectorAll('.list-item').forEach((el) => {
      const textOk = el.textContent.toLowerCase().includes(q);
      const templateOk = !t || el.dataset.template === t;
      el.hidden = !(textOk && templateOk);
    });
  };

  document.getElementById('historySearch').oninput = filterList;
  document.getElementById('historyTemplateFilter').onchange = filterList;

  root.querySelectorAll('.editReport').forEach((btn) => {
    btn.onclick = () => {
      const record = state.reports.find((r) => r.id === btn.dataset.id);
      if (!record) return;
      state.drafts.report = {
        ...emptyReportDraft(),
        templateId: record.templateId,
        mode: record.mode,
        sleepHours: record.health.sleepHours,
        sleepQuality: record.health.sleepQuality,
        bedTime: record.health.bedTime,
        sleepAt: record.health.sleepAt,
        wakeTime: record.health.wakeTime,
        energy: record.health.energy,
        stress: record.health.stress,
        mood: record.health.mood,
        steps: record.health.steps,
        workoutEnabled: record.health.workoutEnabled,
        workoutMinutes: record.health.workoutMinutes,
        workoutText: record.health.workoutText,
        nutritionRating: record.health.nutritionRating,
        nutritionComment: record.health.nutritionComment,
        kbjuMode: record.health.kbjuMode,
        kbjuNote: record.health.kbjuNote,
        weight: record.health.weight,
        waterMl: record.health.waterMl,
        wellness: record.health.wellness,
        recovery: record.health.recovery,
        vitamins: record.health.vitamins,
        vitaminsNote: record.health.vitaminsNote,
        meds: record.health.meds,
        medsNote: record.health.medsNote,
        vow: record.health.vow,
        vowText: record.health.vowText,
        obstacles: record.health.obstacles,
        control: record.health.control,
        counterMeasure: record.health.counterMeasure,
        meditationDone: record.mind.meditationDone,
        meditationMin: record.mind.meditationMin,
        affirmations: record.mind.affirmations,
        journal: record.mind.journal,
        gratitude: record.mind.gratitude,
        breathingCycles: record.mind.breathingCycles,
        urgeSurfingMin: record.mind.urgeSurfingMin,
        bodyScanDone: record.mind.bodyScanDone,
        digitalMin: record.mind.digitalMin,
        digitalRating: record.mind.digitalRating,
        digitalNote: record.mind.digitalNote,
        subjects: record.ege.subjects,
        subjectsFree: record.ege.subjectsFree,
        deepWorkMin: record.ege.deepWorkMin,
        pomodoros: record.ege.pomodoros,
        practiceTasks: record.ege.practiceTasks,
        accuracy: record.ege.accuracy,
        error1: record.ege.errors[0],
        error2: record.ege.errors[1],
        error3: record.ege.errors[2],
        errorReviewMin: record.ege.errorReviewMin,
        reviewMin: record.ege.reviewMin,
        college: record.ege.college,
        whatsNew: record.reflection.whatsNew,
        thought: record.reflection.thought,
        share: record.reflection.share,
        better: record.reflection.better,
        betterPrompt: record.reflection.betterPrompt,
        tomorrow: record.reflection.tomorrow,
        customAnswers: record.customAnswers || {},
      };
      activateTab('report');
      render();
    };
  });
}

function drawLine(canvas, values, color = '#2563eb') {
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth * devicePixelRatio;
  const H = canvas.height = 180 * devicePixelRatio;
  ctx.clearRect(0, 0, W, H);
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * devicePixelRatio;
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  values.forEach((v, idx) => {
    const x = ((W - 20) * idx) / Math.max(1, values.length - 1) + 10;
    const y = H - 10 - ((v - min) / Math.max(1, max - min)) * (H - 20);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function corr(a, b) {
  if (a.length !== b.length || a.length < 2) return 0;
  const ma = a.reduce((s, v) => s + v, 0) / a.length;
  const mb = b.reduce((s, v) => s + v, 0) / b.length;
  const cov = a.reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0);
  const da = Math.sqrt(a.reduce((s, v) => s + (v - ma) ** 2, 0));
  const db = Math.sqrt(b.reduce((s, v) => s + (v - mb) ** 2, 0));
  return da && db ? cov / (da * db) : 0;
}

function renderAnalytics() {
  const root = document.getElementById('analytics');
  if (!state.user) {
    root.hidden = true;
    return;
  }
  root.hidden = false;

  const last30 = [...state.reports].slice(-30);
  const last7 = last30.slice(-7);

  const sleep = last30.map((r) => r.health.sleepHours);
  const energy = last30.map((r) => r.health.energy);
  const stress = last30.map((r) => r.health.stress);
  const mood = last30.map((r) => r.health.mood);
  const weight = last30.map((r) => r.health.weight);
  const steps = last30.map((r) => r.health.steps);
  const deep = last30.map((r) => r.ege.deepWorkMin);
  const breath = last30.map((r) => r.mind.breathingCycles);

  const insights = [];
  if (last30.length) {
    const goodSleep = last30.filter((r) => r.health.sleepHours >= 7);
    if (goodSleep.length) insights.push(`В дни, когда сон ≥ 7ч, энергия в среднем ${numAvg(goodSleep.map((r) => r.health.energy))}`);

    const lowDeep = last30.filter((r) => r.ege.deepWorkMin < 60);
    if (lowDeep.length) insights.push(`Стресс растёт, когда deep work < 60 мин: ${numAvg(lowDeep.map((r) => r.health.stress))}`);

    const goodBreath = last30.filter((r) => r.mind.breathingCycles >= 3);
    if (goodBreath.length) insights.push(`При 3+ циклах дыхания настроение = ${numAvg(goodBreath.map((r) => r.health.mood))}`);
  }

  root.innerHTML = `<div class="card"><h2>Analytics</h2>
    <p>Средние 7д: сон ${numAvg(last7.map((r) => r.health.sleepHours))} | энергия ${numAvg(last7.map((r) => r.health.energy))} | стресс ${numAvg(last7.map((r) => r.health.stress))} | настроение ${numAvg(last7.map((r) => r.health.mood))}</p>
    <p>Средние 30д: deep work ${numAvg(deep)} | дыхание ${numAvg(breath)} циклов</p>
    <p>Корреляции: сон↔энергия ${corr(sleep, energy).toFixed(2)} | deep work↔настроение ${corr(deep, mood).toFixed(2)}</p>
    <canvas id="sleepChart"></canvas>
    <canvas id="energyChart"></canvas>
    <canvas id="stressChart"></canvas>
    <canvas id="moodChart"></canvas>
    <canvas id="weightChart"></canvas>
    <canvas id="stepsChart"></canvas>
    <canvas id="deepChart"></canvas>
    <canvas id="breathChart"></canvas>
    <h3>Insights <input id="insightsToggle" type="checkbox" ${state.settings.insightsEnabled ? 'checked' : ''}></h3>
    <ul>${state.settings.insightsEnabled ? insights.map((i) => `<li>${i}</li>`).join('') : '<li>Отключено</li>'}</ul>
  </div>`;

  drawLine(document.getElementById('sleepChart'), sleep, '#0ea5e9');
  drawLine(document.getElementById('energyChart'), energy, '#22c55e');
  drawLine(document.getElementById('stressChart'), stress, '#ef4444');
  drawLine(document.getElementById('moodChart'), mood, '#a855f7');
  drawLine(document.getElementById('weightChart'), weight, '#f97316');
  drawLine(document.getElementById('stepsChart'), steps, '#06b6d4');
  drawLine(document.getElementById('deepChart'), deep, '#16a34a');
  drawLine(document.getElementById('breathChart'), breath, '#14b8a6');

  document.getElementById('insightsToggle').onchange = (e) => {
    state.settings.insightsEnabled = e.target.checked;
    renderAnalytics();
    persist();
  };
}

function isBlocked(url) {
  const host = url.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
  if (!host) return false;
  if (state.blockRules.allowlist.some((d) => host.includes(d))) return false;
  const blocked = [
    ...state.blockRules.categories.social,
    ...state.blockRules.categories.adult,
    ...state.blockRules.categories.other,
  ];
  return blocked.some((d) => host.includes(d));
}

function canEmergencyAccess() {
  if (!state.settings.lastEmergency) return true;
  const diffDays = (Date.now() - state.settings.lastEmergency) / (1000 * 60 * 60 * 24);
  return diffDays >= state.settings.emergencyEveryDays;
}

function renderFocus() {
  const root = document.getElementById('focus');
  if (!state.user) {
    root.hidden = true;
    return;
  }
  root.hidden = false;
  root.innerHTML = `<div class="card"><h2>Focus & Blocker</h2>
    <p>Strict level: <b>${state.blockRules.strictLevel}</b> | Delay: ${state.blockRules.delayMin} мин</p>
    <label>Расписание блокировок<input id="schedule" value="${state.blockRules.schedule}"></label>
    <label><input id="focusOnly" type="checkbox" ${state.blockRules.focusOnly ? 'checked' : ''}> Только во время focus-сессий</label>
    <div class="row"><label>URL для Focus Browser<input id="focusUrl" placeholder="https://example.com"></label><button id="openFocus">Открыть</button></div>
    <div id="focusView" class="card"><small>Встроенный Focus Browser: проверка URL и безопасный режим.</small></div>
    <h3>Фокус-сессия</h3>
    <div class="row"><input id="focusMin" type="number" value="25"><button id="startFocus">Start Pomodoro</button><button id="stopFocus">Stop</button></div>

    <h3>Защита настроек (PIN)</h3>
    <div class="row"><input id="pinInput" placeholder="PIN"><button id="unlockSettings">Открыть настройки</button></div>
    <div id="settingsPanel" hidden>
      <label>Strict level<select id="strictLevel"><option>1</option><option>2</option><option>3</option><option>4</option></select></label>
      <label>Delay (15-60 min)<input id="delayMin" type="number" min="15" max="60" value="${state.blockRules.delayMin}"></label>
      <label>Blocklist social (через ,)<input id="socialList" value="${state.blockRules.categories.social.join(',')}"></label>
      <label>Blocklist adult (через ,)<input id="adultList" value="${state.blockRules.categories.adult.join(',')}"></label>
      <label>Blocklist other (через ,)<input id="otherList" value="${state.blockRules.categories.other.join(',')}"></label>
      <label>Allowlist (через ,)<input id="allowList" value="${state.blockRules.allowlist.join(',')}"></label>
      <button id="saveBlock">Сохранить правила</button>
    </div>

    <button id="disableBlock" class="warn">Отключить блокировки (Unlock Flow)</button>
    <button id="emergencyAccess">Emergency Access</button>

    <h3>Журнал попыток</h3>
    ${state.unlockAttempts.slice(-12).reverse().map((a) => `<div class="list-item">${new Date(a.ts).toLocaleString()} · ${a.result} · reason: ${a.reason || '-'} · waited ${a.waitedMin}m</div>`).join('') || '<small>Пока пусто</small>'}
  </div>`;

  const splitList = (id) => document.getElementById(id).value.split(',').map((v) => v.trim()).filter(Boolean);
  const anyRunning = state.focusSessions.some((s) => s.status === 'running');

  document.getElementById('schedule').oninput = (e) => {
    state.blockRules.schedule = e.target.value;
    persist();
  };
  document.getElementById('focusOnly').onchange = (e) => {
    state.blockRules.focusOnly = e.target.checked;
    persist();
  };

  document.getElementById('openFocus').onclick = () => {
    const url = document.getElementById('focusUrl').value.trim();
    const shouldApply = !state.blockRules.focusOnly || anyRunning;
    const blocked = shouldApply && isBlocked(url);
    document.getElementById('focusView').innerHTML = blocked
      ? '<p class="warn">Домен заблокирован Focus-правилами.</p>'
      : `<p>Открыт URL: ${url || '-'}</p>`;
  };

  document.getElementById('startFocus').onclick = () => {
    const min = Number(document.getElementById('focusMin').value || 25);
    state.focusSessions.push({ id: crypto.randomUUID(), type: 'pomodoro', durationMin: min, status: 'running', startedAt: Date.now() });
    alert(`Фокус-сессия на ${min} минут запущена.`);
    persist();
    renderFocus();
  };

  document.getElementById('stopFocus').onclick = () => {
    state.focusSessions.forEach((s) => {
      if (s.status === 'running') s.status = 'done';
    });
    persist();
    renderFocus();
  };

  document.getElementById('unlockSettings').onclick = () => {
    if (document.getElementById('pinInput').value !== state.settings.pin) {
      alert('Неверный PIN');
      return;
    }
    const panel = document.getElementById('settingsPanel');
    panel.hidden = false;
    document.getElementById('strictLevel').value = String(state.blockRules.strictLevel);
  };

  document.getElementById('saveBlock').onclick = () => {
    state.blockRules.strictLevel = Number(document.getElementById('strictLevel').value);
    state.blockRules.delayMin = Number(document.getElementById('delayMin').value || 20);
    state.blockRules.categories.social = splitList('socialList');
    state.blockRules.categories.adult = splitList('adultList');
    state.blockRules.categories.other = splitList('otherList');
    state.blockRules.allowlist = splitList('allowList');
    blockerAdapter.syncRules(state.blockRules);
    persist();
    alert('Правила сохранены');
    renderFocus();
  };

  document.getElementById('disableBlock').onclick = async () => {
    const level = state.blockRules.strictLevel;
    const reason = prompt('Причина отключения блокировки:') || '';
    let waitedMin = 0;

    if (level >= 2) {
      waitedMin = Math.max(15, Math.min(60, state.blockRules.delayMin));
      alert(`MVP-таймер: ожидание ${waitedMin} минут (симуляция трения).`);
    }

    if (level >= 3) {
      const alt = prompt('Какую безопасную альтернативу выберешь сейчас?');
      const confirmPhrase = prompt('Подтверди фразой: "Я выбираю фокус"');
      if (!alt || confirmPhrase !== 'Я выбираю фокус') {
        state.unlockAttempts.push({ ts: Date.now(), reason, result: 'denied_task', waitedMin });
        persist();
        renderFocus();
        return;
      }
    }

    if (level >= 4) {
      const code = prompt('Введите код партнёра ответственности:');
      if (code !== state.settings.accountabilityCode) {
        state.unlockAttempts.push({ ts: Date.now(), reason, result: 'denied_l4', waitedMin });
        persist();
        renderFocus();
        return;
      }
    }

    const bypass = await blockerAdapter.requestTemporaryBypass({ level, reason });
    state.unlockAttempts.push({ ts: Date.now(), reason, result: bypass.supported ? 'approved_system' : 'approved_mvp', waitedMin });
    alert('Разблокировка проведена по Unlock Flow.');
    persist();
    renderFocus();
  };

  document.getElementById('emergencyAccess').onclick = () => {
    if (!canEmergencyAccess()) {
      alert('Emergency Access уже использовался недавно. Подождите период восстановления.');
      return;
    }
    const reason = prompt('Причина Emergency Access:');
    if (!reason) return;
    state.settings.lastEmergency = Date.now();
    state.unlockAttempts.push({ ts: Date.now(), reason, result: 'emergency_pending_24h', waitedMin: 24 * 60 });
    alert('Emergency Access зарегистрирован: доступ откроется после 24ч ожидания (в MVP — логируется).');
    persist();
    renderFocus();
  };
}

function renderTemplates() {
  const root = document.getElementById('templates');
  if (!state.user) {
    root.hidden = true;
    return;
  }
  root.hidden = false;

  root.innerHTML = `<div class="card"><h2>Редактор шаблонов</h2>
    ${state.templates.map((t) => `<div class="list-item"><b>${t.name}</b> (${t.mode})<br>Секции: ${t.sections.join(', ')}<br><small>${t.customQuestions.join(' | ') || 'без кастомных вопросов'}</small></div>`).join('')}
    <label>Название шаблона<input id="tplName"></label>
    <label>Режим<select id="tplMode"><option value="short">short</option><option value="full">full</option></select></label>
    <label>Секции (через ,): health,mind,ege,reflection<input id="tplSections" value="health,mind,ege,reflection"></label>
    <label>Кастомные вопросы (через ; )<textarea id="tplQuestions"></textarea></label>
    <button id="createTpl">Создать шаблон</button>
  </div>`;

  document.getElementById('createTpl').onclick = () => {
    const name = document.getElementById('tplName').value.trim();
    if (!name) return;
    state.templates.push({
      id: crypto.randomUUID(),
      name,
      mode: document.getElementById('tplMode').value,
      sections: document.getElementById('tplSections').value.split(',').map((v) => v.trim()).filter(Boolean),
      customQuestions: document.getElementById('tplQuestions').value.split(';').map((v) => v.trim()).filter(Boolean),
    });
    persist();
    renderTemplates();
  };
}

function activateTab(tab) {
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach((p) => {
    p.hidden = p.id !== tab;
  });
}

document.getElementById('themeToggle').onclick = () => {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  render();
};

document.getElementById('loginBtn').onclick = () => {
  const email = document.getElementById('emailInput').value.trim();
  if (!email) return;
  state.user = { id: crypto.randomUUID(), email, authType: 'email' };
  document.getElementById('authSection').hidden = true;
  document.getElementById('appTabs').hidden = false;
  render();
};

document.querySelectorAll('.tabs button').forEach((b) => {
  b.onclick = () => activateTab(b.dataset.tab);
});

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('installBtn');
  btn.hidden = false;
  btn.onclick = async () => {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    btn.hidden = true;
  };
});

window.addEventListener('online', () => {
  if (!state.syncQueue.length) return;
  state.syncQueue = [];
  persist();
  console.log('Sync queue flushed.');
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
if (state.user) {
  document.getElementById('authSection').hidden = true;
  document.getElementById('appTabs').hidden = false;
}
render();
