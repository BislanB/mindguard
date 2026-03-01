import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/index.js';

export function FocusTimer() {
  const currentSession = useAppStore((s) => s.currentFocusSession);
  const startSession = useAppStore((s) => s.startFocusSession);
  const pauseSession = useAppStore((s) => s.pauseFocusSession);
  const resumeSession = useAppStore((s) => s.resumeFocusSession);
  const stopSession = useAppStore((s) => s.stopFocusSession);
  const tick = useAppStore((s) => s.tickFocusSession);

  const [sessionType, setSessionType] = useState<'pomodoro' | 'deepwork'>('pomodoro');
  const [customMinutes, setCustomMinutes] = useState(25);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick interval
  useEffect(() => {
    if (currentSession?.status === 'running') {
      intervalRef.current = setInterval(() => tick(), 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [currentSession?.status, tick]);

  // Completion sound
  useEffect(() => {
    if (currentSession === null && intervalRef.current) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch { /* ignore */ }
    }
  }, [currentSession]);

  const handleStart = () => {
    const minutes = sessionType === 'pomodoro' ? 25 : customMinutes;
    startSession(sessionType, minutes);
  };

  if (!currentSession) {
    return (
      <div className="focus-timer">
        <div className="tabs" style={{ width: '100%' }}>
          <button
            className={`tabs__item${sessionType === 'pomodoro' ? ' tabs__item--active' : ''}`}
            onClick={() => { setSessionType('pomodoro'); setCustomMinutes(25); }}
          >
            Помодоро
          </button>
          <button
            className={`tabs__item${sessionType === 'deepwork' ? ' tabs__item--active' : ''}`}
            onClick={() => { setSessionType('deepwork'); setCustomMinutes(60); }}
          >
            Глубокая работа
          </button>
        </div>

        {sessionType === 'deepwork' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              className="input"
              type="number"
              min={10}
              max={180}
              step={5}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Number(e.target.value))}
              style={{ width: 80, textAlign: 'center' }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>минут</span>
          </div>
        )}

        <TimerCircle
          remaining={sessionType === 'pomodoro' ? 25 * 60 : customMinutes * 60}
          total={sessionType === 'pomodoro' ? 25 * 60 : customMinutes * 60}
        />

        <button className="btn btn--primary btn--lg" onClick={handleStart}>
          Начать
        </button>
      </div>
    );
  }

  const total = currentSession.durationMinutes * 60;

  return (
    <div className="focus-timer">
      <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
        {currentSession.type === 'pomodoro' ? 'Помодоро' : 'Глубокая работа'}
        {currentSession.blockingEnabled && (
          <span className="badge badge--danger" style={{ marginLeft: 8 }}>Блокировка активна</span>
        )}
      </div>

      <TimerCircle remaining={currentSession.remainingSeconds} total={total} />

      <div className="focus-timer__controls">
        {currentSession.status === 'running' ? (
          <button className="btn btn--secondary" onClick={pauseSession}>Пауза</button>
        ) : (
          <button className="btn btn--primary" onClick={resumeSession}>Продолжить</button>
        )}
        <button className="btn btn--danger" onClick={stopSession}>Стоп</button>
      </div>
    </div>
  );
}

function TimerCircle({ remaining, total }: { remaining: number; total: number }) {
  const progress = total > 0 ? remaining / total : 1;
  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const display = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <div className="focus-timer__circle">
      <svg width="220" height="220" viewBox="0 0 220 220">
        <circle
          cx="110" cy="110" r={radius}
          fill="none"
          stroke="var(--bg-input)"
          strokeWidth="8"
        />
        <circle
          cx="110" cy="110" r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className="focus-timer__time">{display}</div>
    </div>
  );
}
