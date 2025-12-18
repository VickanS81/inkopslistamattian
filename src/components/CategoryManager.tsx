import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { generateCategoryEmoji, commonCategoryEmojis } from '@/utils/categoryEmoji';
import { CATEGORIES, CategoryInfo } from '@/types/shopping';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CustomCategory {
  id: string;
  category_id: string;
  name: string;
  icon: string;
}

interface CategoryManagerProps {
  customCategories: CustomCategory[];
  onAddCategory: (name: string, icon: string) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
}

export function CategoryManager({
  customCategories,
  onAddCategory,
  onDeleteCategory,
}: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsAdding(true);
    const emoji = selectedEmoji || generateCategoryEmoji(newCategoryName);
    
    try {
      await onAddCategory(newCategoryName.trim(), emoji);
      setNewCategoryName('');
      setSelectedEmoji(null);
    } finally {
      setIsAdding(false);
    }
  };

  const previewEmoji = selectedEmoji || (newCategoryName ? generateCategoryEmoji(newCategoryName) : '📦');

  // Get default categories that can't be deleted
  const defaultCategories = CATEGORIES;

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-foreground">Kategorier</div>
      
      {/* Default categories (read-only) */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Standardkategorier</div>
        <div className="flex flex-wrap gap-2">
          {defaultCategories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md text-sm"
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom categories */}
      {customCategories.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Egna kategorier</div>
          <div className="space-y-2">
            {customCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-muted rounded-md"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-sm">{cat.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDeleteCategory(cat.category_id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new category */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Lägg till ny kategori</div>
        <div className="flex items-center gap-2">
          <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0 text-lg"
              >
                {previewEmoji}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="grid grid-cols-6 gap-1">
                {commonCategoryEmojis.map((emoji) => (
                  <Button
                    key={emoji}
                    variant={selectedEmoji === emoji ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0 text-lg"
                    onClick={() => {
                      setSelectedEmoji(emoji);
                      setEmojiPickerOpen(false);
                    }}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    setSelectedEmoji(null);
                    setEmojiPickerOpen(false);
                  }}
                >
                  Använd automatisk ikon
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <Input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Kategorinamn..."
            className="flex-1 h-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddCategory();
              }
            }}
          />
          
          <Button
            onClick={handleAddCategory}
            disabled={!newCategoryName.trim() || isAdding}
            size="sm"
            className="h-10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
