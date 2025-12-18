import { useState, useCallback } from 'react';
import { CategoryType, CategoryInfo } from '@/types/shopping';
import { CategoryGroup } from './CategoryGroup';
import { Header } from './Header';
import { EmptyState } from './EmptyState';
import { AddItemInput } from './AddItemInput';
import { ShareDialog } from './ShareDialog';
import { SettingsDialog } from './SettingsDialog';
import { ListSelector } from './ListSelector';
import { useShoppingListDB } from '@/hooks/useShoppingListDB';
import { useSettings, AppSettings } from '@/hooks/useSettings';
import { DragProvider, useDragState } from '@/contexts/DragContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { SpellSuggestion } from './ShoppingItem';

interface CategoryListProps {
  categoryOrder: CategoryType[];
  groupedItems: Record<CategoryType, any[]>;
  settings: AppSettings;
  customCategories: CategoryInfo[];
  onToggleItem: (id: string) => void;
  onMoveItem: (itemId: string, newCategory: CategoryType) => void;
  onMoveCategory: (categoryId: CategoryType, toIndex: number) => void;
  spellSuggestions: Record<string, SpellSuggestion>;
  onAcceptSuggestion: (itemId: string, correctedWord: string, category: CategoryType) => void;
  onRejectSuggestion: (itemId: string) => void;
}

function CategoryList({ 
  categoryOrder, 
  groupedItems, 
  settings,
  customCategories,
  onToggleItem, 
  onMoveItem, 
  onMoveCategory,
  spellSuggestions,
  onAcceptSuggestion,
  onRejectSuggestion
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
          customCategories={customCategories}
          onToggleItem={onToggleItem}
          onMoveItem={onMoveItem}
          onMoveCategory={onMoveCategory}
          spellSuggestions={spellSuggestions}
          onAcceptSuggestion={onAcceptSuggestion}
          onRejectSuggestion={onRejectSuggestion}
        />
      ))}
    </div>
  );
}

export function ShoppingListDB() {
  const {
    allLists,
    currentList,
    groupedItems,
    categoryOrder,
    customCategories,
    hiddenDefaultCategories,
    visibleDefaultCategories,
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
    selectList,
    createList,
    deleteList,
    renameList,
    updateItemName,
    addCustomCategory,
    deleteCustomCategory,
    hideDefaultCategory,
    restoreDefaultCategories,
  } = useShoppingListDB();

  const { signOut } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [spellSuggestions, setSpellSuggestions] = useState<Record<string, SpellSuggestion>>({});

  const analyzeWithAI = useCallback(async (itemId: string, word: string) => {
    console.log('analyzeWithAI called:', { itemId, word, autoCategorize: settings.autoCategorize });
    try {
      const { data, error } = await supabase.functions.invoke('spell-check', {
        body: { word }
      });

      console.log('spell-check response:', { data, error });

      if (error) {
        console.error('AI analysis error:', error);
        return;
      }

      // If auto-categorize is on, move to AI-determined category
      const shouldMove = settings.autoCategorize && data?.category && data.category !== 'other';
      console.log('Should move item?', { shouldMove, category: data?.category, autoCategorize: settings.autoCategorize });
      
      if (shouldMove) {
        console.log('Moving item to category:', data.category);
        await moveItemToCategory(itemId, data.category as CategoryType);
      }

      // Show spell suggestion if misspelled
      if (data?.isMisspelled && data?.correctedWord) {
        setSpellSuggestions(prev => ({
          ...prev,
          [itemId]: {
            correctedWord: data.correctedWord,
            category: data.category as CategoryType
          }
        }));
      }
    } catch (err) {
      console.error('AI analysis failed:', err);
    }
  }, [moveItemToCategory, settings.autoCategorize]);

  const handleAddItem = async (name: string) => {
    // Always add to 'other' first, then let AI categorize
    const itemId = await addItem(name, 'other', '1', 'st');
    
    if (itemId) {
      // AI handles both categorization and spell checking
      analyzeWithAI(itemId, name);
    }
  };

  const handleAcceptSuggestion = useCallback(async (itemId: string, correctedWord: string, category: CategoryType) => {
    await updateItemName(itemId, correctedWord);
    if (category !== 'other') {
      await moveItemToCategory(itemId, category);
    }
    setSpellSuggestions(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }, [updateItemName, moveItemToCategory]);

  const handleRejectSuggestion = useCallback((itemId: string) => {
    setSpellSuggestions(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }, []);

  const hasItems = totalCount > 0;
  const allComplete = hasItems && checkedCount === totalCount;

  const handleMoveCategory = (categoryId: CategoryType, toIndex: number) => {
    moveCategoryById(categoryId, toIndex);
  };

  const handleToggleItem = (itemId: string) => {
    toggleItem(itemId, settings.autoClearChecked);
    // Remove spell suggestion when item is toggled
    if (spellSuggestions[itemId]) {
      setSpellSuggestions(prev => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }
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
          <div className="flex items-center gap-1">
            <ListSelector
              allLists={allLists}
              currentList={currentList}
              onSelectList={selectList}
              onCreateList={createList}
              onDeleteList={deleteList}
              onRenameList={renameList}
            />
            {currentList && (
              <ShareDialog listId={currentList.id} listName={currentList.name} members={members} />
            )}
            <SettingsDialog 
              settings={settings} 
              onUpdateSettings={updateSettings}
              customCategories={customCategories}
              visibleDefaultCategories={visibleDefaultCategories}
              hiddenDefaultCategories={hiddenDefaultCategories}
              onAddCategory={addCustomCategory}
              onDeleteCategory={deleteCustomCategory}
              onHideDefaultCategory={hideDefaultCategory}
              onRestoreDefaultCategories={restoreDefaultCategories}
            />
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
          checkedCount={checkedCount}
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
              customCategories={customCategories}
              onToggleItem={handleToggleItem}
              onMoveItem={moveItemToCategory}
              onMoveCategory={handleMoveCategory}
              spellSuggestions={spellSuggestions}
              onAcceptSuggestion={handleAcceptSuggestion}
              onRejectSuggestion={handleRejectSuggestion}
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
