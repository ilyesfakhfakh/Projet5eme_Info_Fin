import { Navigate } from 'react-router-dom';
import { useAuth } from 'contexts/auth';

export default function RootRedirect() {
  const { token } = useAuth();
  if (token) {
    return <Navigate to="/dashboard/default" replace />;
  }
  return <Navigate to="/login" replace />;
}
