import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingListDB } from '@/components/ShoppingListDB';

export default function Index() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    // Check for pending share code after login
    if (user) {
      const pendingCode = localStorage.getItem('pending_share_code');
      if (pendingCode) {
        localStorage.removeItem('pending_share_code');
        navigate(`/join/${pendingCode}`);
      }
    }
  }, [user, navigate]);

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

  return <ShoppingListDB />;
}
