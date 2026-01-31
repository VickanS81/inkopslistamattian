import { useEffect, useCallback, useRef } from 'react';
import { CategoryType } from '@/types/shopping';

const STORAGE_KEY = 'lastViewedCategory';

/**
 * Hook to track and persist the last viewed category.
 * Uses IntersectionObserver to detect which category is currently most visible.
 * On page load, scrolls to the last viewed category.
 */
export function useLastViewedCategory(listId: string | undefined) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasScrolledRef = useRef(false);
  const categoryVisibilityRef = useRef<Map<string, number>>(new Map());

  // Get the storage key for this list
  const getStorageKey = useCallback(() => {
    return listId ? `${STORAGE_KEY}_${listId}` : STORAGE_KEY;
  }, [listId]);

  // Save the last viewed category
  const saveLastCategory = useCallback((categoryId: string) => {
    try {
      localStorage.setItem(getStorageKey(), categoryId);
    } catch (e) {
      console.warn('Failed to save last category:', e);
    }
  }, [getStorageKey]);

  // Get the last viewed category
  const getLastCategory = useCallback((): string | null => {
    try {
      return localStorage.getItem(getStorageKey());
    } catch (e) {
      console.warn('Failed to get last category:', e);
      return null;
    }
  }, [getStorageKey]);

  // Scroll to a category element
  const scrollToCategory = useCallback((categoryId: string) => {
    const element = document.querySelector(`[data-category-id="${categoryId}"]`);
    if (element) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        element.scrollIntoView({ behavior: 'instant', block: 'start' });
        // Mark as scrolled
        hasScrolledRef.current = true;
        // Start observing after initial scroll
        setTimeout(() => {
          hasScrolledRef.current = false;
        }, 500);
      });
      return true;
    }
    return false;
  }, []);

  // Initialize observer to track visible categories
  useEffect(() => {
    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Don't update during initial scroll
        if (hasScrolledRef.current) return;

        entries.forEach((entry) => {
          const categoryId = entry.target.getAttribute('data-category-id');
          if (categoryId) {
            // Track visibility ratio for each category
            if (entry.isIntersecting) {
              categoryVisibilityRef.current.set(categoryId, entry.intersectionRatio);
            } else {
              categoryVisibilityRef.current.delete(categoryId);
            }
          }
        });

        // Find the category with highest visibility
        let maxRatio = 0;
        let mostVisibleCategory: string | null = null;
        
        categoryVisibilityRef.current.forEach((ratio, catId) => {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            mostVisibleCategory = catId;
          }
        });

        // Save the most visible category
        if (mostVisibleCategory) {
          saveLastCategory(mostVisibleCategory);
        }
      },
      {
        root: null, // viewport
        rootMargin: '-10% 0px -10% 0px', // Slight margin to focus on center
        threshold: [0, 0.25, 0.5, 0.75, 1.0], // Multiple thresholds for better accuracy
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [saveLastCategory]);

  // Observe category elements
  const observeCategories = useCallback(() => {
    if (!observerRef.current) return;

    // Find all category elements
    const categoryElements = document.querySelectorAll('[data-category-id]');
    
    // Disconnect existing observations
    observerRef.current.disconnect();
    categoryVisibilityRef.current.clear();
    
    // Observe each category
    categoryElements.forEach((element) => {
      observerRef.current?.observe(element);
    });
  }, []);

  // Restore scroll position when list changes or page loads
  useEffect(() => {
    if (!listId) return;

    // Wait for categories to render
    const timer = setTimeout(() => {
      const lastCategory = getLastCategory();
      if (lastCategory) {
        scrollToCategory(lastCategory);
      }
      // Start observing after initial scroll
      setTimeout(observeCategories, 600);
    }, 100);

    return () => clearTimeout(timer);
  }, [listId, getLastCategory, scrollToCategory, observeCategories]);

  // Re-observe when categories change
  const refreshObserver = useCallback(() => {
    setTimeout(observeCategories, 100);
  }, [observeCategories]);

  return {
    refreshObserver,
    scrollToCategory,
    getLastCategory,
    saveLastCategory,
  };
}
