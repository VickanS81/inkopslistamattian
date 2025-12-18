import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingListDB } from '@/components/ShoppingListDB';
import { InvitationPopup } from '@/components/InvitationPopup';

export default function Index() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <ShoppingListDB key={refreshKey} />
      <InvitationPopup onAccepted={() => setRefreshKey(k => k + 1)} />
    </>
  );
}
