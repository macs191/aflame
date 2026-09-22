import React from 'react';

interface FieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'url' | 'number';
  required?: boolean;
  ltr?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  ltr = false,
  min,
  max,
  step,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
    <input
      type={type}
      required={required}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-dark-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 ${
        ltr ? 'dir-ltr text-right' : ''
      }`}
    />
  </div>
);

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 3,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
    <textarea
      required={required}
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-dark-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500"
    />
  </div>
);

export const StatusMessage: React.FC<{ message: string | null }> = ({ message }) => {
  if (!message) return null;
  const isSuccess = message.includes('نجاح') || message.includes('تم');
  return (
    <div
      className={`p-4 rounded-xl mb-6 text-sm font-semibold ${
        isSuccess
          ? 'bg-green-500/10 text-green-400 border border-green-500/30'
          : 'bg-red-500/10 text-red-400 border border-red-500/30'
      }`}
    >
      {message}
    </div>
  );
};

export const SubmitButton: React.FC<{ loading: boolean; label: string }> = ({ loading, label }) => (
  <button
    type="submit"
    disabled={loading}
    className="w-full py-3.5 bg-gradient-to-r from-gold-600 to-gold-500 text-dark-900 font-extrabold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-gold-500/10 disabled:opacity-60"
  >
    {loading ? 'جاري الحفظ...' : label}
  </button>
);
