import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
}

interface FilterDropdownProps<T extends string> {
  label: string;
  icon?: React.ReactNode;
  options: DropdownOption<T>[];
  /** Multi-select when `selected`/`onChange` deal with arrays, single-select otherwise */
  multiple?: boolean;
  selected: T[];
  onChange: (values: T[]) => void;
  placeholder?: string;
}

// A compact trigger button that opens a scrollable checklist/list panel — used for every
// sidebar filter (mood, category, budget, group size, sort) instead of long rows of pill buttons.
export function FilterDropdown<T extends string>({
  label,
  icon,
  options,
  multiple = false,
  selected,
  onChange,
  placeholder = 'Any'
}: FilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleValue = (value: T) => {
    if (multiple) {
      const exists = selected.includes(value);
      onChange(exists ? selected.filter(v => v !== value) : [...selected, value]);
    } else {
      onChange([value]);
      setIsOpen(false);
    }
  };

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? options.find(o => o.value === selected[0])?.label || placeholder
        : `${selected.length} selected`;

  return (
    <div ref={containerRef} className="relative">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
        {icon}
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
          isOpen ? 'border-cyan-500 bg-slate-900' : 'border-slate-700/80 bg-slate-800/80 hover:border-slate-600'
        } ${selected.length > 0 ? 'text-cyan-200' : 'text-slate-300'}`}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-1.5 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            {options.map(option => {
              const isSelected = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleValue(option.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left transition ${
                    isSelected ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {option.icon && <span className="text-sm shrink-0">{option.icon}</span>}
                  <span className="flex-1 truncate">{option.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-cyan-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
