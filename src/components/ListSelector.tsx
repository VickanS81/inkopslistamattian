import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, Plus, Check, Trash2, Edit2, Users } from 'lucide-react';
import { DBShoppingList } from '@/hooks/useShoppingListDB';
import { useAuth } from '@/contexts/AuthContext';

interface ListSelectorProps {
  allLists: DBShoppingList[];
  currentList: DBShoppingList | null;
  onSelectList: (list: DBShoppingList) => void;
  onCreateList: (name: string) => Promise<DBShoppingList | null>;
  onDeleteList: (listId: string) => void;
  onRenameList: (listId: string, newName: string) => void;
}

export function ListSelector({
  allLists,
  currentList,
  onSelectList,
  onCreateList,
  onDeleteList,
  onRenameList,
}: ListSelectorProps) {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [renameListId, setRenameListId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleCreate = async () => {
    if (!newListName.trim()) return;
    await onCreateList(newListName.trim());
    setNewListName('');
    setIsCreateOpen(false);
  };

  const handleRename = () => {
    if (!renameListId || !renameValue.trim()) return;
    onRenameList(renameListId, renameValue.trim());
    setRenameListId(null);
    setRenameValue('');
    setIsRenameOpen(false);
  };

  const openRename = (list: DBShoppingList) => {
    setRenameListId(list.id);
    setRenameValue(list.name);
    setIsRenameOpen(true);
  };

  const isOwner = (list: DBShoppingList) => list.owner_id === user?.id;
  const isShared = (list: DBShoppingList) => !isOwner(list);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            <span className="max-w-[120px] truncate">{currentList?.name || 'Välj lista'}</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {allLists.map((list) => (
            <DropdownMenuItem
              key={list.id}
              onClick={() => onSelectList(list)}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isShared(list) && <Users className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                <span className="truncate">{list.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {currentList?.id === list.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Skapa ny lista
          </DropdownMenuItem>
          
          {currentList && isOwner(currentList) && (
            <>
              <DropdownMenuItem onClick={() => openRename(currentList)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Byt namn
              </DropdownMenuItem>
              {allLists.filter(l => l.owner_id === user?.id).length > 1 && (
                <DropdownMenuItem 
                  onClick={() => onDeleteList(currentList.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Ta bort lista
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create List Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Skapa ny lista</DialogTitle>
            <DialogDescription>Ge din nya inköpslista ett namn</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Listnamn"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleCreate} disabled={!newListName.trim()}>
                Skapa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename List Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Byt namn på lista</DialogTitle>
            <DialogDescription>Ange ett nytt namn för listan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Listnamn"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleRename} disabled={!renameValue.trim()}>
                Spara
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
