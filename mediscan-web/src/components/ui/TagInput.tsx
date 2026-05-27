import React, { useState } from 'react';

interface TagInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: string; // Comma-separated string
  onChange: (value: string) => void;
}

export function TagInput({ id, label, placeholder, value, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  
  // Parse tags from the comma-separated string
  const tags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];

  const handleAdd = () => {
    const val = inputValue.trim();
    if (val && !tags.includes(val)) {
      const newTags = [...tags, val];
      onChange(newTags.join(', '));
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    onChange(newTags.join(', '));
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-on-surface" htmlFor={id}>
        {label}
      </label>
      
      <div className="flex flex-wrap gap-2 mb-1">
        {tags.map((tag, idx) => (
          <div key={idx} className="flex items-center gap-1 bg-surface-container-high px-3 py-1.5 rounded-full text-sm font-medium text-on-surface-variant group">
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => handleRemove(tag)}
              className="text-on-surface-variant hover:text-error transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="input-clinical flex-1 bg-surface-container-lowest"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary text-on-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
    </div>
  );
}
