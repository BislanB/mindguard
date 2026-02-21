# MindGuard MVP

PWA-прототип для ежедневных отчётов, аналитики и режима Focus/Blocker.

## Что реализовано
- Mobile-first PWA (manifest + service worker) с light/dark темой.
- Простая авторизация по email.
- Ежедневный отчёт с шаблонами, автосохранением черновика, сохранением/редактированием и экспортом/копированием.
- История с поиском.
- Аналитика за 7/30 дней: средние, графики, простые корреляции, insights toggle.
- Focus & Blocker модуль:
  - Focus Browser (MVP: проверка URL на блоклист и allowlist);
  - фокус-сессии Pomodoro;
  - strict mode уровни 1-4 и Unlock Flow (delay + задание + код партнёра для L4);
  - PIN-защита настроек;
  - журнал попыток разблокировки.
- Архитектурный задел V2: `SystemBlockerAdapter` интерфейс для компаньон-расширения/Android service.
- Offline-first: локальное хранилище + очередь синхронизации и сброс при `online`.

## Запуск
```bash
python3 -m http.server 4173
```
Откройте `http://localhost:4173`.
