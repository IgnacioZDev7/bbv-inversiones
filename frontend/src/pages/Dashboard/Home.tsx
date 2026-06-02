import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

export default function Home() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate('/signin', { replace: true });
      return;
    }

    const roleRoutes: Record<string, string> = {
      Administrador: '/admin',
      Analista: '/analyst',
      Inversionista: '/investor',
      Auditor: '/auditor',
    };

    const target = roleRoutes[user.role] || '/investor';
    navigate(target, { replace: true });
  }, [user, isLoading, navigate]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent dark:border-brand-400 dark:border-t-transparent" />
    </div>
  );
}
