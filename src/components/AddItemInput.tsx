import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';

interface AddItemInputProps {
  onAddItem: (name: string) => void;
}

export function AddItemInput({ onAddItem }: AddItemInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onAddItem(trimmed);
      setValue('');
      inputRef.current?.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 bg-card border-b border-border">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Lägg till vara..."
            className="w-full h-12 pl-4 pr-12 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground
                       focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200
                       text-base font-medium"
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center
                       bg-primary text-primary-foreground rounded-lg
                       disabled:opacity-40 disabled:cursor-not-allowed
                       hover:bg-primary/90 active:scale-95 transition-all duration-200"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Nya varor läggs i "Övrigt" – dra dem till rätt kategori
      </p>
    </form>
  );
}
