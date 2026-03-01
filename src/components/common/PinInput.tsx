import { useState, useRef, useEffect } from 'react';

interface PinInputProps {
  onSubmit: (pin: string) => boolean;
  onCancel: () => void;
  title: string;
}

export function PinInput({ onSubmit, onCancel, title }: PinInputProps) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    refs[0].current?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    setError(false);

    if (value && index < 3) {
      refs[index + 1].current?.focus();
    }

    if (next.every((d) => d !== '') && index === 3) {
      const pin = next.join('');
      const ok = onSubmit(pin);
      if (!ok) {
        setError(true);
        setDigits(['', '', '', '']);
        setTimeout(() => refs[0].current?.focus(), 400);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  return (
    <div className="pin-input">
      <div className="pin-input__title">{title}</div>
      <div className={`pin-input__digits${error ? ' pin-input--error' : ''}`}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            className="pin-input__digit"
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
          />
        ))}
      </div>
      <button className="btn btn--ghost" onClick={onCancel}>Отмена</button>
    </div>
  );
}
