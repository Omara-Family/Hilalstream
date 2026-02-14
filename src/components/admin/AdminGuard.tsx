import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const user = useAppStore((s) => s.user);
  const isLoading = useAppStore((s) => s.isLoading);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' })
      .then(({ data }) => {
        if (!data) {
          navigate('/');
        } else {
          setIsAdmin(true);
        }
      });
  }, [user, isLoading, navigate]);

  if (isLoading || isAdmin === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
};
