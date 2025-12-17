import { Sun, Moon, Monitor, RotateCcw, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

interface HeaderProps {
  progress: number;
  checkedCount: number;
  totalCount: number;
  onClearChecked: () => void;
  onReset: () => void;
  hasCheckedItems: boolean;
}

export function Header({ 
  progress, 
  checkedCount, 
  totalCount, 
  onClearChecked, 
  onReset,
  hasCheckedItems 
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border safe-area-inset-top">
      <div className="px-4 py-3">
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            <h1 className="text-xl font-bold text-foreground">Handla</h1>
          </div>
          
          <div className="flex items-center gap-1">
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
        
        {/* Progress section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {checkedCount} av {totalCount} varor
            </span>
            <span className="font-semibold text-primary">
              {Math.round(progress)}%
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
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
