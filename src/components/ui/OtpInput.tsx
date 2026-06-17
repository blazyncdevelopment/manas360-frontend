import React, { useRef, KeyboardEvent } from 'react';

export interface OtpInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length,
  value,
  onChange,
  label,
  error,
  helperText,
  disabled
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val && e.target.value !== '') return; // Allow empty, block non-digits

    const char = val.slice(-1);
    const newValue = value.split('');
    // Fill up to the current index with empty strings if necessary
    while (newValue.length < length) newValue.push('');
    newValue[index] = char;
    
    const stringValue = newValue.join('');
    onChange(stringValue.slice(0, length));

    // Move to next input
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newValue = value.split('');
      while (newValue.length < length) newValue.push('');
      
      if (newValue[index]) {
        // If there's a character at current index, delete it
        newValue[index] = '';
        onChange(newValue.join(''));
      } else if (index > 0) {
        // If empty, delete previous and move focus back
        newValue[index - 1] = '';
        onChange(newValue.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const baseStyles = 'w-12 h-14 text-center text-xl font-semibold rounded-xl border-2 transition-smooth focus:outline-none focus:ring-2 focus:ring-offset-2';
  const stateStyles = error
    ? 'border-red-300 focus:border-red-400 focus:ring-red-200 bg-red-50/50 text-red-900'
    : 'border-calm-sage/30 focus:border-calm-sage focus:ring-calm-sage/20 bg-white text-slate-800';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-wellness-text mb-2">
          {label}
        </label>
      )}
      
      <div className="flex gap-2 sm:gap-3 justify-center">
        {Array.from({ length }, (_, index) => {
          const char = value[index] || '';
          return (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={char}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              disabled={disabled}
              autoComplete="one-time-code"
              className={`${baseStyles} ${stateStyles} ${
                disabled ? 'bg-slate-100 cursor-not-allowed opacity-50' : ''
              }`}
            />
          );
        })}
      </div>

      {helperText && !error && (
        <p className="mt-2 text-sm text-center sm:text-left text-wellness-muted">{helperText}</p>
      )}

      {error && (
        <p className="mt-2 text-sm text-center sm:text-left text-red-600 flex items-center justify-center sm:justify-start gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default OtpInput;
