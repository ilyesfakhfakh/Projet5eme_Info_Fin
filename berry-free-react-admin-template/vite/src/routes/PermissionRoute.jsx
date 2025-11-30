import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from 'contexts/auth';
import { hasPermission } from 'utils/permissions';

export default function PermissionRoute({ permission, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!permission) return children;
  if (hasPermission(user, permission)) return children;

  return <Navigate to="/" state={{ from: location }} replace />;
}

PermissionRoute.propTypes = { permission: PropTypes.string, children: PropTypes.node };
