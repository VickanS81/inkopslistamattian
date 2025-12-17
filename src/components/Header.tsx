import { Sun, Moon, Monitor, RotateCcw, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

interface HeaderProps {
  checkedCount: number;
  onClearChecked: () => void;
  onReset: () => void;
  hasCheckedItems: boolean;
}

export function Header({ 
  checkedCount, 
  onClearChecked, 
  onReset,
  hasCheckedItems 
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border safe-area-inset-top">
      <div className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-secondary transition-colors touch-target"
            aria-label="Byt tema"
          >
            <ThemeIcon className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <button
            onClick={onReset}
            className="p-2 rounded-lg hover:bg-secondary transition-colors touch-target"
            aria-label="Återställ lista"
          >
            <RotateCcw className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
      
      {/* Clear checked button */}
      {hasCheckedItems && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border"
        >
          <button
            onClick={onClearChecked}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                       text-destructive hover:bg-destructive/10 transition-colors touch-target"
          >
            <Trash2 className="w-4 h-4" />
            <span className="font-medium text-sm">Rensa avbockade ({checkedCount})</span>
          </button>
        </motion.div>
      )}
    </header>
  );
}
