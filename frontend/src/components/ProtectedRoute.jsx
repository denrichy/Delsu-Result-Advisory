import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { session, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1944F1]" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/app/login" replace />;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    if (userRole === 'adviser') return <Navigate to="/app/adviser" replace />;
    if (userRole === 'student') return <Navigate to="/app/student" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
