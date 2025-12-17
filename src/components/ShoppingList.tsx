import { CategoryType } from '@/types/shopping';
import { CategoryGroup } from './CategoryGroup';
import { Header } from './Header';
import { EmptyState } from './EmptyState';
import { AddItemInput } from './AddItemInput';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useCategoryOrder } from '@/hooks/useCategoryOrder';
import { DragProvider } from '@/contexts/DragContext';

export function ShoppingList() {
  const {
    list,
    groupedItems,
    isLoading,
    toggleItem,
    clearChecked,
    addItem,
    moveItemToCategory,
    resetList,
    checkedCount,
    totalCount,
    progress,
  } = useShoppingList();

  const { categoryOrder, moveCategoryById } = useCategoryOrder();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  const hasItems = totalCount > 0;
  const allComplete = hasItems && checkedCount === totalCount;

  // Get categories in the user's custom order, but only those with items
  // Always show "other" if there are ANY items (as drop target)
  const orderedCategories = categoryOrder.filter(catId => {
    if (catId === 'other') {
      return hasItems || (groupedItems[catId]?.length ?? 0) > 0;
    }
    return (groupedItems[catId]?.length ?? 0) > 0;
  });

  const handleAddItem = (name: string) => {
    addItem(name, 'other', '1', 'st');
  };

  const handleMoveCategory = (categoryId: CategoryType, toIndex: number) => {
    // Find the actual index in the full categoryOrder
    const visibleCategories = orderedCategories;
    const targetCategory = visibleCategories[toIndex] || visibleCategories[visibleCategories.length - 1];
    const targetIndex = categoryOrder.indexOf(targetCategory);
    moveCategoryById(categoryId, targetIndex);
  };

  return (
    <DragProvider
      onMoveItem={moveItemToCategory}
      onMoveCategory={handleMoveCategory}
      categoryOrder={categoryOrder}
    >
      <div className="min-h-screen bg-background flex flex-col">
        <Header
          checkedCount={checkedCount}
          onClearChecked={clearChecked}
          onReset={resetList}
          hasCheckedItems={checkedCount > 0}
        />

        <AddItemInput onAddItem={handleAddItem} />

        <main className="flex-1 pb-safe-bottom">
          {!hasItems ? (
            <EmptyState type="empty" onReset={resetList} />
          ) : allComplete ? (
            <EmptyState type="complete" onReset={resetList} />
          ) : (
            <div className="divide-y divide-border">
              {orderedCategories.map((categoryId, index) => (
                <CategoryGroup
                  key={categoryId}
                  category={categoryId as CategoryType}
                  items={groupedItems[categoryId as CategoryType] || []}
                  index={index}
                  onToggleItem={toggleItem}
                  onMoveItem={moveItemToCategory}
                  onMoveCategory={handleMoveCategory}
                />
              ))}
            </div>
          )}
        </main>

        {/* Install prompt hint */}
        <footer className="px-4 py-3 bg-secondary/30 border-t border-border text-center safe-area-inset-bottom">
          <p className="text-xs text-muted-foreground">
            💡 Dra kategorier eller varor för att sortera efter din butik
          </p>
        </footer>
      </div>
    </DragProvider>
  );
}
