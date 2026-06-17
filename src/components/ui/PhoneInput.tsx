import React, { useEffect, useState } from 'react';

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  value: string;
  onChange: (value: string) => void;
}

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+971', country: 'AE', flag: '🇦🇪' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
];

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  error,
  helperText,
  fullWidth = true,
  className = '',
  id,
  value,
  onChange,
  ...props
}) => {
  const inputId = id || `phone-input-${Math.random().toString(36).substr(2, 9)}`;

  // Parse initial value to separate country code and number
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (!value) {
      // If value is cleared from outside, reset phone number but keep selected country code
      setPhoneNumber('');
      return;
    }

    let foundCode = '+91';
    let foundNumber = value;

    // Sort by length descending to match longest code first (e.g., +971 before +9)
    const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    
    for (const c of sortedCodes) {
      if (value.startsWith(c.code)) {
        foundCode = c.code;
        foundNumber = value.slice(c.code.length);
        break;
      }
    }

    setCountryCode(foundCode);
    setPhoneNumber(foundNumber);
  }, [value]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    onChange(`${newCode}${phoneNumber}`);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const rawValue = e.target.value.replace(/\D/g, '');
    
    // Restrict to 10 digits
    const newValue = rawValue.slice(0, 10);
    
    setPhoneNumber(newValue);
    onChange(`${countryCode}${newValue}`);
  };

  // Base input styles
  const baseStyles = 'flex items-center rounded-2xl border-2 transition-smooth focus-within:ring-2 focus-within:ring-offset-2 overflow-hidden';
  
  // State styles
  const stateStyles = error
    ? 'border-red-300 focus-within:border-red-400 focus-within:ring-red-200 bg-red-50/50'
    : 'border-calm-sage/30 focus-within:border-calm-sage focus-within:ring-calm-sage/20 bg-white';

  // Width
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <div className={widthStyles}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-wellness-text mb-2"
        >
          {label}
        </label>
      )}
      
      <div className={`${baseStyles} ${stateStyles} ${className}`}>
        <div className="relative flex items-center bg-slate-50 border-r-2 border-inherit">
          <select
            className="h-full py-3 pl-3 pr-8 bg-transparent text-sm font-medium text-slate-700 focus:outline-none appearance-none cursor-pointer"
            value={countryCode}
            onChange={handleCodeChange}
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        <input
          id={inputId}
          type="tel"
          className="flex-1 px-4 py-3 bg-transparent focus:outline-none text-slate-800"
          value={phoneNumber}
          onChange={handleNumberChange}
          placeholder="10-digit mobile number"
          {...props}
        />
      </div>

      {helperText && !error && (
        <p className="mt-2 text-sm text-wellness-muted">{helperText}</p>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default PhoneInput;
