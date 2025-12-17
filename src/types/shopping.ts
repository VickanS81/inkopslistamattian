export type CategoryType = 
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

export const getCategoryInfo = (categoryId: CategoryType): CategoryInfo => {
  return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
};
