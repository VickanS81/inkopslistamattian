import { CategoryType } from '@/types/shopping';
import { CategoryGroup } from './CategoryGroup';
import { Header } from './Header';
import { EmptyState } from './EmptyState';
import { AddItemInput } from './AddItemInput';
import { ShareDialog } from './ShareDialog';
import { useShoppingListDB } from '@/hooks/useShoppingListDB';
import { DragProvider } from '@/contexts/DragContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

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

  const { signOut, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  const hasItems = totalCount > 0;
  const allComplete = hasItems && checkedCount === totalCount;

  // Get categories in user's custom order, but only those with items
  const orderedCategories = categoryOrder.filter((catId) => {
    if (catId === 'other') {
      return hasItems || (groupedItems[catId]?.length ?? 0) > 0;
    }
    return (groupedItems[catId]?.length ?? 0) > 0;
  });

  const handleAddItem = (name: string) => {
    addItem(name, 'other', '1', 'st');
  };

  const handleMoveCategory = (categoryId: CategoryType, toIndex: number) => {
    const visibleCategories = orderedCategories;
    const targetCategory = visibleCategories[toIndex] || visibleCategories[visibleCategories.length - 1];
    const targetIndex = categoryOrder.indexOf(targetCategory);
    moveCategoryById(categoryId, targetIndex);
  };

  const handleReset = () => {
    // In DB version, reset clears all items
    clearChecked();
  };

  return (
    <DragProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-secondary/30 border-b border-border">
          <div className="flex items-center gap-2">
            {currentList && (
              <ShareDialog shareCode={currentList.share_code} members={members} />
            )}
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
          {!hasItems ? (
            <EmptyState type="empty" onReset={handleReset} />
          ) : allComplete ? (
            <EmptyState type="complete" onReset={handleReset} />
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

        <footer className="px-4 py-3 bg-secondary/30 border-t border-border text-center safe-area-inset-bottom">
          <p className="text-xs text-muted-foreground">
            💡 Dra kategorier eller varor för att sortera efter din butik
          </p>
        </footer>
      </div>
    </DragProvider>
  );
}
