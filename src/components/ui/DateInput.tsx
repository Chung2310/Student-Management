import React, { useEffect, useState, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { toDisplayDate, toInputDate } from '../../lib/utils';

interface DateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  onBlur?: (value: string) => void;
  className?: string;
  variant?: 'default' | 'modal';
}

function formatDateValue(value: string): string {
  const displayValue = toDisplayDate(value);
  const match = displayValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return match
    ? `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[3]}`
    : displayValue;
}

export function DateInput({
  label,
  value,
  onChange,
  required = true,
  error,
  onBlur,
  className = '',
  variant = 'default'
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  
  const [localVal, setLocalVal] = useState(() => formatDateValue(value));

  useEffect(() => {
    // Only overwrite local value if the input is not currently focused by the user
    if (document.activeElement !== inputRef.current) {
      setLocalVal(formatDateValue(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    const val = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
      .filter(Boolean)
      .join('/');
    setLocalVal(val);
    onChange(val);
  };

  const handleBlurEvent = () => {
    onBlur?.(localVal);
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = formatDateValue(e.target.value);
    setLocalVal(val);
    onChange(val);
  };

  const isModal = variant === 'modal';

  const openPicker = () => {
    try {
      pickerRef.current?.showPicker();
    } catch {
      pickerRef.current?.click();
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label className={`text-[10px] font-bold uppercase ${isModal ? 'text-slate-800 tracking-wider' : 'text-slate-400 tracking-widest ml-1'}`}>
        {label} {required && <span className={isModal ? 'text-rose-500' : ''}>*</span>}
      </label>
      <div className={`relative ${isModal ? 'h-10' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          required={required}
          value={localVal}
          onChange={handleChange}
          onBlur={handleBlurEvent}
          placeholder="DD/MM/YYYY"
          className={`w-full pl-4 pr-12 rounded-xl border outline-none transition-all font-medium text-slate-900 text-sm ${isModal ? 'h-full bg-white focus:ring-4' : 'py-3.5 bg-slate-50'} ${
            error 
              ? `border-rose-500 bg-rose-50/10 focus:border-rose-500 ${isModal ? 'focus:ring-rose-500/5' : ''}`
              : `${isModal ? 'border-slate-200 focus:ring-cyan-600/5' : 'border-slate-100'} focus:border-cyan-600 focus:bg-white`
          }`}
        />
        <button
          type="button"
          onClick={openPicker}
          title={`Chọn ${label.toLowerCase()}`}
          aria-label={`Chọn ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 z-10 flex w-11 items-center justify-center text-slate-400 hover:text-cyan-600"
        >
          <Calendar className="h-4 w-4" />
        </button>
        <input
          ref={pickerRef}
          type="date"
          value={toInputDate(value)}
          onChange={handlePickerChange}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 h-0 w-0 overflow-hidden border-0 p-0 opacity-0"
          tabIndex={-1}
        />
      </div>
      {error && <p className={`text-[11px] font-bold text-rose-500 ${isModal ? 'mt-1' : 'ml-1'}`}>{error}</p>}
    </div>
  );
}
