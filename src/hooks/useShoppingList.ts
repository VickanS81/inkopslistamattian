import { useState, useEffect, useCallback } from 'react';
import { ShoppingItem, ShoppingList, CategoryType } from '@/types/shopping';

const STORAGE_KEY = 'handla-shopping-list';

const generateId = () => Math.random().toString(36).substring(2, 9);

// Demo data for first load
const createDemoList = (): ShoppingList => ({
  id: generateId(),
  name: 'Veckans inköp',
  createdAt: Date.now(),
  items: [
    { id: generateId(), name: 'Tomater', quantity: '500', unit: 'g', category: 'vegetables', checked: false },
    { id: generateId(), name: 'Gurka', quantity: '1', unit: 'st', category: 'vegetables', checked: false },
    { id: generateId(), name: 'Rödlök', quantity: '2', unit: 'st', category: 'vegetables', checked: false },
    { id: generateId(), name: 'Citron', quantity: '2', unit: 'st', category: 'vegetables', checked: false },
    { id: generateId(), name: 'Banan', quantity: '1', unit: 'kg', category: 'vegetables', checked: false },
    { id: generateId(), name: 'Äpple', quantity: '6', unit: 'st', category: 'vegetables', checked: false },
    { id: generateId(), name: 'Mjölk', quantity: '1', unit: 'l', category: 'dairy', checked: false },
    { id: generateId(), name: 'Smör', quantity: '500', unit: 'g', category: 'dairy', checked: false },
    { id: generateId(), name: 'Ägg', quantity: '12', unit: 'st', category: 'dairy', checked: false },
    { id: generateId(), name: 'Ost', quantity: '300', unit: 'g', category: 'dairy', checked: false },
    { id: generateId(), name: 'Kycklingfilé', quantity: '600', unit: 'g', category: 'meat', checked: false },
    { id: generateId(), name: 'Bacon', quantity: '200', unit: 'g', category: 'meat', checked: false },
    { id: generateId(), name: 'Laxfilé', quantity: '400', unit: 'g', category: 'fish', checked: false },
    { id: generateId(), name: 'Pasta', quantity: '500', unit: 'g', category: 'pantry', checked: false },
    { id: generateId(), name: 'Ris', quantity: '1', unit: 'kg', category: 'pantry', checked: false },
    { id: generateId(), name: 'Olivolja', quantity: '1', unit: 'flaska', category: 'pantry', checked: false },
    { id: generateId(), name: 'Krossade tomater', quantity: '2', unit: 'burk', category: 'pantry', checked: false },
    { id: generateId(), name: 'Salt', quantity: '1', unit: 'förp', category: 'spices', checked: false },
    { id: generateId(), name: 'Peppar', quantity: '1', unit: 'förp', category: 'spices', checked: false },
    { id: generateId(), name: 'Basilika', quantity: '1', unit: 'kruka', category: 'spices', checked: false },
    { id: generateId(), name: 'Frysta ärtor', quantity: '400', unit: 'g', category: 'frozen', checked: false },
    { id: generateId(), name: 'Levain', quantity: '1', unit: 'st', category: 'bakery', checked: false },
    { id: generateId(), name: 'Havre-havremjölk', quantity: '1', unit: 'l', category: 'drinks', checked: false },
  ],
});

export function useShoppingList() {
  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setList(JSON.parse(stored));
      } catch {
        setList(createDemoList());
      }
    } else {
      setList(createDemoList());
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage when list changes
  useEffect(() => {
    if (list) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  }, [list]);

  const toggleItem = useCallback((itemId: string) => {
    setList(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId
            ? { 
                ...item, 
                checked: !item.checked,
                checkedAt: !item.checked ? Date.now() : undefined
              }
            : item
        ),
      };
    });
  }, []);

  const clearChecked = useCallback(() => {
    setList(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter(item => !item.checked),
      };
    });
  }, []);

  const addItem = useCallback((name: string, category: CategoryType = 'other', quantity: string = '1', unit?: string) => {
    setList(prev => {
      if (!prev) return prev;
      const newItem: ShoppingItem = {
        id: generateId(),
        name,
        quantity,
        unit,
        category,
        checked: false,
      };
      return {
        ...prev,
        items: [...prev.items, newItem],
      };
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setList(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter(item => item.id !== itemId),
      };
    });
  }, []);

  const moveItemToCategory = useCallback((itemId: string, newCategory: CategoryType) => {
    setList(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId
            ? { ...item, category: newCategory }
            : item
        ),
      };
    });
  }, []);

  const importList = useCallback((newList: ShoppingList) => {
    setList(newList);
  }, []);

  const resetList = useCallback(() => {
    setList(createDemoList());
  }, []);

  // Group items by category and sort (unchecked first, then checked)
  const groupedItems = list?.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<CategoryType, ShoppingItem[]>) || {};

  // Sort within each category
  Object.keys(groupedItems).forEach(category => {
    groupedItems[category as CategoryType].sort((a, b) => {
      if (a.checked === b.checked) {
        return a.name.localeCompare(b.name, 'sv');
      }
      return a.checked ? 1 : -1;
    });
  });

  const checkedCount = list?.items.filter(i => i.checked).length || 0;
  const totalCount = list?.items.length || 0;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  return {
    list,
    groupedItems,
    isLoading,
    toggleItem,
    clearChecked,
    addItem,
    removeItem,
    moveItemToCategory,
    importList,
    resetList,
    checkedCount,
    totalCount,
    progress,
  };
}
