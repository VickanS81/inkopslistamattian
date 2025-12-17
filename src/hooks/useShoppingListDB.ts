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

export function useShoppingListDB() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentList, setCurrentList] = useState<DBShoppingList | null>(null);
  const [items, setItems] = useState<DBShoppingItem[]>([]);
  const [categoryOrder, setCategoryOrder] = useState<CategoryType[]>(
    CATEGORIES.map(c => c.id)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<{ id: string; display_name: string | null }[]>([]);

  // Fetch or create the user's default list
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchList = async () => {
      try {
        // First try to get a list the user owns or is member of
        const { data: ownedLists, error: ownedError } = await supabase
          .from('shopping_lists')
          .select('*')
          .eq('owner_id', user.id)
          .limit(1);

        if (ownedError) throw ownedError;

        let list = ownedLists?.[0];

        if (!list) {
          // Check if user is member of any list
          const { data: memberLists, error: memberError } = await supabase
            .from('list_members')
            .select('list_id, shopping_lists(*)')
            .eq('user_id', user.id)
            .limit(1);

          if (memberError) throw memberError;

          if (memberLists?.[0]?.shopping_lists) {
            list = memberLists[0].shopping_lists as unknown as DBShoppingList;
          }
        }

        if (!list) {
          // Create a new list for the user
          const { data: newList, error: createError } = await supabase
            .from('shopping_lists')
            .insert({ owner_id: user.id, name: 'Min lista' })
            .select()
            .single();

          if (createError) throw createError;
          list = newList;
        }

        setCurrentList(list);

        // Fetch items
        const { data: itemsData, error: itemsError } = await supabase
          .from('shopping_items')
          .select('*')
          .eq('list_id', list.id)
          .order('created_at', { ascending: true });

        if (itemsError) throw itemsError;
        setItems(itemsData || []);

        // Fetch category order
        const { data: orderData } = await supabase
          .from('category_order')
          .select('category_order')
          .eq('list_id', list.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (orderData?.category_order) {
          setCategoryOrder(orderData.category_order as CategoryType[]);
        }

        // Fetch members
        await fetchMembers(list.id);

      } catch (error) {
        console.error('Error fetching list:', error);
        toast({
          title: 'Kunde inte ladda listan',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchList();
  }, [user, toast]);

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
  };
}
