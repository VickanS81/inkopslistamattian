import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { AppSettings } from '@/hooks/useSettings';

interface SettingsDialogProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export function SettingsDialog({ settings, onUpdateSettings }: SettingsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inställningar</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="auto-categorize" className="text-base font-medium">
                Automatisk kategorisering
              </Label>
              <p className="text-sm text-muted-foreground">
                {settings.autoCategorize
                  ? 'Nya varor placeras automatiskt i rätt kategori'
                  : 'Du placerar själv varorna i rätt kategori genom att dra dem'}
              </p>
            </div>
            <Switch
              id="auto-categorize"
              checked={settings.autoCategorize}
              onCheckedChange={(checked) => onUpdateSettings({ autoCategorize: checked })}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
