import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CategoryType, CATEGORIES } from '@/types/shopping';
import { useToast } from '@/hooks/use-toast';

export interface DBShoppingItem {
  id: string;
  name: string;
  quantity: string;
  unit: string | null;
  category: string;
  checked: boolean;
  checked_at: string | null;
  checked_by: string | null;
  created_by: string;
  created_at: string;
  list_id: string;
}

export interface DBShoppingList {
  id: string;
  name: string;
  owner_id: string;
  share_code: string;
  created_at: string;
  updated_at: string;
}

const SELECTED_LIST_KEY = 'shopping-selected-list';

export function useShoppingListDB() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allLists, setAllLists] = useState<DBShoppingList[]>([]);
  const [currentList, setCurrentList] = useState<DBShoppingList | null>(null);
  const [items, setItems] = useState<DBShoppingItem[]>([]);
  const [categoryOrder, setCategoryOrder] = useState<CategoryType[]>(
    CATEGORIES.map(c => c.id)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<{ id: string; display_name: string | null }[]>([]);

  // Fetch all lists and select one
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchAllLists = async () => {
      try {
        // Get all owned lists
        const { data: ownedLists, error: ownedError } = await supabase
          .from('shopping_lists')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: true });

        if (ownedError) throw ownedError;

        // Get all lists user is member of
        const { data: memberLists, error: memberError } = await supabase
          .from('list_members')
          .select('list_id, shopping_lists(*)')
          .eq('user_id', user.id);

        if (memberError) throw memberError;

        const sharedLists = memberLists
          ?.map(m => m.shopping_lists as unknown as DBShoppingList)
          .filter(Boolean) || [];

        const allUserLists = [...(ownedLists || []), ...sharedLists];
        setAllLists(allUserLists);

        // Try to restore previously selected list
        const savedListId = localStorage.getItem(SELECTED_LIST_KEY);
        let selectedList = savedListId 
          ? allUserLists.find(l => l.id === savedListId) 
          : null;

        // If no saved list or saved list not found, use first list or create one
        if (!selectedList) {
          if (allUserLists.length > 0) {
            selectedList = allUserLists[0];
          } else {
            // Create a new default list
            const { data: newList, error: createError } = await supabase
              .from('shopping_lists')
              .insert({ owner_id: user.id, name: 'Min lista' })
              .select()
              .single();

            if (createError) throw createError;
            selectedList = newList;
            setAllLists([newList]);
          }
        }

        await selectList(selectedList);

      } catch (error) {
        console.error('Error fetching lists:', error);
        toast({
          title: 'Kunde inte ladda listorna',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllLists();
  }, [user, toast]);

  const selectList = async (list: DBShoppingList) => {
    if (!user) return;

    setCurrentList(list);
    localStorage.setItem(SELECTED_LIST_KEY, list.id);

    // Fetch items for this list
    const { data: itemsData, error: itemsError } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('list_id', list.id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
    } else {
      setItems(itemsData || []);
    }

    // Fetch category order for this list
    const { data: orderData } = await supabase
      .from('category_order')
      .select('category_order')
      .eq('list_id', list.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (orderData?.category_order) {
      setCategoryOrder(orderData.category_order as CategoryType[]);
    } else {
      setCategoryOrder(CATEGORIES.map(c => c.id));
    }

    // Fetch members
    await fetchMembers(list.id);
  };

  const fetchMembers = async (listId: string) => {
    if (!user) return;

    // Get owner
    const { data: list } = await supabase
      .from('shopping_lists')
      .select('owner_id, profiles!shopping_lists_owner_id_fkey(display_name)')
      .eq('id', listId)
      .single();

    // Get members
    const { data: memberData } = await supabase
      .from('list_members')
      .select('user_id, profiles!list_members_user_id_fkey(display_name)')
      .eq('list_id', listId);

    const allMembers: { id: string; display_name: string | null }[] = [];

    if (list) {
      const ownerProfile = list.profiles as unknown as { display_name: string | null };
      allMembers.push({
        id: list.owner_id,
        display_name: ownerProfile?.display_name || 'Ägare',
      });
    }

    memberData?.forEach((m) => {
      const profile = m.profiles as unknown as { display_name: string | null };
      allMembers.push({
        id: m.user_id,
        display_name: profile?.display_name || 'Medlem',
      });
    });

    setMembers(allMembers);
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!currentList) return;

    const channel = supabase
      .channel(`items-${currentList.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
          filter: `list_id=eq.${currentList.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setItems((prev) => [...prev, payload.new as DBShoppingItem]);
          } else if (payload.eventType === 'UPDATE') {
            setItems((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? (payload.new as DBShoppingItem) : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setItems((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentList]);

  const createList = useCallback(
    async (name: string) => {
      if (!user) return null;

      const { data: newList, error } = await supabase
        .from('shopping_lists')
        .insert({ owner_id: user.id, name })
        .select()
        .single();

      if (error) {
        console.error('Error creating list:', error);
        toast({ title: 'Kunde inte skapa listan', variant: 'destructive' });
        return null;
      }

      setAllLists((prev) => [...prev, newList]);
      await selectList(newList);
      toast({ title: `Lista "${name}" skapad` });
      return newList;
    },
    [user, toast]
  );

  const deleteList = useCallback(
    async (listId: string) => {
      if (!user) return;

      const listToDelete = allLists.find(l => l.id === listId);
      if (!listToDelete) return;

      // Can't delete if it's not owned by user
      if (listToDelete.owner_id !== user.id) {
        toast({ title: 'Du kan bara ta bort dina egna listor', variant: 'destructive' });
        return;
      }

      // Can't delete last list
      const ownedLists = allLists.filter(l => l.owner_id === user.id);
      if (ownedLists.length <= 1) {
        toast({ title: 'Du måste ha minst en lista', variant: 'destructive' });
        return;
      }

      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', listId);

      if (error) {
        console.error('Error deleting list:', error);
        toast({ title: 'Kunde inte ta bort listan', variant: 'destructive' });
        return;
      }

      const remainingLists = allLists.filter(l => l.id !== listId);
      setAllLists(remainingLists);

      // If we deleted the current list, switch to another one
      if (currentList?.id === listId && remainingLists.length > 0) {
        await selectList(remainingLists[0]);
      }

      toast({ title: `Lista "${listToDelete.name}" borttagen` });
    },
    [user, allLists, currentList, toast]
  );

  const renameList = useCallback(
    async (listId: string, newName: string) => {
      if (!user) return;

      const { error } = await supabase
        .from('shopping_lists')
        .update({ name: newName })
        .eq('id', listId);

      if (error) {
        console.error('Error renaming list:', error);
        toast({ title: 'Kunde inte byta namn på listan', variant: 'destructive' });
        return;
      }

      setAllLists((prev) =>
        prev.map((l) => (l.id === listId ? { ...l, name: newName } : l))
      );

      if (currentList?.id === listId) {
        setCurrentList((prev) => prev ? { ...prev, name: newName } : null);
      }

      toast({ title: 'Listnamn uppdaterat' });
    },
    [user, currentList, toast]
  );

  const addItem = useCallback(
    async (name: string, category: CategoryType = 'other', quantity = '1', unit?: string) => {
      if (!currentList || !user) return;

      const { error } = await supabase.from('shopping_items').insert({
        list_id: currentList.id,
        name,
        category,
        quantity,
        unit,
        created_by: user.id,
      });

      if (error) {
        console.error('Error adding item:', error);
        toast({ title: 'Kunde inte lägga till vara', variant: 'destructive' });
      }
    },
    [currentList, user, toast]
  );

  const toggleItem = useCallback(
    async (itemId: string, autoDelete = false) => {
      if (!user) return;

      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const newChecked = !item.checked;

      // If auto-delete is enabled and item is being checked, delete it instead
      if (autoDelete && newChecked) {
        // Optimistic update
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        
        const { error } = await supabase
          .from('shopping_items')
          .delete()
          .eq('id', itemId);

        if (error) {
          console.error('Error deleting item:', error);
          // Restore item on error
          setItems((prev) => [...prev, item]);
        }
        return;
      }

      const { error } = await supabase
        .from('shopping_items')
        .update({
          checked: newChecked,
          checked_at: newChecked ? new Date().toISOString() : null,
          checked_by: newChecked ? user.id : null,
        })
        .eq('id', itemId);

      if (error) {
        console.error('Error toggling item:', error);
      }
    },
    [items, user]
  );

  const moveItemToCategory = useCallback(
    async (itemId: string, newCategory: CategoryType) => {
      const { error } = await supabase
        .from('shopping_items')
        .update({ category: newCategory })
        .eq('id', itemId);

      if (error) {
        console.error('Error moving item:', error);
      }
    },
    []
  );

  const clearChecked = useCallback(async () => {
    if (!currentList) return;

    // Optimistic update - immediately remove checked items from local state
    const checkedItems = items.filter((i) => i.checked);
    setItems((prev) => prev.filter((i) => !i.checked));

    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('list_id', currentList.id)
      .eq('checked', true);

    if (error) {
      console.error('Error clearing items:', error);
      // Restore items on error
      setItems((prev) => [...prev, ...checkedItems]);
      toast({ title: 'Kunde inte rensa varor', variant: 'destructive' });
    }
  }, [currentList, items, toast]);

  const moveCategoryById = useCallback(
    async (categoryId: CategoryType, toIndex: number) => {
      if (!currentList || !user) return;

      const newOrder = [...categoryOrder];
      const fromIndex = newOrder.indexOf(categoryId);
      if (fromIndex === -1) return;

      newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, categoryId);
      setCategoryOrder(newOrder);

      // Upsert to database
      const { error } = await supabase.from('category_order').upsert(
        {
          list_id: currentList.id,
          user_id: user.id,
          category_order: newOrder,
        },
        { onConflict: 'list_id,user_id' }
      );

      if (error) {
        console.error('Error saving category order:', error);
      }
    },
    [categoryOrder, currentList, user]
  );

  // Group and sort items
  const groupedItems = items.reduce((acc, item) => {
    const cat = item.category as CategoryType;
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || undefined,
      category: cat,
      checked: item.checked,
      checkedAt: item.checked_at ? new Date(item.checked_at).getTime() : undefined,
    });
    return acc;
  }, {} as Record<CategoryType, { id: string; name: string; quantity: string; unit?: string; category: CategoryType; checked: boolean; checkedAt?: number }[]>);

  // Sort within each category
  Object.keys(groupedItems).forEach((category) => {
    groupedItems[category as CategoryType].sort((a, b) => {
      if (a.checked === b.checked) {
        return a.name.localeCompare(b.name, 'sv');
      }
      return a.checked ? 1 : -1;
    });
  });

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  return {
    allLists,
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
    selectList,
    createList,
    deleteList,
    renameList,
  };
}
