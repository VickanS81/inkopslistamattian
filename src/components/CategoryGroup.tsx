import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ShoppingItem as ShoppingItemType, CategoryType, getCategoryInfo } from '@/types/shopping';
import { ShoppingItem } from './ShoppingItem';
import { useDragContext } from '@/contexts/DragContext';

interface CategoryGroupProps {
  category: CategoryType;
  items: ShoppingItemType[];
  onToggleItem: (id: string) => void;
  onMoveItem: (itemId: string, newCategory: CategoryType) => void;
}

export function CategoryGroup({ category, items, onToggleItem, onMoveItem }: CategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const categoryInfo = getCategoryInfo(category);
  const { draggedItemId, setDropTargetCategory } = useDragContext();
  
  const uncheckedCount = items.filter(i => !i.checked).length;
  const totalCount = items.length;
  const allChecked = totalCount > 0 && uncheckedCount === 0;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
    setDropTargetCategory(category);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set to false if we're leaving the category entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDropTargetCategory(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    if (itemId) {
      onMoveItem(itemId, category);
    }
    setIsDragOver(false);
    setDropTargetCategory(null);
  };

  return (
    <motion.div 
      className={`transition-all duration-200 ${isDragOver ? 'ring-2 ring-primary ring-inset' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Category header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full flex items-center gap-3 px-4 py-3 
          sticky top-0 z-10 backdrop-blur-sm touch-target
          transition-all duration-200
          ${isDragOver 
            ? 'bg-primary/20' 
            : 'bg-secondary/50'
          }
          ${allChecked ? 'opacity-60' : ''}
        `}
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
        
        {isDragOver && draggedItemId && (
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
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
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
