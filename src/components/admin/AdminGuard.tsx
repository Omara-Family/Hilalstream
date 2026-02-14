import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const user = useAppStore((s) => s.user);
  const isLoading = useAppStore((s) => s.isLoading);
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const [checkedRole, setCheckedRole] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Give auth state a moment to settle before redirecting
      const timeout = setTimeout(() => {
        const currentUser = useAppStore.getState().user;
        if (!currentUser) {
          navigate('/login', { replace: true });
          setStatus('unauthorized');
        }
      }, 500);
      return () => clearTimeout(timeout);
    }

    // User is available, check role
    setCheckedRole(false);
    supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' })
      .then(({ data, error }) => {
        setCheckedRole(true);
        if (error || !data) {
          console.warn('Admin check failed:', error?.message);
          setStatus('unauthorized');
          navigate('/', { replace: true });
        } else {
          setStatus('authorized');
        }
      });
  }, [user, isLoading, navigate]);

  if (status !== 'authorized') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
};
