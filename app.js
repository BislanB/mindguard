const STORAGE_KEY = 'mindguard_mvp_v1';

const defaultTemplates = [
  { id: 'base', name: 'Базовый день', mode: 'full', customQuestions: [] },
  { id: 'ege', name: 'День с упором на ЕГЭ', mode: 'full', customQuestions: ['Главная тема ЕГЭ сегодня?'] },
  { id: 'recovery', name: 'Выходной/восстановление', mode: 'short', customQuestions: ['Что помогло восстановлению?'] },
  { id: 'strict', name: 'Жёсткий режим (минимум отвлечений)', mode: 'short', customQuestions: ['Как защитил фокус?'] },
];

const state = loadState();
let deferredPrompt;

class SystemBlockerAdapter {
  syncRules(_rules) {}
  requestTemporaryBypass(_policy) { return Promise.resolve({ supported: false }); }
}
const blockerAdapter = new SystemBlockerAdapter();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  return {
    user: null,
    templates: defaultTemplates,
    reports: [],
    focusSessions: [],
    blockRules: { strictLevel: 3, delayMin: 15, categories: { social: ['instagram.com','tiktok.com'], adult: ['pornhub.com'], other: [] }, allowlist: ['wikipedia.org'], schedule: '07:00-23:00' },
    unlockAttempts: [],
    settings: { pin: '1234', accountabilityCode: '7777', insightsEnabled: true, emergencyEveryDays: 7, lastEmergency: null },
    drafts: {},
    syncQueue: [],
    theme: 'light'
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function streak() {
  const ds = [...new Set(state.reports.map(r => r.date))].sort();
  let s = 0;
  let day = new Date();
  while (true) {
    const key = day.toISOString().slice(0, 10);
    if (ds.includes(key)) { s++; day.setDate(day.getDate() - 1); } else break;
  }
  return s;
}

function render() {
  document.body.classList.toggle('dark', state.theme === 'dark');
  renderDashboard(); renderReport(); renderHistory(); renderAnalytics(); renderFocus(); renderTemplates();
  persist();
}

function numAvg(values) {
  const filtered = values.filter(v => Number.isFinite(v));
  return filtered.length ? (filtered.reduce((a,b)=>a+b,0)/filtered.length).toFixed(1) : '-';
}

function renderDashboard() {
  const root = document.getElementById('dashboard');
  if (!state.user) { root.hidden = true; return; }
  root.hidden = false;
  const today = state.reports.find(r => r.date === new Date().toISOString().slice(0,10));
  const y = new Date(); y.setDate(y.getDate()-1);
  const yesterday = state.reports.find(r => r.date === y.toISOString().slice(0,10));
  root.innerHTML = `<div class='card'><h2>Привет, ${state.user.email}</h2>
  <p>Серия: <span class='badge'>${streak()} дней</span></p>
  <div class='grid-2'>
    <div class='card'><div class='metric'>Сон</div><b>${today?.health.sleepHours ?? '-'} ч</b></div>
    <div class='card'><div class='metric'>Энергия</div><b>${today?.health.energy ?? '-'} /10</b></div>
    <div class='card'><div class='metric'>Стресс</div><b>${today?.health.stress ?? '-'} /10</b></div>
    <div class='card'><div class='metric'>Настроение</div><b>${today?.health.mood ?? '-'} /10</b></div>
    <div class='card'><div class='metric'>Deep work</div><b>${today?.ege.deepWorkMin ?? '-'} мин</b></div>
  </div>
  <p><small>Вчера deep work: ${yesterday?.ege.deepWorkMin ?? '-'} мин</small></p>
  <button id='quickCreate'>Создать отчёт</button></div>`;
  document.getElementById('quickCreate').onclick = () => activateTab('report');
}

function reportText(r) {
  return `Отчёт за ${r.date} (серия ${r.streakIndex})\n\n💪🫀💤 Здоровье\nСон: ${r.health.sleepHours} ч, качество ${r.health.sleepQuality}/5\nЛёг/заснул/проснулся: ${r.health.bedTime} / ${r.health.fallAsleepTime} / ${r.health.wakeTime}\nЭнергия ${r.health.energy}/10, Стресс ${r.health.stress}/10, Настроение ${r.health.mood}/10\nШаги: ${r.health.steps}, Тренировка: ${r.health.workout ? 'да' : 'нет'} (${r.health.workoutMin} мин, ${r.health.workoutText})\nПитание: ${r.health.nutritionRating}/10 — ${r.health.nutritionComment}\nКБЖУ: ${r.health.kbjuMode} (${r.health.kbjuNote})\nВес: ${r.health.weight} кг (Δ ${r.health.weightDelta})\nВода: ${r.health.water}\nСамочувствие: ${r.health.wellness}\nВосстановление: ${r.health.recovery}\nВитамины: ${r.health.vitamins.join(', ')}; ${r.health.vitaminsNote}\nЛекарства: ${r.health.meds.join(', ')}; ${r.health.medsNote}\nОбет: ${r.health.vow ? '✅' : '❌'} ${r.health.vowText}\nЧто мешало: ${r.health.obstacles}\nПод контролем: ${r.health.control}\nКонтрмера: ${r.health.counterMeasure}\n\n🌱✨ Сознание\nМедитация: ${r.mind.meditation ? '✅' : '❌'} (${r.mind.meditationMin} мин)\nАффирмации: ${r.mind.affirmations ? '✅' : '❌'}\nДневник: ${r.mind.journal ? '✅' : '❌'}\nБлагодарности: ${r.mind.gratitude ? '✅' : '❌'}\nЦифровое благополучие: ${r.mind.digitalMin} мин, ${r.mind.digitalRating}/10, ${r.mind.digitalNote}\n\n📚📖🧮 ЕГЭ\nПредметы: ${r.ege.subjects.join(', ')} ${r.ege.subjectFree}\nDeep work: ${r.ege.deepWorkMin} мин / ${r.ege.pomodoros} помидоров\nПрактика: ${r.ege.practice}\nТочность: ${r.ege.accuracy}%\nОшибки: 1) ${r.ege.topErrors[0]} 2) ${r.ege.topErrors[1]} 3) ${r.ege.topErrors[2]}\nРазбор ошибок: ${r.ege.errorReviewMin} мин\nПовтор: ${r.ege.reviewMin} мин\nКолледж: ${r.ege.college}\n\nРефлексия\nЧто нового: ${r.reflection.whatsNew}\nМысль дня: «${r.reflection.thought}»\nЧем поделиться: ${r.reflection.share}\nСтал на 1% лучше: ${r.reflection.onePercentBetter ? 'да' : 'нет'}\nПланы на завтра: ${r.reflection.tomorrow}\n`;
}

function renderReport() {
  const root = document.getElementById('report');
  if (!state.user) { root.hidden = true; return; }
  root.hidden = false;
  const draft = state.drafts.report || {};
  root.innerHTML = `<div class='card'><h2>Создать отчёт</h2>
  <label>Шаблон<select id='templateSel'>${state.templates.map(t=>`<option value='${t.id}'>${t.name}</option>`).join('')}</select></label>
  <label>Режим<select id='reportMode'><option value='short'>Короткий</option><option value='full'>Полный</option></select></label>
  <div class='grid-2'>
    <label>Сон (ч)<input id='sleepHours' type='number' value='${draft.sleepHours ?? ''}' /></label>
    <label>Качество сна /5<input id='sleepQuality' type='number' min='1' max='5' value='${draft.sleepQuality ?? ''}' /></label>
    <label>Энергия /10<input id='energy' type='number' min='1' max='10' value='${draft.energy ?? ''}' /></label>
    <label>Стресс /10<input id='stress' type='number' min='1' max='10' value='${draft.stress ?? ''}' /></label>
    <label>Настроение /10<input id='mood' type='number' min='1' max='10' value='${draft.mood ?? ''}' /></label>
    <label>Шаги<input id='steps' type='number' value='${draft.steps ?? ''}' /></label>
    <label>Deep Work (мин)<input id='deepWorkMin' type='number' value='${draft.deepWorkMin ?? ''}' /></label>
    <label>Помидоры<input id='pomodoros' type='number' value='${draft.pomodoros ?? ''}' /></label>
    <label>Вес<input id='weight' type='number' step='0.1' value='${draft.weight ?? ''}' /></label>
    <label>Что нового<textarea id='whatsNew'>${draft.whatsNew ?? ''}</textarea></label>
    <label>Мысль дня<textarea id='thought'>${draft.thought ?? ''}</textarea></label>
  </div>
  <button id='saveReport'>Сохранить отчёт</button>
  <button id='copyReport'>Скопировать отчёт</button>
  <button id='exportMd'>Экспорт Markdown</button>
  </div>`;

  root.querySelectorAll('input,textarea,select').forEach(el => {
    el.addEventListener('input', () => {
      state.drafts.report = {
        sleepHours: Number(document.getElementById('sleepHours').value || 0),
        sleepQuality: Number(document.getElementById('sleepQuality').value || 0),
        energy: Number(document.getElementById('energy').value || 0),
        stress: Number(document.getElementById('stress').value || 0),
        mood: Number(document.getElementById('mood').value || 0),
        steps: Number(document.getElementById('steps').value || 0),
        deepWorkMin: Number(document.getElementById('deepWorkMin').value || 0),
        pomodoros: Number(document.getElementById('pomodoros').value || 0),
        weight: Number(document.getElementById('weight').value || 0),
        whatsNew: document.getElementById('whatsNew').value,
        thought: document.getElementById('thought').value,
      };
      persist();
    });
  });

  document.getElementById('saveReport').onclick = () => {
    const d = state.drafts.report || {};
    const date = new Date().toISOString().slice(0,10);
    const prev = state.reports.find(r => r.date === date);
    const y = new Date(); y.setDate(y.getDate()-1);
    const prevDay = state.reports.find(r => r.date === y.toISOString().slice(0,10));
    const report = {
      id: prev?.id || crypto.randomUUID(),
      date,
      templateId: document.getElementById('templateSel').value,
      streakIndex: streak() + (prev ? 0 : 1),
      health: {
        sleepHours: d.sleepHours || 0, sleepQuality: d.sleepQuality || 0,
        bedTime: '23:00', fallAsleepTime: '23:30', wakeTime: '07:00',
        energy: d.energy || 0, stress: d.stress || 0, mood: d.mood || 0,
        steps: d.steps || 0, workout: false, workoutMin: 0, workoutText: '',
        nutritionRating: 0, nutritionComment: '', kbjuMode: 'частично', kbjuNote: '',
        weight: d.weight || 0, weightDelta: ((d.weight || 0) - (prevDay?.health.weight || 0)).toFixed(1),
        water: '0 мл', wellness: '', recovery: '', vitamins: [], vitaminsNote: '', meds: [], medsNote: '',
        vow: false, vowText: '', obstacles: '', control: 'частично', counterMeasure: ''
      },
      mind: { meditationMin: 0, meditation: false, affirmations: false, journal: false, gratitude: false, digitalMin: 0, digitalRating: 0, digitalNote: '' },
      ege: { subjects: ['Математика'], subjectFree: '', deepWorkMin: d.deepWorkMin || 0, pomodoros: d.pomodoros || 0, practice: 0, accuracy: 0, topErrors: ['', '', ''], errorReviewMin: 0, reviewMin: 0, college: '' },
      reflection: { whatsNew: d.whatsNew || '', thought: d.thought || '', share: '', onePercentBetter: true, tomorrow: '' }
    };
    state.reports = state.reports.filter(r => r.id !== report.id).concat(report).sort((a,b)=>a.date.localeCompare(b.date));
    state.syncQueue.push({ type:'report_upsert', id: report.id, ts: Date.now() });
    alert('Сохранено');
    render();
  };

  document.getElementById('copyReport').onclick = async () => {
    const r = state.reports[state.reports.length-1];
    if (!r) return alert('Сначала сохраните отчёт');
    await navigator.clipboard.writeText(reportText(r));
    alert('Скопировано в буфер');
  };
  document.getElementById('exportMd').onclick = () => {
    const r = state.reports[state.reports.length-1];
    if (!r) return alert('Сначала сохраните отчёт');
    const blob = new Blob([reportText(r)], { type: 'text/markdown' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `mindguard-${r.date}.md`; a.click();
  };
}

function renderHistory() {
  const root = document.getElementById('history');
  if (!state.user) { root.hidden = true; return; }
  root.hidden = false;
  const items = [...state.reports].sort((a,b)=>b.date.localeCompare(a.date));
  root.innerHTML = `<div class='card'><h2>История</h2><input id='historySearch' placeholder='Поиск по дате/мыслям' />
  <div id='historyList'>${items.map(r=>`<div class='list-item'><b>${r.date}</b> · ${templateName(r.templateId)}
  <div>${r.reflection.thought || '-'}</div><button data-id='${r.id}' class='editReport'>Редактировать и пересохранить</button></div>`).join('')}</div></div>`;
  root.querySelectorAll('.editReport').forEach(btn => btn.onclick = () => {
    const r = state.reports.find(x => x.id === btn.dataset.id);
    state.drafts.report = { sleepHours:r.health.sleepHours, sleepQuality:r.health.sleepQuality, energy:r.health.energy, stress:r.health.stress, mood:r.health.mood, steps:r.health.steps, deepWorkMin:r.ege.deepWorkMin, pomodoros:r.ege.pomodoros, weight:r.health.weight, whatsNew:r.reflection.whatsNew, thought:r.reflection.thought };
    activateTab('report'); render();
  });
  document.getElementById('historySearch').oninput = e => {
    const q = e.target.value.toLowerCase();
    root.querySelectorAll('.list-item').forEach(el => el.hidden = !el.textContent.toLowerCase().includes(q));
  };
}

function templateName(id){return state.templates.find(t=>t.id===id)?.name || id;}

function drawLine(canvas, values, color='#2563eb') {
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth*devicePixelRatio;
  const H = canvas.height = 180*devicePixelRatio;
  ctx.clearRect(0,0,W,H); ctx.strokeStyle = color; ctx.lineWidth = 2*devicePixelRatio;
  const max = Math.max(1, ...values); const min = Math.min(...values, 0);
  values.forEach((v,i) => {
    const x = (i/(values.length-1||1))*(W-20)+10;
    const y = H-10-((v-min)/(max-min||1))*(H-20);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();
}

function corr(a,b){
  if(a.length!==b.length||a.length<2) return 0;
  const ma = a.reduce((x,y)=>x+y,0)/a.length, mb = b.reduce((x,y)=>x+y,0)/b.length;
  const cov = a.reduce((s,v,i)=>s+(v-ma)*(b[i]-mb),0);
  const da = Math.sqrt(a.reduce((s,v)=>s+(v-ma)**2,0));
  const db = Math.sqrt(b.reduce((s,v)=>s+(v-mb)**2,0));
  return da&&db ? cov/(da*db) : 0;
}

function renderAnalytics() {
  const root = document.getElementById('analytics');
  if (!state.user) { root.hidden = true; return; }
  root.hidden = false;
  const last30 = [...state.reports].slice(-30);
  const last7 = last30.slice(-7);
  const sleep30 = last30.map(r=>r.health.sleepHours), energy30 = last30.map(r=>r.health.energy), stress30 = last30.map(r=>r.health.stress), mood30 = last30.map(r=>r.health.mood), weight30 = last30.map(r=>r.health.weight), steps30 = last30.map(r=>r.health.steps), deep30 = last30.map(r=>r.ege.deepWorkMin);
  const insights = [];
  const goodSleep = last30.filter(r=>r.health.sleepHours >= 7);
  if (goodSleep.length) insights.push(`В дни, когда сон ≥ 7ч, энергия в среднем ${numAvg(goodSleep.map(r=>r.health.energy))}`);
  const lowDeep = last30.filter(r=>r.ege.deepWorkMin < 60);
  if (lowDeep.length) insights.push(`При deep work < 60 мин стресс ≈ ${numAvg(lowDeep.map(r=>r.health.stress))}`);
  root.innerHTML = `<div class='card'><h2>Аналитика</h2>
  <p>Средние 7д: сон ${numAvg(last7.map(r=>r.health.sleepHours))}, энергия ${numAvg(last7.map(r=>r.health.energy))}, стресс ${numAvg(last7.map(r=>r.health.stress))}, настроение ${numAvg(last7.map(r=>r.health.mood))}</p>
  <p>Средние 30д: сон ${numAvg(sleep30)}, deep work ${numAvg(deep30)}</p>
  <p>Корреляции: сон↔энергия ${corr(sleep30, energy30).toFixed(2)}, deep work↔настроение ${corr(deep30, mood30).toFixed(2)}</p>
  <canvas id='sleepChart'></canvas>
  <canvas id='energyChart'></canvas>
  <canvas id='stressChart'></canvas>
  <canvas id='moodChart'></canvas>
  <canvas id='weightChart'></canvas>
  <canvas id='stepsChart'></canvas>
  <canvas id='deepChart'></canvas>
  <h3>Insights <input type='checkbox' id='insightsToggle' ${state.settings.insightsEnabled?'checked':''}></h3>
  <ul>${state.settings.insightsEnabled ? insights.map(i=>`<li>${i}</li>`).join('') : '<li>Отключено</li>'}</ul></div>`;
  drawLine(document.getElementById('sleepChart'), sleep30);
  drawLine(document.getElementById('energyChart'), energy30, '#059669');
  drawLine(document.getElementById('stressChart'), stress30, '#dc2626');
  drawLine(document.getElementById('moodChart'), mood30, '#9333ea');
  drawLine(document.getElementById('weightChart'), weight30, '#ea580c');
  drawLine(document.getElementById('stepsChart'), steps30, '#0ea5e9');
  drawLine(document.getElementById('deepChart'), deep30, '#16a34a');
  document.getElementById('insightsToggle').onchange = (e)=>{state.settings.insightsEnabled=e.target.checked; render();};
}

function isBlocked(url) {
  const host = url.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
  const all = [...state.blockRules.categories.social, ...state.blockRules.categories.adult, ...state.blockRules.categories.other];
  if (state.blockRules.allowlist.some(d => host.includes(d))) return false;
  return all.some(d => host.includes(d));
}

function renderFocus() {
  const root = document.getElementById('focus');
  if (!state.user) { root.hidden = true; return; }
  root.hidden = false;
  root.innerHTML = `<div class='card'><h2>Focus & Blocker</h2>
  <p>Strict level: ${state.blockRules.strictLevel}</p>
  <div class='row'><label>Сайт<input id='focusUrl' placeholder='https://example.com'></label><button id='openFocus'>Открыть в Focus Browser</button></div>
  <div id='focusView' class='card'><small>Встроенный Focus Browser (MVP): текстовый просмотр URL</small></div>
  <h3>Фокус-сессия</h3>
  <div class='row'><input id='focusMin' type='number' value='25'><button id='startFocus'>Start Pomodoro</button></div>
  <h3>Настройки блокировок (PIN)</h3>
  <div class='row'><input id='pinInput' placeholder='PIN'><button id='unlockSettings'>Открыть</button></div>
  <div id='settingsPanel' hidden>
    <label>Strict Level<select id='strictLevel'><option>1</option><option>2</option><option>3</option><option>4</option></select></label>
    <label>Delay (min)<input id='delayMin' type='number' value='${state.blockRules.delayMin}'></label>
    <button id='saveBlock'>Сохранить</button>
  </div>
  <button id='disableBlock' class='warn'>Отключить блокировки (Unlock Flow)</button>
  <h3>Журнал попыток</h3>
  ${state.unlockAttempts.slice(-10).reverse().map(a=>`<div class='list-item'>${new Date(a.ts).toLocaleString()} · ${a.result} · ${a.reason} · ждала ${a.waitedMin}m</div>`).join('')}
  </div>`;
  root.querySelector('#strictLevel').value = String(state.blockRules.strictLevel);

  document.getElementById('openFocus').onclick = () => {
    const url = document.getElementById('focusUrl').value.trim();
    const blocked = isBlocked(url);
    document.getElementById('focusView').innerHTML = blocked ? `<p class='warn'>Домен заблокирован правилом Focus Mode</p>` : `<p>Открыт: ${url}</p>`;
  };
  document.getElementById('startFocus').onclick = () => {
    const min = Number(document.getElementById('focusMin').value || 25);
    state.focusSessions.push({ id: crypto.randomUUID(), type: 'pomodoro', durationMin: min, status: 'running', startedAt: Date.now()});
    alert(`Фокус-сессия ${min} минут начата. Блокировки активны.`);
    render();
  };
  document.getElementById('unlockSettings').onclick = () => {
    if (document.getElementById('pinInput').value === state.settings.pin) document.getElementById('settingsPanel').hidden = false;
    else alert('Неверный PIN');
  };
  document.getElementById('saveBlock').onclick = () => {
    state.blockRules.strictLevel = Number(document.getElementById('strictLevel').value);
    state.blockRules.delayMin = Number(document.getElementById('delayMin').value);
    blockerAdapter.syncRules(state.blockRules);
    render();
  };
  document.getElementById('disableBlock').onclick = async () => {
    const level = state.blockRules.strictLevel;
    const reason = prompt('Причина отключения?') || '';
    let waited = 0;
    if (level >= 2) {
      waited = state.blockRules.delayMin;
      alert(`Таймер задержки ${waited} минут (симуляция MVP).`);
    }
    if (level >= 3) {
      const alt = prompt('Выбери альтернативу вместо соцсети:');
      if (!alt) return alert('Нужно заполнить задание');
    }
    if (level >= 4) {
      const code = prompt('Введите код партнёра:');
      if (code !== state.settings.accountabilityCode) {
        state.unlockAttempts.push({ ts: Date.now(), reason, result: 'denied_l4', waitedMin: waited });
        return render();
      }
    }
    state.unlockAttempts.push({ ts: Date.now(), reason, result: 'approved', waitedMin: waited });
    alert('Блокировки временно отключены (MVP).');
    render();
  };
}

function renderTemplates() {
  const root = document.getElementById('templates');
  if (!state.user) { root.hidden = true; return; }
  root.hidden = false;
  root.innerHTML = `<div class='card'><h2>Редактор шаблонов</h2>
    ${state.templates.map(t=>`<div class='list-item'><b>${t.name}</b> (${t.mode})<br><small>Кастомные вопросы: ${t.customQuestions.join(' | ') || '-'}</small></div>`).join('')}
    <label>Название<input id='tplName'></label>
    <label>Режим<select id='tplMode'><option value='short'>short</option><option value='full'>full</option></select></label>
    <label>Кастомные вопросы (через ; )<textarea id='tplQs'></textarea></label>
    <button id='createTpl'>Создать шаблон</button>
  </div>`;
  document.getElementById('createTpl').onclick = () => {
    const name = document.getElementById('tplName').value.trim();
    if (!name) return;
    state.templates.push({ id: crypto.randomUUID(), name, mode: document.getElementById('tplMode').value, customQuestions: document.getElementById('tplQs').value.split(';').map(s=>s.trim()).filter(Boolean) });
    render();
  };
}

function activateTab(tab) {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.hidden = p.id !== tab);
}

document.getElementById('themeToggle').onclick = () => { state.theme = state.theme === 'light' ? 'dark' : 'light'; render(); };
document.getElementById('loginBtn').onclick = () => {
  const email = document.getElementById('emailInput').value.trim();
  if (!email) return;
  state.user = { id: crypto.randomUUID(), email, authType: 'email' };
  document.getElementById('authSection').hidden = true;
  document.getElementById('appTabs').hidden = false;
  render();
};
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => activateTab(b.dataset.tab));

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); deferredPrompt = e; const btn = document.getElementById('installBtn'); btn.hidden = false;
  btn.onclick = async () => { deferredPrompt.prompt(); await deferredPrompt.userChoice; btn.hidden = true; };
});

window.addEventListener('online', () => {
  if (state.syncQueue.length) {
    state.syncQueue = [];
    persist();
    console.log('Synced queued changes');
  }
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
if (state.user) { document.getElementById('authSection').hidden = true; document.getElementById('appTabs').hidden = false; }
render();
