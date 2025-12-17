import { createContext, useContext, useState, ReactNode } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import { CategoryType } from '@/types/shopping';

interface DragContextType {
  activeId: string | null;
  activeType: 'item' | 'category' | null;
  overCategoryId: CategoryType | null;
  isDragging: boolean;
}

const DragStateContext = createContext<DragContextType>({
  activeId: null,
  activeType: null,
  overCategoryId: null,
  isDragging: false,
});

interface DragProviderProps {
  children: ReactNode;
  onMoveItem?: (itemId: string, newCategory: CategoryType) => void;
  onMoveCategory?: (categoryId: CategoryType, toIndex: number) => void;
  categoryOrder?: CategoryType[];
}

export function DragProvider({ 
  children, 
  onMoveItem, 
  onMoveCategory,
  categoryOrder = [],
}: DragProviderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'item' | 'category' | null>(null);
  const [overCategoryId, setOverCategoryId] = useState<CategoryType | null>(null);

  // Configure sensors to only activate on drag handles
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 10, // 10px movement required before drag starts
    },
  });
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250, // 250ms hold before drag starts
      tolerance: 8, // 8px movement tolerance during delay
    },
  });

  const sensors = useSensors(pointerSensor, touchSensor);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const idParts = String(active.id).split(':');
    const type = idParts[0] as 'item' | 'category';
    
    setActiveId(String(active.id));
    setActiveType(type);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    
    if (over && activeType === 'item') {
      const overIdParts = String(over.id).split(':');
      if (overIdParts[0] === 'category') {
        setOverCategoryId(overIdParts[1] as CategoryType);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setActiveType(null);
      setOverCategoryId(null);
      return;
    }

    const activeIdParts = String(active.id).split(':');
    const overIdParts = String(over.id).split(':');
    
    if (activeIdParts[0] === 'item' && overIdParts[0] === 'category') {
      // Item dropped on category
      const itemId = activeIdParts[1];
      const newCategory = overIdParts[1] as CategoryType;
      onMoveItem?.(itemId, newCategory);
    } else if (activeIdParts[0] === 'category' && overIdParts[0] === 'category') {
      // Category dropped on category (reorder)
      const draggedCategory = activeIdParts[1] as CategoryType;
      const targetCategory = overIdParts[1] as CategoryType;
      
      if (draggedCategory !== targetCategory) {
        const targetIndex = categoryOrder.indexOf(targetCategory);
        onMoveCategory?.(draggedCategory, targetIndex);
      }
    }

    setActiveId(null);
    setActiveType(null);
    setOverCategoryId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveType(null);
    setOverCategoryId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <DragStateContext.Provider value={{ activeId, activeType, overCategoryId, isDragging: activeId !== null }}>
        {children}
      </DragStateContext.Provider>
    </DndContext>
  );
}

export function useDragState() {
  return useContext(DragStateContext);
}
