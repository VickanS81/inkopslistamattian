import { CATEGORIES, CategoryType } from '@/types/shopping';
import { CategoryGroup } from './CategoryGroup';
import { Header } from './Header';
import { EmptyState } from './EmptyState';
import { useShoppingList } from '@/hooks/useShoppingList';

export function ShoppingList() {
  const {
    list,
    groupedItems,
    isLoading,
    toggleItem,
    clearChecked,
    resetList,
    checkedCount,
    totalCount,
    progress,
  } = useShoppingList();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  const hasItems = totalCount > 0;
  const allComplete = hasItems && checkedCount === totalCount;

  // Get categories in the defined order, but only those with items
  const orderedCategories = CATEGORIES
    .map(c => c.id)
    .filter(catId => groupedItems[catId]?.length > 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        progress={progress}
        checkedCount={checkedCount}
        totalCount={totalCount}
        onClearChecked={clearChecked}
        onReset={resetList}
        hasCheckedItems={checkedCount > 0}
      />

      <main className="flex-1 pb-safe-bottom">
        {!hasItems ? (
          <EmptyState type="empty" onReset={resetList} />
        ) : allComplete ? (
          <EmptyState type="complete" onReset={resetList} />
        ) : (
          <div className="divide-y divide-border">
            {orderedCategories.map(categoryId => (
              <CategoryGroup
                key={categoryId}
                category={categoryId as CategoryType}
                items={groupedItems[categoryId as CategoryType]}
                onToggleItem={toggleItem}
              />
            ))}
          </div>
        )}
      </main>

      {/* Install prompt hint */}
      <footer className="px-4 py-3 bg-secondary/30 border-t border-border text-center safe-area-inset-bottom">
        <p className="text-xs text-muted-foreground">
          💡 Tips: Installera appen via webbläsarens meny för bästa upplevelse
        </p>
      </footer>
    </div>
  );
}
