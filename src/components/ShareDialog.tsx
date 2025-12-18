import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Users, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ShareDialogProps {
  listId: string;
  listName: string;
  members: { id: string; display_name: string | null }[];
}

export function ShareDialog({ listId, listName, members }: ShareDialogProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleInvite = async () => {
    if (!email.trim() || !user) return;

    const trimmedEmail = email.trim().toLowerCase();

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast({ title: 'Ogiltig e-postadress', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      // Check if email exists in system
      const { data: emailExists, error: checkError } = await supabase
        .rpc('check_email_exists', { email_param: trimmedEmail });

      if (checkError) throw checkError;

      if (!emailExists) {
        toast({
          title: 'Användare finns inte',
          description: 'Denna e-postadress har inget konto. Kontakta personen för att skapa ett konto.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Check if user is trying to invite themselves
      if (user.email?.toLowerCase() === trimmedEmail) {
        toast({ title: 'Du kan inte bjuda in dig själv', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      // Check if already a member
      const existingMember = members.find(m => {
        // This is a simplified check - ideally we'd check by email
        return false; // We'll rely on the invitation check below
      });

      // Check if there's already a pending invitation
      const { data: existingInvitation } = await supabase
        .from('list_invitations')
        .select('id, status')
        .eq('list_id', listId)
        .eq('invitee_email', trimmedEmail)
        .maybeSingle();

      if (existingInvitation) {
        if (existingInvitation.status === 'pending') {
          toast({ title: 'En inbjudan har redan skickats till denna person', variant: 'destructive' });
          setIsLoading(false);
          return;
        }
        if (existingInvitation.status === 'accepted') {
          toast({ title: 'Denna person är redan medlem i listan', variant: 'destructive' });
          setIsLoading(false);
          return;
        }
        // If declined, delete and create new
        await supabase.from('list_invitations').delete().eq('id', existingInvitation.id);
      }

      // Create invitation
      const { error: inviteError } = await supabase
        .from('list_invitations')
        .insert({
          list_id: listId,
          inviter_id: user.id,
          invitee_email: trimmedEmail,
        });

      if (inviteError) throw inviteError;

      toast({ title: 'Inbjudan skickad!' });
      setEmail('');
      setOpen(false);

    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({ title: 'Kunde inte skicka inbjudan', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Share2 className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Dela "{listName}"
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ange e-postadressen till personen du vill dela listan med:
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="namn@exempel.se"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                disabled={isLoading}
              />
              <Button
                onClick={handleInvite}
                disabled={isLoading || !email.trim()}
                className="shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

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
