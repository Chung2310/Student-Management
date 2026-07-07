import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  selectClassName?: string;
  theme?: 'register' | 'modal';
}

export function CustomSelect({
  label,
  value,
  onChange,
  options,
  groups,
  placeholder = 'Chọn một tùy chọn...',
  required = false,
  error,
  className = '',
  selectClassName = '',
  theme = 'modal',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate fixed position to avoid overflow-hidden clip
  const recalcPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 240; // max-h-60
    const openUpward = spaceBelow < dropdownHeight + 8 && rect.top > dropdownHeight;
    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recalc on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => recalcPosition();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [isOpen, recalcPosition]);

  // Find currently selected label
  let selectedLabel = placeholder;
  let hasSelection = false;

  if (value) {
    if (options) {
      const found = options.find(opt => opt.value === value);
      if (found) {
        selectedLabel = found.label;
        hasSelection = true;
      }
    } else if (groups) {
      for (const group of groups) {
        const found = group.options.find(opt => opt.value === value);
        if (found) {
          selectedLabel = found.label;
          hasSelection = true;
          break;
        }
      }
    }
  }

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const isRegister = theme === 'register';

  return (
    <div className={`space-y-1 relative ${className}`} ref={containerRef}>
      {label && (
        <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${isRegister ? 'text-slate-400' : 'text-slate-800'}`}>
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            if (!isOpen) recalcPosition();
            setIsOpen(!isOpen);
          }}
          className={`w-full text-left flex items-center justify-between transition-all outline-none cursor-pointer ${
            isRegister 
              ? 'px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-100 font-bold text-sm focus:border-cyan-600 focus:bg-white' 
              : 'px-4 py-2.5 rounded-xl bg-white border border-slate-200 font-semibold text-sm focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600'
          } ${error ? 'border-rose-300 focus:border-rose-500 bg-rose-50/5' : ''} ${
            hasSelection ? 'text-slate-900' : 'text-slate-400'
          } ${selectClassName}`}
        >
          <span>{selectedLabel}</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={dropdownStyle}
              className="bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden max-h-60 flex flex-col"
            >
              <div className="overflow-y-auto p-1.5 space-y-1">
                {placeholder && (
                  <button
                    type="button"
                    onClick={() => handleSelect('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      !value 
                        ? 'bg-cyan-50 text-cyan-700 font-bold' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    }`}
                  >
                    <span>{placeholder}</span>
                    {!value && <Check className="w-3.5 h-3.5 text-cyan-600" />}
                  </button>
                )}

                {options && options.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-cyan-50 text-cyan-700 font-bold' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600" />}
                    </button>
                  );
                })}

                {groups && groups.map((group, groupIdx) => (
                  <div key={groupIdx} className="space-y-0.5">
                    <div className="px-3 py-1.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50/50 rounded-md">
                      {group.label}
                    </div>
                    {group.options.map((opt) => {
                      const isSelected = opt.value === value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelect(opt.value)}
                          className={`w-full text-left px-5 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected 
                              ? 'bg-cyan-50 text-cyan-700 font-bold' 
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && <p className="text-[11px] font-bold text-rose-500 ml-1">{error}</p>}
    </div>
  );
}
