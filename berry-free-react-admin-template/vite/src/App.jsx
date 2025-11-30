import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// routing
import router from 'routes';

// project imports
import NavigationScroll from 'layout/NavigationScroll';

import ThemeCustomization from 'themes';

// auth provider
import { AuthProvider } from 'contexts/auth';

// Create a client
const queryClient = new QueryClient();

// ==============================|| APP ||============================== //

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeCustomization>
        <AuthProvider>
          <NavigationScroll>
            <>
              <RouterProvider router={router} />
            </>
          </NavigationScroll>
        </AuthProvider>
      </ThemeCustomization>
    </QueryClientProvider>
  );
}
