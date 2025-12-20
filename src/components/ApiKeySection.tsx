import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiKey } from '@/hooks/useApiKey';
import { Copy, Eye, EyeOff, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ApiKeySection() {
  const { apiKey, isLoading, generateApiKey, deleteApiKey } = useApiKey();
  const [showKey, setShowKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    const newKey = await generateApiKey();
    setIsGenerating(false);
    
    if (newKey) {
      setShowKey(true);
      toast({
        title: 'API-nyckel skapad',
        description: 'Spara nyckeln på ett säkert ställe',
      });
    } else {
      toast({
        title: 'Fel',
        description: 'Kunde inte skapa API-nyckel',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    await deleteApiKey();
    toast({
      title: 'API-nyckel borttagen',
    });
  };

  const handleCopy = async () => {
    if (apiKey) {
      await navigator.clipboard.writeText(apiKey);
      toast({
        title: 'Kopierad',
        description: 'API-nyckeln har kopierats till urklipp',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label className="text-base font-medium">API-nyckel för externa appar</Label>
        <p className="text-sm text-muted-foreground">Laddar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-base font-medium">API-nyckel för externa appar</Label>
        <p className="text-sm text-muted-foreground">
          Använd denna nyckel för att skicka ingredienser från andra appar
        </p>
      </div>

      {apiKey ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowKey(!showKey)}
              title={showKey ? 'Dölj' : 'Visa'}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              title="Kopiera"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Skapa ny
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Ta bort
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Skapar...
            </>
          ) : (
            'Skapa API-nyckel'
          )}
        </Button>
      )}
    </div>
  );
}
