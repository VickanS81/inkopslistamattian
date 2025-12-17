import { createContext, useContext, useState, ReactNode } from 'react';
import { CategoryType } from '@/types/shopping';

interface DragContextType {
  // Item dragging
  draggedItemId: string | null;
  setDraggedItemId: (id: string | null) => void;
  dropTargetCategory: CategoryType | null;
  setDropTargetCategory: (category: CategoryType | null) => void;
  // Category dragging
  draggedCategoryId: CategoryType | null;
  setDraggedCategoryId: (id: CategoryType | null) => void;
  dropTargetIndex: number | null;
  setDropTargetIndex: (index: number | null) => void;
}

const DragContext = createContext<DragContextType | null>(null);

export function DragProvider({ children }: { children: ReactNode }) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dropTargetCategory, setDropTargetCategory] = useState<CategoryType | null>(null);
  const [draggedCategoryId, setDraggedCategoryId] = useState<CategoryType | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  return (
    <DragContext.Provider value={{ 
      draggedItemId, 
      setDraggedItemId, 
      dropTargetCategory, 
      setDropTargetCategory,
      draggedCategoryId,
      setDraggedCategoryId,
      dropTargetIndex,
      setDropTargetIndex,
    }}>
      {children}
    </DragContext.Provider>
  );
}

export function useDragContext() {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error('useDragContext must be used within DragProvider');
  }
  return context;
}
