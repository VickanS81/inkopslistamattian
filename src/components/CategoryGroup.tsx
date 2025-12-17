import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, GripVertical } from 'lucide-react';
import { ShoppingItem as ShoppingItemType, CategoryType, getCategoryInfo } from '@/types/shopping';
import { ShoppingItem } from './ShoppingItem';
import { useDragState } from '@/contexts/DragContext';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface CategoryGroupProps {
  category: CategoryType;
  items: ShoppingItemType[];
  index: number;
  onToggleItem: (id: string) => void;
  onMoveItem: (itemId: string, newCategory: CategoryType) => void;
  onMoveCategory: (categoryId: CategoryType, toIndex: number) => void;
}

export function CategoryGroup({ category, items, index, onToggleItem, onMoveItem, onMoveCategory }: CategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const categoryInfo = getCategoryInfo(category);
  const { activeId, activeType, overCategoryId } = useDragState();
  
  const uncheckedCount = items.filter(i => !i.checked).length;
  const totalCount = items.length;
  const allChecked = totalCount > 0 && uncheckedCount === 0;

  // Droppable for receiving items
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `category:${category}`,
  });

  // Draggable for reordering categories
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `category:${category}`,
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : undefined,
  } : undefined;

  const isDragOver = isOver && activeType === 'item';
  const isBeingDragged = activeId === `category:${category}`;

  return (
    <motion.div 
      ref={setDroppableRef}
      style={style}
      className={`
        transition-all duration-200 relative
        ${isDragOver ? 'ring-2 ring-primary ring-inset bg-primary/5' : ''}
        ${isBeingDragged ? 'opacity-50 scale-[0.98]' : ''}
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      {/* Category header */}
      <div
        className={`
          w-full flex items-center gap-2 px-4 py-3 
          sticky top-0 z-10 backdrop-blur-sm
          transition-all duration-200
          ${isDragOver 
            ? 'bg-primary/20' 
            : 'bg-secondary/50'
          }
          ${allChecked ? 'opacity-60' : ''}
        `}
      >
        {/* Drag handle for category */}
        <div
          ref={setDraggableRef}
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 -ml-2 text-muted-foreground hover:text-foreground touch-manipulation"
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="w-5 h-5" />
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 flex items-center gap-3 touch-target"
        >
          <span className="text-2xl" role="img" aria-label={categoryInfo.name}>
            {categoryInfo.icon}
          </span>
          
          <span className={`
            flex-1 text-left font-semibold text-sm uppercase tracking-wide
            ${allChecked ? 'text-muted-foreground' : 'text-foreground'}
          `}>
            {categoryInfo.name}
          </span>
          
          {isDragOver && (
            <span className="text-xs font-medium text-primary bg-primary/20 px-2 py-1 rounded-full animate-pulse">
              Släpp här
            </span>
          )}
          
          <span className={`
            text-sm font-medium px-2 py-0.5 rounded-full
            ${allChecked 
              ? 'bg-primary/20 text-primary' 
              : 'bg-muted text-muted-foreground'
            }
          `}>
            {uncheckedCount}/{totalCount}
          </span>
          
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </button>
      </div>
      
      {/* Items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-border">
              {items.map((item, itemIndex) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: itemIndex * 0.03 }}
                  layout
                >
                  <ShoppingItem item={item} onToggle={onToggleItem} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
