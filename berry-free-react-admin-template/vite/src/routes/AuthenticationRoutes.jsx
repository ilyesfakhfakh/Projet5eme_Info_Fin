import { lazy } from 'react';

// project imports
import Loadable from 'ui-component/Loadable';
import MinimalLayout from 'layout/MinimalLayout';

// authentication routing
const LoginPage = Loadable(lazy(() => import('views/pages/auth-forms/AuthLogin')));
const RegisterPage = Loadable(lazy(() => import('views/pages/auth-forms/AuthRegister')));
const EmailVerificationPage = Loadable(lazy(() => import('views/pages/auth-forms/EmailVerification')));

// ==============================|| AUTHENTICATION ROUTING ||============================== //

const AuthenticationRoutes = {
  path: '/',
  element: <MinimalLayout />,
  children: [
    {
      path: '/login',
      element: <LoginPage />
    },
    {
      path: '/register',
      element: <RegisterPage />
    },
    {
      path: '/verify-email',
      element: <EmailVerificationPage />
    }
  ]
};

export default AuthenticationRoutes;
