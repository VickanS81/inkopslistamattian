import { useState, useEffect, useCallback } from 'react';
import { CategoryType, CATEGORIES } from '@/types/shopping';

const STORAGE_KEY = 'handla-category-order';

// Get default order from CATEGORIES
const getDefaultOrder = (): CategoryType[] => CATEGORIES.map(c => c.id);

export function useCategoryOrder() {
  const [categoryOrder, setCategoryOrder] = useState<CategoryType[]>(getDefaultOrder);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CategoryType[];
        // Validate and ensure all categories are present
        const validOrder = parsed.filter(id => CATEGORIES.some(c => c.id === id));
        const missingCategories = CATEGORIES
          .map(c => c.id)
          .filter(id => !validOrder.includes(id));
        setCategoryOrder([...validOrder, ...missingCategories]);
      } catch {
        setCategoryOrder(getDefaultOrder());
      }
    }
  }, []);

  // Save to localStorage when order changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categoryOrder));
  }, [categoryOrder]);

  const moveCategory = useCallback((fromIndex: number, toIndex: number) => {
    setCategoryOrder(prev => {
      const newOrder = [...prev];
      const [removed] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, removed);
      return newOrder;
    });
  }, []);

  const moveCategoryById = useCallback((categoryId: CategoryType, toIndex: number) => {
    setCategoryOrder(prev => {
      const fromIndex = prev.indexOf(categoryId);
      if (fromIndex === -1) return prev;
      const newOrder = [...prev];
      const [removed] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, removed);
      return newOrder;
    });
  }, []);

  const resetOrder = useCallback(() => {
    setCategoryOrder(getDefaultOrder());
  }, []);

  return {
    categoryOrder,
    moveCategory,
    moveCategoryById,
    resetOrder,
  };
}
