import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Check, X, Loader2 } from 'lucide-react';

interface PendingInvitation {
  invitation_id: string;
  list_id: string;
  list_name: string;
  inviter_name: string;
  created_at: string;
}

interface InvitationPopupProps {
  onAccepted: () => void;
}

export function InvitationPopup({ onAccepted }: InvitationPopupProps) {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchInvitations = async () => {
      const { data, error } = await supabase.rpc('get_pending_invitations');
      
      if (error) {
        console.error('Error fetching invitations:', error);
        return;
      }

      if (data && data.length > 0) {
        setInvitations(data);
        setOpen(true);
      }
    };

    fetchInvitations();

    // Subscribe to new invitations
    const channel = supabase
      .channel('invitations-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'list_invitations',
        },
        async () => {
          // Refetch to get the full invitation details
          const { data } = await supabase.rpc('get_pending_invitations');
          if (data && data.length > 0) {
            setInvitations(data);
            setOpen(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const currentInvitation = invitations[currentIndex];

  const handleAccept = async () => {
    if (!currentInvitation || !user) return;

    setIsLoading(true);

    try {
      // Add user to list members
      const { error: memberError } = await supabase
        .from('list_members')
        .insert({
          list_id: currentInvitation.list_id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from('list_invitations')
        .update({ status: 'accepted' })
        .eq('id', currentInvitation.invitation_id);

      if (updateError) throw updateError;

      toast({ title: `Du gick med i "${currentInvitation.list_name}"` });

      // Move to next invitation or close
      if (currentIndex < invitations.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setOpen(false);
        onAccepted();
      }

    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({ title: 'Kunde inte acceptera inbjudan', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!currentInvitation) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('list_invitations')
        .update({ status: 'declined' })
        .eq('id', currentInvitation.invitation_id);

      if (error) throw error;

      toast({ title: 'Inbjudan nekad' });

      // Move to next invitation or close
      if (currentIndex < invitations.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setOpen(false);
      }

    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({ title: 'Kunde inte neka inbjudan', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentInvitation) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Inbjudan till lista
          </DialogTitle>
          <DialogDescription>
            Du har blivit inbjuden att delta i en inköpslista
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {currentInvitation.inviter_name[0].toUpperCase()}
            </span>
          </div>
          
          <div className="space-y-1">
            <p className="text-lg font-medium">
              {currentInvitation.inviter_name}
            </p>
            <p className="text-muted-foreground">
              vill dela listan <span className="font-semibold text-foreground">"{currentInvitation.list_name}"</span> med dig
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDecline}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
            Neka
          </Button>
          <Button
            className="flex-1"
            onClick={handleAccept}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Acceptera
          </Button>
        </div>

        {invitations.length > 1 && (
          <p className="text-xs text-center text-muted-foreground">
            {currentIndex + 1} av {invitations.length} inbjudningar
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
