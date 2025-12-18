// Default category types (built-in)
export type DefaultCategoryType = 
  | 'vegetables'
  | 'dairy'
  | 'meat'
  | 'fish'
  | 'pantry'
  | 'spices'
  | 'frozen'
  | 'bakery'
  | 'drinks'
  | 'other';

// CategoryType now supports custom categories as strings
export type CategoryType = DefaultCategoryType | string;

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  unit?: string;
  category: CategoryType;
  checked: boolean;
  checkedAt?: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: number;
  items: ShoppingItem[];
}

export interface CategoryInfo {
  id: CategoryType;
  name: string;
  icon: string;
  isCustom?: boolean;
}

// Order matters - "other" first so new items appear at top
export const CATEGORIES: CategoryInfo[] = [
  { id: 'other', name: 'Övrigt', icon: '📦' },
  { id: 'vegetables', name: 'Frukt & Grönsaker', icon: '🥬' },
  { id: 'dairy', name: 'Mejeri', icon: '🥛' },
  { id: 'meat', name: 'Kött', icon: '🥩' },
  { id: 'fish', name: 'Fisk & Skaldjur', icon: '🐟' },
  { id: 'pantry', name: 'Skafferi', icon: '🫙' },
  { id: 'spices', name: 'Kryddor', icon: '🧂' },
  { id: 'frozen', name: 'Fryst', icon: '❄️' },
  { id: 'bakery', name: 'Bröd & Bageri', icon: '🥖' },
  { id: 'drinks', name: 'Drycker', icon: '🥤' },
];

export const DEFAULT_CATEGORY_IDS = CATEGORIES.map(c => c.id);

export const getCategoryInfo = (categoryId: CategoryType, customCategories: CategoryInfo[] = []): CategoryInfo => {
  // First check custom categories
  const customCat = customCategories.find(c => c.id === categoryId);
  if (customCat) return customCat;
  
  // Then check default categories
  return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
};
