import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareDialogProps {
  shareCode: string;
  members: { id: string; display_name: string | null }[];
}

export function ShareDialog({ shareCode, members }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/join/${shareCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: 'Länk kopierad!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Kunde inte kopiera', variant: 'destructive' });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Gå med i min inköpslista',
          text: 'Klicka på länken för att gå med i min delade inköpslista på Handla.',
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled or failed:', err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Share2 className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Dela listan
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Dela denna länk för att bjuda in andra till listan:
            </p>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <Button onClick={handleShare} className="w-full">
            <Share2 className="w-4 h-4 mr-2" />
            Dela länk
          </Button>

          {members.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="w-4 h-4" />
                Medlemmar ({members.length})
              </div>
              <div className="space-y-2">
                {members.map((member, index) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                      {(member.display_name || 'A')[0].toUpperCase()}
                    </div>
                    <span className="text-sm">
                      {member.display_name || 'Anonym'}
                      {index === 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">(ägare)</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
