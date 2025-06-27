import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Navigate, useLocation } from 'react-router-dom';
import { authStore } from '../../stores/AuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  checkProfileComplete?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = observer(({ 
  children, 
  checkProfileComplete = false 
}) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(!authStore.sessionChecked);

  useEffect(() => {
    const checkAuth = async () => {
      if (!authStore.sessionChecked) {
        await authStore.checkSession();
      }
      setIsLoading(false);
    };

    // Only check auth if not already checked to prevent double checks
    if (!authStore.sessionChecked) {
    checkAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  // For debugging
  console.log('ProtectedRoute - Auth Status:', {
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    checkProfileComplete,
    isProfileComplete: authStore.user?.isProfileComplete
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!authStore.isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check profile completion if needed
  if (checkProfileComplete && authStore.user && !authStore.user.isProfileComplete) {
    return <Navigate to="/profile/complete" state={{ from: location }} replace />;
  }

  // Access granted
  return <>{children}</>;
});

export default ProtectedRoute;