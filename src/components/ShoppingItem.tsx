import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Check, GripVertical } from 'lucide-react';
import { ShoppingItem as ShoppingItemType } from '@/types/shopping';
import { useRef } from 'react';
import { useDragContext } from '@/contexts/DragContext';

interface ShoppingItemProps {
  item: ShoppingItemType;
  onToggle: (id: string) => void;
}

export function ShoppingItem({ item, onToggle }: ShoppingItemProps) {
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setDraggedItemId } = useDragContext();
  
  // Transform for the check indicator background
  const checkBgOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const uncheckBgOpacity = useTransform(x, [0, 50, 100], [0, 0.5, 1]);
  
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 80;
    
    if (Math.abs(info.offset.x) > threshold) {
      onToggle(item.id);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('itemId', item.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItemId(item.id);
    
    // Create a custom drag image
    const dragImage = document.createElement('div');
    dragImage.textContent = item.name;
    dragImage.className = 'px-3 py-2 bg-card rounded-lg shadow-lg text-sm font-medium';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEndNative = () => {
    setDraggedItemId(null);
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden">
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
          relative flex items-center gap-2 px-4 py-3 bg-card
          transition-colors duration-200 touch-target
          ${item.checked ? 'bg-checked-bg' : ''}
        `}
      >
        {/* Drag handle */}
        <div
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEndNative}
          className="flex-shrink-0 p-1 -ml-2 cursor-grab active:cursor-grabbing touch-none"
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
      </motion.div>
    </div>
  );
}
