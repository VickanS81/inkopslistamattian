import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CategoryType } from '@/types/shopping';

interface DragContextType {
  draggedItemId: string | null;
  setDraggedItemId: (id: string | null) => void;
  dropTargetCategory: CategoryType | null;
  setDropTargetCategory: (category: CategoryType | null) => void;
}

const DragContext = createContext<DragContextType | null>(null);

export function DragProvider({ children }: { children: ReactNode }) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dropTargetCategory, setDropTargetCategory] = useState<CategoryType | null>(null);

  return (
    <DragContext.Provider value={{ 
      draggedItemId, 
      setDraggedItemId, 
      dropTargetCategory, 
      setDropTargetCategory 
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
