import { CategoryType } from '@/types/shopping';
import { CategoryGroup } from './CategoryGroup';
import { Header } from './Header';
import { EmptyState } from './EmptyState';
import { AddItemInput } from './AddItemInput';
import { ShareDialog } from './ShareDialog';
import { SettingsDialog } from './SettingsDialog';
import { useShoppingListDB } from '@/hooks/useShoppingListDB';
import { useSettings, AppSettings } from '@/hooks/useSettings';
import { DragProvider, useDragState } from '@/contexts/DragContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { categorizeItem } from '@/utils/categorizeItem';

interface CategoryListProps {
  categoryOrder: CategoryType[];
  groupedItems: Record<CategoryType, any[]>;
  settings: AppSettings;
  onToggleItem: (id: string) => void;
  onMoveItem: (itemId: string, newCategory: CategoryType) => void;
  onMoveCategory: (categoryId: CategoryType, toIndex: number) => void;
}

function CategoryList({ 
  categoryOrder, 
  groupedItems, 
  settings, 
  onToggleItem, 
  onMoveItem, 
  onMoveCategory 
}: CategoryListProps) {
  const { isDragging } = useDragState();

  // Filter categories based on settings
  const getVisibleCategories = () => {
    if (!settings.showOnlyCategoriesWithItems || isDragging) {
      // Show all categories when setting is off or when dragging
      return categoryOrder;
    }
    
    // Show only categories with items + always show 'other'
    return categoryOrder.filter((catId) => {
      if (catId === 'other') return true;
      return (groupedItems[catId as CategoryType]?.length ?? 0) > 0;
    });
  };

  const visibleCategories = getVisibleCategories();

  return (
    <div className="divide-y divide-border">
      {visibleCategories.map((categoryId, index) => (
        <CategoryGroup
          key={categoryId}
          category={categoryId as CategoryType}
          items={groupedItems[categoryId as CategoryType] || []}
          index={index}
          onToggleItem={onToggleItem}
          onMoveItem={onMoveItem}
          onMoveCategory={onMoveCategory}
        />
      ))}
    </div>
  );
}

export function ShoppingListDB() {
  const {
    currentList,
    groupedItems,
    categoryOrder,
    isLoading,
    addItem,
    toggleItem,
    moveItemToCategory,
    clearChecked,
    moveCategoryById,
    checkedCount,
    totalCount,
    progress,
    members,
  } = useShoppingListDB();

  const { signOut } = useAuth();
  const { settings, updateSettings } = useSettings();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  const hasItems = totalCount > 0;
  const allComplete = hasItems && checkedCount === totalCount;

  const handleAddItem = (name: string) => {
    const category = settings.autoCategorize ? categorizeItem(name) : 'other';
    addItem(name, category, '1', 'st');
  };

  const handleMoveCategory = (categoryId: CategoryType, toIndex: number) => {
    moveCategoryById(categoryId, toIndex);
  };

  const handleToggleItem = (itemId: string) => {
    toggleItem(itemId, settings.autoClearChecked);
  };

  const handleReset = () => {
    clearChecked();
  };

  return (
    <DragProvider 
      onMoveItem={moveItemToCategory}
      onMoveCategory={handleMoveCategory}
      categoryOrder={categoryOrder}
    >
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-secondary/30 border-b border-border">
          <div className="flex items-center gap-2">
            {currentList && (
              <ShareDialog shareCode={currentList.share_code} members={members} />
            )}
            <SettingsDialog settings={settings} onUpdateSettings={updateSettings} />
            <span className="text-sm text-muted-foreground">
              {currentList?.name}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logga ut
          </Button>
        </div>

        <Header
          progress={progress}
          checkedCount={checkedCount}
          totalCount={totalCount}
          onClearChecked={clearChecked}
          onReset={handleReset}
          hasCheckedItems={checkedCount > 0}
        />

        <AddItemInput onAddItem={handleAddItem} />

        <main className="flex-1 pb-safe-bottom">
          {allComplete && hasItems ? (
            <EmptyState type="complete" onReset={handleReset} />
          ) : (
            <CategoryList
              categoryOrder={categoryOrder}
              groupedItems={groupedItems}
              settings={settings}
              onToggleItem={handleToggleItem}
              onMoveItem={moveItemToCategory}
              onMoveCategory={handleMoveCategory}
            />
          )}
        </main>

        <footer className="px-4 py-3 bg-secondary/30 border-t border-border text-center safe-area-inset-bottom">
          <p className="text-xs text-muted-foreground">
            💡 Dra kategorier eller varor för att sortera efter din butik
          </p>
        </footer>
      </div>
    </DragProvider>
  );
}
