import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Check, GripVertical, ThumbsUp, ThumbsDown } from 'lucide-react';
import { ShoppingItem as ShoppingItemType, CategoryType } from '@/types/shopping';
import { useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export interface SpellSuggestion {
  correctedWord: string;
  category: CategoryType;
}

interface ShoppingItemProps {
  item: ShoppingItemType;
  onToggle: (id: string) => void;
  spellSuggestion?: SpellSuggestion | null;
  onAcceptSuggestion?: (itemId: string, correctedWord: string, category: CategoryType) => void;
  onRejectSuggestion?: (itemId: string) => void;
}

export function ShoppingItem({ 
  item, 
  onToggle, 
  spellSuggestion,
  onAcceptSuggestion,
  onRejectSuggestion 
}: ShoppingItemProps) {
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Draggable for moving between categories
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `item:${item.id}`,
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : undefined,
  } : undefined;
  
  // Transform for the check indicator background
  const checkBgOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const uncheckBgOpacity = useTransform(x, [0, 50, 100], [0, 0.5, 1]);
  
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 80;
    
    if (Math.abs(info.offset.x) > threshold) {
      onToggle(item.id);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden ${isDragging ? 'opacity-50' : ''}`}
      style={style}
    >
      {/* Swipe indicators */}
      <motion.div 
        className="absolute inset-y-0 left-0 w-20 flex items-center justify-center bg-primary"
        style={{ opacity: item.checked ? uncheckBgOpacity : checkBgOpacity }}
      >
        <Check className="w-6 h-6 text-primary-foreground" />
      </motion.div>
      <motion.div 
        className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-muted"
        style={{ opacity: item.checked ? checkBgOpacity : uncheckBgOpacity }}
      >
        <span className="text-muted-foreground text-sm">Ångra</span>
      </motion.div>
      
      {/* Main item content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={`
          relative flex flex-col bg-card
          transition-colors duration-200
          ${item.checked ? 'bg-checked-bg' : ''}
        `}
      >
        <div className="flex items-center gap-2 px-4 py-3 touch-target">
          {/* Drag handle for moving between categories */}
          <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className="flex-shrink-0 p-2 -ml-2 cursor-grab active:cursor-grabbing touch-manipulation"
            style={{ touchAction: 'none' }}
          >
            <GripVertical className="w-5 h-5 text-muted-foreground/50" />
          </div>

          {/* Checkbox */}
          <button
            onClick={() => onToggle(item.id)}
            className={`
              flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
              transition-all duration-200
              ${item.checked 
                ? 'bg-primary border-primary' 
                : 'border-border hover:border-primary/50'
              }
            `}
            aria-label={item.checked ? 'Markera som ej klar' : 'Markera som klar'}
          >
            {item.checked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="animate-check-bounce"
              >
                <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
              </motion.div>
            )}
          </button>
          
          {/* Item details */}
          <div className="flex-1 min-w-0">
            <p className={`
              text-base font-medium truncate transition-all duration-200
              ${item.checked ? 'text-checked-text line-through' : 'text-foreground'}
            `}>
              {item.name}
            </p>
          </div>
          
          {/* Quantity */}
          <div className={`
            flex-shrink-0 text-sm font-medium px-2 py-1 rounded-md
            ${item.checked 
              ? 'text-checked-text bg-transparent' 
              : 'text-muted-foreground bg-secondary'
            }
          `}>
            {item.quantity}{item.unit ? ` ${item.unit}` : ''}
          </div>
        </div>

        {/* Spell suggestion */}
        {spellSuggestion && !item.checked && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border-t border-border"
          >
            <span className="text-sm text-muted-foreground flex-1">
              Menade du <span className="font-semibold text-foreground">{spellSuggestion.correctedWord}</span>?
            </span>
            <button
              onClick={() => onAcceptSuggestion?.(item.id, spellSuggestion.correctedWord, spellSuggestion.category)}
              className="p-2 rounded-full bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
              aria-label="Acceptera rättstavning"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => onRejectSuggestion?.(item.id)}
              className="p-2 rounded-full bg-destructive/20 hover:bg-destructive/30 text-destructive transition-colors"
              aria-label="Behåll original"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
