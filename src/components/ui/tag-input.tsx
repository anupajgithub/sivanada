import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Badge } from './badge';
import { Input } from './input';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({ tags, onChange, placeholder = 'Add tags...', className = '' }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        onChange([...tags, newTag]);
        setInputValue('');
      } else {
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-orange-200 rounded-xl bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 flex items-center gap-1 pr-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:bg-orange-300 rounded-full p-0.5"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-[120px] h-7"
        />
      </div>
      <p className="text-xs text-gray-500">Press Enter to add a tag, or click X to remove</p>
    </div>
  );
}

