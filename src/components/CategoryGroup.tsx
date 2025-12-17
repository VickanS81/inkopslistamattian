import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, GripVertical } from 'lucide-react';
import { ShoppingItem as ShoppingItemType, CategoryType, getCategoryInfo } from '@/types/shopping';
import { ShoppingItem } from './ShoppingItem';
import { useDragContext } from '@/contexts/DragContext';

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
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCategoryDragOver, setIsCategoryDragOver] = useState<'above' | 'below' | null>(null);
  const categoryInfo = getCategoryInfo(category);
  const { 
    draggedItemId, 
    setDropTargetCategory,
    draggedCategoryId,
    setDraggedCategoryId,
    setDropTargetIndex,
  } = useDragContext();
  
  const uncheckedCount = items.filter(i => !i.checked).length;
  const totalCount = items.length;
  const allChecked = totalCount > 0 && uncheckedCount === 0;
  const isDraggingThis = draggedCategoryId === category;

  // Item drag handlers
  const handleItemDragOver = (e: React.DragEvent) => {
    const types = e.dataTransfer.types;
    if (types.includes('itemid')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
      setDropTargetCategory(category);
    }
  };

  const handleItemDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDropTargetCategory(null);
    }
  };

  const handleItemDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    if (itemId) {
      onMoveItem(itemId, category);
    }
    setIsDragOver(false);
    setDropTargetCategory(null);
  };

  // Category drag handlers
  const handleCategoryDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('categoryId', category);
    e.dataTransfer.setData('categoryIndex', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggedCategoryId(category);
  };

  const handleCategoryDragEnd = () => {
    setDraggedCategoryId(null);
    setDropTargetIndex(null);
    setIsCategoryDragOver(null);
  };

  const handleCategoryDragOver = (e: React.DragEvent) => {
    const types = e.dataTransfer.types;
    if (types.includes('categoryid') && draggedCategoryId && draggedCategoryId !== category) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      // Determine if dropping above or below
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position = e.clientY < midY ? 'above' : 'below';
      setIsCategoryDragOver(position);
      setDropTargetIndex(position === 'above' ? index : index + 1);
    }
  };

  const handleCategoryDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsCategoryDragOver(null);
      setDropTargetIndex(null);
    }
  };

  const handleCategoryDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('categoryId') as CategoryType;
    if (draggedId && draggedId !== category) {
      const targetIndex = isCategoryDragOver === 'above' ? index : index + 1;
      onMoveCategory(draggedId, targetIndex);
    }
    setIsCategoryDragOver(null);
    setDropTargetIndex(null);
  };

  return (
    <motion.div 
      className={`
        transition-all duration-200 relative
        ${isDragOver ? 'ring-2 ring-primary ring-inset' : ''}
        ${isDraggingThis ? 'opacity-50' : ''}
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onDragOver={(e) => {
        handleItemDragOver(e);
        handleCategoryDragOver(e);
      }}
      onDragLeave={(e) => {
        handleItemDragLeave(e);
        handleCategoryDragLeave(e);
      }}
      onDrop={(e) => {
        handleItemDrop(e);
        handleCategoryDrop(e);
      }}
      layout
    >
      {/* Drop indicator above */}
      {isCategoryDragOver === 'above' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-full z-20 -translate-y-0.5" />
      )}
      
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
          draggable
          onDragStart={handleCategoryDragStart}
          onDragEnd={handleCategoryDragEnd}
          className="cursor-grab active:cursor-grabbing p-1 -ml-2 text-muted-foreground hover:text-foreground touch-none"
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
      
      {/* Drop indicator below */}
      {isCategoryDragOver === 'below' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full z-20 translate-y-0.5" />
      )}
    </motion.div>
  );
}
