import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, hashPin } from '../store/index.js';
import { Modal } from '../components/common/Modal.js';
import { PinInput } from '../components/common/PinInput.js';
import { v4 as uuid } from 'uuid';
import type { BlockRule } from '../types/index.js';

export function SettingsPage() {
  const navigate = useNavigate();
  const settings = useAppStore((s) => s.settings);
  const templates = useAppStore((s) => s.templates);
  const blockRules = useAppStore((s) => s.blockRules);
  const unlockAttempts = useAppStore((s) => s.unlockAttempts);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const updateBlockerSettings = useAppStore((s) => s.updateBlockerSettings);
  const saveBlockRule = useAppStore((s) => s.saveBlockRule);
  const deleteBlockRule = useAppStore((s) => s.deleteBlockRule);
  const verifyPin = useAppStore((s) => s.verifyPin);
  const reports = useAppStore((s) => s.reports);

  const [blockerUnlocked, setBlockerUnlocked] = useState(!settings.blockerSettings.pin);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSetPinModal, setShowSetPinModal] = useState(false);
  const [editingRule, setEditingRule] = useState<BlockRule | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);

  const handleBlockerAccess = () => {
    if (!settings.blockerSettings.pin) {
      setBlockerUnlocked(true);
    } else {
      setShowPinModal(true);
    }
  };

  const handleExportData = () => {
    const data = {
      settings,
      reports,
      templates,
      blockRules,
      unlockAttempts,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindguard-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Настройки</h1>
      </div>

      {/* General */}
      <div className="settings-section">
        <div className="settings-section__title">Общие</div>
        <div className="settings-row" style={{ borderRadius: 'var(--radius) var(--radius) 0 0' }}>
          <span className="settings-row__label">Тема</span>
          <div className="tabs" style={{ margin: 0, width: 200 }}>
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                className={`tabs__item${settings.theme === t ? ' tabs__item--active' : ''}`}
                style={{ padding: '4px 8px', fontSize: 12 }}
                onClick={() => updateSettings({ theme: t })}
              >
                {t === 'light' ? 'Светлая' : t === 'dark' ? 'Тёмная' : 'Авто'}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-row" style={{ borderRadius: '0 0 var(--radius) var(--radius)' }}>
          <span className="settings-row__label">Шаблон по умолчанию</span>
          <select
            className="select"
            style={{ width: 160, fontSize: 13 }}
            value={settings.defaultTemplateId}
            onChange={(e) => updateSettings({ defaultTemplateId: e.target.value })}
          >
            <option value="">Не выбран</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates */}
      <div className="settings-section">
        <div className="settings-section__title">Шаблоны отчётов</div>
        <div className="settings-row" style={{ borderRadius: 'var(--radius)' }} onClick={() => navigate('/templates')}>
          <span className="settings-row__label">Управление шаблонами</span>
          <span className="settings-row__value">{templates.length} шт. →</span>
        </div>
      </div>

      {/* Blocker */}
      <div className="settings-section">
        <div className="settings-section__title">Блокировщик</div>
        {!blockerUnlocked ? (
          <div className="settings-row" style={{ borderRadius: 'var(--radius)' }} onClick={handleBlockerAccess}>
            <span className="settings-row__label">Разблокировать настройки</span>
            <span className="settings-row__value">🔒</span>
          </div>
        ) : (
          <div>
            <div className="settings-row" style={{ borderRadius: 'var(--radius) var(--radius) 0 0' }}>
              <span className="settings-row__label">Включён</span>
              <div
                className={`toggle${settings.blockerSettings.enabled ? ' toggle--active' : ''}`}
                onClick={() => updateBlockerSettings({ enabled: !settings.blockerSettings.enabled })}
              >
                <div className="toggle__track"><div className="toggle__thumb" /></div>
              </div>
            </div>

            <div className="settings-row">
              <span className="settings-row__label">Уровень строгости</span>
              <div className="tabs" style={{ margin: 0, width: 180 }}>
                {([1, 2, 3, 4] as const).map((l) => (
                  <button
                    key={l}
                    className={`tabs__item${settings.blockerSettings.strictLevel === l ? ' tabs__item--active' : ''}`}
                    style={{ padding: '4px 6px', fontSize: 12 }}
                    onClick={() => updateBlockerSettings({ strictLevel: l })}
                  >
                    L{l}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-row">
              <span className="settings-row__label">Задержка (L2+)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  className="input input--sm"
                  type="number"
                  min={1}
                  max={60}
                  value={settings.blockerSettings.delayMinutes}
                  onChange={(e) => updateBlockerSettings({ delayMinutes: Number(e.target.value) })}
                  style={{ width: 60, textAlign: 'center' }}
                />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>мин</span>
              </div>
            </div>

            <div className="settings-row">
              <span className="settings-row__label">Экстренный доступ</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>раз в</span>
                <input
                  className="input input--sm"
                  type="number"
                  min={1}
                  max={30}
                  value={settings.blockerSettings.emergencyAccessDays}
                  onChange={(e) => updateBlockerSettings({ emergencyAccessDays: Number(e.target.value) })}
                  style={{ width: 50, textAlign: 'center' }}
                />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>дн</span>
              </div>
            </div>

            <div className="settings-row">
              <span className="settings-row__label">PIN-код</span>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => setShowSetPinModal(true)}
              >
                {settings.blockerSettings.pin ? 'Изменить' : 'Установить'}
              </button>
            </div>

            {/* Block Rules */}
            <div style={{ margin: '12px 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', paddingLeft: 4 }}>
              ПРАВИЛА БЛОКИРОВКИ
            </div>
            {blockRules.map((rule) => (
              <div key={rule.id} className="settings-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{rule.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {rule.domains.length} доменов · L{rule.strictLevel}
                  </div>
                </div>
                <div
                  className={`toggle${rule.enabled ? ' toggle--active' : ''}`}
                  onClick={() => saveBlockRule({ ...rule, enabled: !rule.enabled })}
                  style={{ transform: 'scale(0.8)' }}
                >
                  <div className="toggle__track"><div className="toggle__thumb" /></div>
                </div>
              </div>
            ))}
            <button
              className="btn btn--ghost btn--sm"
              style={{ marginTop: 8 }}
              onClick={() => {
                setEditingRule({
                  id: uuid(),
                  category: 'custom',
                  name: '',
                  domains: [],
                  keywords: [],
                  enabled: true,
                  strictLevel: settings.blockerSettings.strictLevel,
                  duringFocusOnly: false,
                });
                setShowAddRule(true);
              }}
            >
              + Добавить правило
            </button>

            {/* Allowlist */}
            <div style={{ margin: '12px 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', paddingLeft: 4 }}>
              БЕЛЫЙ СПИСОК
            </div>
            <div className="settings-row" style={{ borderRadius: 'var(--radius)', flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
              <div className="chips">
                {settings.blockerSettings.allowlist.map((d) => (
                  <span
                    key={d}
                    className="chip chip--active"
                    onClick={() =>
                      updateBlockerSettings({
                        allowlist: settings.blockerSettings.allowlist.filter((x) => x !== d),
                      })
                    }
                  >
                    {d} ✕
                  </span>
                ))}
              </div>
              <input
                className="input input--sm"
                placeholder="Добавить домен и нажать Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val && !settings.blockerSettings.allowlist.includes(val)) {
                      updateBlockerSettings({
                        allowlist: [...settings.blockerSettings.allowlist, val],
                      });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Unlock journal */}
      <div className="settings-section">
        <div className="settings-section__title">Журнал разблокировок</div>
        {unlockAttempts.length === 0 ? (
          <div className="settings-row" style={{ borderRadius: 'var(--radius)' }}>
            <span className="settings-row__label" style={{ color: 'var(--text-muted)' }}>Пока пусто</span>
          </div>
        ) : (
          [...unlockAttempts]
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
            .slice(0, 20)
            .map((a) => (
              <div key={a.id} className="settings-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>
                    <span style={{ color: a.granted ? 'var(--danger)' : 'var(--success)' }}>
                      {a.granted ? '🔓' : '🔒'}
                    </span>{' '}
                    {a.ruleName} — {a.url.slice(0, 30)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(a.timestamp).toLocaleString('ru-RU')}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Data */}
      <div className="settings-section">
        <div className="settings-section__title">Данные</div>
        <div className="settings-row" style={{ borderRadius: 'var(--radius) var(--radius) 0 0' }} onClick={handleExportData}>
          <span className="settings-row__label">Экспорт всех данных</span>
          <span className="settings-row__value">JSON →</span>
        </div>
        <div
          className="settings-row"
          style={{ borderRadius: '0 0 var(--radius) var(--radius)' }}
          onClick={() => {
            if (confirm('Вы уверены? Все данные будут удалены навсегда.')) {
              indexedDB.deleteDatabase('mindguard-db');
              window.location.reload();
            }
          }}
        >
          <span className="settings-row__label" style={{ color: 'var(--danger)' }}>Очистить все данные</span>
        </div>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <Modal open onClose={() => setShowPinModal(false)}>
          <PinInput
            title="Введите PIN"
            onSubmit={(pin) => {
              if (verifyPin(pin)) {
                setBlockerUnlocked(true);
                setShowPinModal(false);
                return true;
              }
              return false;
            }}
            onCancel={() => setShowPinModal(false)}
          />
        </Modal>
      )}

      {/* Set PIN Modal */}
      {showSetPinModal && (
        <Modal open onClose={() => setShowSetPinModal(false)} title="Установить PIN">
          <PinInput
            title="Введите новый PIN"
            onSubmit={(pin) => {
              updateBlockerSettings({ pin: hashPin(pin) });
              setShowSetPinModal(false);
              return true;
            }}
            onCancel={() => setShowSetPinModal(false)}
          />
        </Modal>
      )}

      {/* Add Rule Modal */}
      {showAddRule && editingRule && (
        <Modal open onClose={() => setShowAddRule(false)} title="Новое правило">
          <div className="form-group">
            <label className="form-label">Название</label>
            <input
              className="input"
              value={editingRule.name}
              onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Домены (через запятую)</label>
            <input
              className="input"
              placeholder="example.com, site.ru"
              value={editingRule.domains.join(', ')}
              onChange={(e) =>
                setEditingRule({
                  ...editingRule,
                  domains: e.target.value.split(',').map((d) => d.trim()).filter(Boolean),
                })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Ключевые слова (через запятую)</label>
            <input
              className="input"
              value={editingRule.keywords.join(', ')}
              onChange={(e) =>
                setEditingRule({
                  ...editingRule,
                  keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean),
                })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Уровень строгости</label>
            <div className="tabs" style={{ margin: 0 }}>
              {([1, 2, 3, 4] as const).map((l) => (
                <button
                  key={l}
                  className={`tabs__item${editingRule.strictLevel === l ? ' tabs__item--active' : ''}`}
                  onClick={() => setEditingRule({ ...editingRule, strictLevel: l })}
                >
                  L{l}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <div
              className={`toggle${editingRule.duringFocusOnly ? ' toggle--active' : ''}`}
              onClick={() => setEditingRule({ ...editingRule, duringFocusOnly: !editingRule.duringFocusOnly })}
            >
              <div className="toggle__track"><div className="toggle__thumb" /></div>
              <span className="toggle__label">Только во время фокуса</span>
            </div>
          </div>
          <div className="modal__actions">
            <button className="btn btn--secondary" style={{ flex: 1 }} onClick={() => setShowAddRule(false)}>
              Отмена
            </button>
            <button
              className="btn btn--primary"
              style={{ flex: 1 }}
              disabled={!editingRule.name}
              onClick={() => {
                saveBlockRule(editingRule);
                setShowAddRule(false);
                setEditingRule(null);
              }}
            >
              Сохранить
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
