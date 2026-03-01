import { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { useAppStore } from '../../store/index.js';
import type { BlockRule } from '../../types/index.js';

interface BlockScreenProps {
  url: string;
  rule: BlockRule;
  onClose: () => void;
}

const ALTERNATIVES = [
  'Прогулка',
  'Чтение книги',
  'Медитация',
  'Отжимания / растяжка',
  'Стакан воды',
  'Дыхательное упражнение',
  'Записать мысли в дневник',
];

export function BlockScreen({ url, rule, onClose }: BlockScreenProps) {
  const settings = useAppStore((s) => s.settings);
  const saveUnlockAttempt = useAppStore((s) => s.saveUnlockAttempt);
  const updateBlockerSettings = useAppStore((s) => s.updateBlockerSettings);

  const level = rule.strictLevel;
  const delayMinutes = settings.blockerSettings.delayMinutes;

  const [countdown, setCountdown] = useState(delayMinutes * 60);
  const [reason, setReason] = useState('');
  const [alternative, setAlternative] = useState('');
  const [proceeded, setProceeded] = useState(false);

  // Countdown for L2+
  useEffect(() => {
    if (level < 2) return;
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [level, countdown]);

  const canProceed = () => {
    if (level === 1) return true;
    if (countdown > 0) return false;
    if (level >= 3 && (reason.length < 20 || !alternative)) return false;
    return true;
  };

  const handleProceed = () => {
    saveUnlockAttempt({
      id: uuid(),
      ruleId: rule.id,
      ruleName: rule.name,
      url,
      reason,
      alternative,
      timestamp: new Date().toISOString(),
      granted: true,
      level,
    });
    setProceeded(true);
  };

  const handleBack = () => {
    saveUnlockAttempt({
      id: uuid(),
      ruleId: rule.id,
      ruleName: rule.name,
      url,
      reason: '',
      alternative: '',
      timestamp: new Date().toISOString(),
      granted: false,
      level,
    });
    onClose();
  };

  const handleEmergencyAccess = () => {
    const last = settings.blockerSettings.lastEmergencyAccess;
    const cooldownDays = settings.blockerSettings.emergencyAccessDays;
    if (last) {
      const elapsed = (Date.now() - new Date(last).getTime()) / 86400000;
      if (elapsed < cooldownDays) {
        const remaining = Math.ceil(cooldownDays - elapsed);
        alert(`Экстренный доступ недоступен ещё ${remaining} дн.`);
        return;
      }
    }
    updateBlockerSettings({ lastEmergencyAccess: new Date().toISOString() });
    setProceeded(true);
  };

  if (proceeded) {
    return (
      <div className="block-screen">
        <div className="block-screen__icon">✅</div>
        <div className="block-screen__title">Доступ разрешён</div>
        <p className="block-screen__message">
          Помните: этот визит записан в журнал разблокировок.
        </p>
        <button className="btn btn--secondary" onClick={onClose}>Закрыть</button>
      </div>
    );
  }

  return (
    <div className="block-screen">
      <div className="block-screen__icon">🛑</div>
      <div className="block-screen__title">Сайт заблокирован</div>
      <p className="block-screen__message">
        Правило «{rule.name}» блокирует доступ к этому сайту.
      </p>

      {level >= 2 && countdown > 0 && (
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--warning)', fontVariantNumeric: 'tabular-nums' }}>
          {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
        </div>
      )}

      {level >= 3 && (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <div className="form-group">
            <label className="form-label">Почему вы хотите зайти? (мин. 20 символов)</label>
            <textarea
              className="textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Объясните причину..."
              rows={3}
            />
            <div style={{ fontSize: 12, color: reason.length >= 20 ? 'var(--success)' : 'var(--text-muted)', textAlign: 'right' }}>
              {reason.length}/20
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Выберите альтернативу</label>
            <div className="chips">
              {ALTERNATIVES.map((alt) => (
                <button
                  key={alt}
                  className={`chip${alternative === alt ? ' chip--active' : ''}`}
                  onClick={() => setAlternative(alt)}
                  type="button"
                >
                  {alt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 320 }}>
        <button className="btn btn--primary btn--lg" onClick={handleBack}>
          Вернуться (правильный выбор!)
        </button>

        {level >= 2 && (
          <button
            className="btn btn--ghost btn--sm"
            disabled={!canProceed()}
            onClick={handleProceed}
            style={{ opacity: canProceed() ? 1 : 0.3 }}
          >
            Продолжить всё равно
          </button>
        )}

        {level >= 3 && (
          <button
            className="btn btn--ghost btn--sm"
            style={{ fontSize: 12, color: 'var(--text-muted)' }}
            onClick={handleEmergencyAccess}
          >
            Экстренный доступ
          </button>
        )}
      </div>
    </div>
  );
}
