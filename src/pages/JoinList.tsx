import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ListInfo {
  name: string;
  ownerName: string;
}

export default function JoinList() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listInfo, setListInfo] = useState<ListInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      // Store the share code for after login
      localStorage.setItem('pending_share_code', shareCode || '');
      navigate('/auth');
      return;
    }

    if (user && shareCode) {
      fetchListInfo();
    }
  }, [user, authLoading, shareCode, navigate]);

  const fetchListInfo = async () => {
    try {
      // Use the SECURITY DEFINER function to get list info (bypasses RLS for invite flow)
      const { data: inviteInfo, error: inviteError } = await supabase
        .rpc('get_list_invite_info', { share_code_param: shareCode });

      if (inviteError) throw inviteError;
      
      if (!inviteInfo || inviteInfo.length === 0) {
        setError('Listan hittades inte. Kontrollera att länken är korrekt.');
        setIsLoading(false);
        return;
      }

      const list = inviteInfo[0];

      // Check if user is already owner
      if (list.owner_id === user?.id) {
        toast({ title: 'Du äger redan denna lista!' });
        navigate('/');
        return;
      }

      // Check if already a member
      const { data: membership } = await supabase
        .from('list_members')
        .select('id')
        .eq('list_id', list.list_id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (membership) {
        toast({ title: 'Du är redan med i denna lista!' });
        navigate('/');
        return;
      }

      setListInfo({
        name: list.list_name,
        ownerName: list.owner_name,
      });
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching list:', err);
      setError('Kunde inte hämta listinformation.');
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!shareCode || !user) return;

    setIsJoining(true);
    try {
      // Get the list ID
      const { data: list, error: listError } = await supabase
        .from('shopping_lists')
        .select('id')
        .eq('share_code', shareCode)
        .single();

      if (listError) throw listError;

      // Join the list
      const { error: joinError } = await supabase
        .from('list_members')
        .insert({ list_id: list.id, user_id: user.id });

      if (joinError) throw joinError;

      toast({
        title: 'Välkommen!',
        description: `Du är nu med i "${listInfo?.name}".`,
      });
      
      localStorage.removeItem('pending_share_code');
      navigate('/');
    } catch (err) {
      console.error('Error joining list:', err);
      toast({
        title: 'Kunde inte gå med',
        description: 'Försök igen senare.',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold mb-2">Något gick fel</h1>
        <p className="text-muted-foreground text-center mb-6">{error}</p>
        <Button onClick={() => navigate('/')}>Gå till startsidan</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="bg-secondary/30 rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-xl font-semibold mb-4">Inbjudan till lista</h1>
        
        <div className="bg-background/50 rounded-xl p-4 mb-6">
          <p className="text-muted-foreground text-sm mb-2">
            <span className="font-medium text-foreground">{listInfo?.ownerName}</span> vill dela listan
          </p>
          <p className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            {listInfo?.name}
          </p>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Acceptera inbjudan för att kunna se och redigera listan tillsammans.
        </p>

        <div className="space-y-3">
          <Button 
            onClick={handleJoin} 
            className="w-full" 
            disabled={isJoining}
          >
            {isJoining ? 'Går med...' : 'Acceptera inbjudan'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/')} 
            className="w-full"
          >
            Avböj
          </Button>
        </div>
      </div>
    </div>
  );
}
