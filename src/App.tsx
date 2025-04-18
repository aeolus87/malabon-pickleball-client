// src/App.tsx
import React, { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { reaction, runInAction } from "mobx";
import { authStore } from "./stores/AuthStore";
import { socketStore } from "./stores/SocketStore";
import { userStore } from "./stores/UserStore";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Use lazy loading for routes to improve initial page load time
const HomePage = lazy(() => import("./pages/HomePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const VenuesPage = lazy(() => import("./pages/VenuesPage"));
const ClubsPage = lazy(() => import("./pages/ClubsPage"));
const ClubDetailPage = lazy(() => import("./pages/ClubDetailPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const GoogleCallback = lazy(() => import("./pages/GoogleCallback"));
const ProfileComplete = lazy(() => import("./pages/ProfileComplete"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const SuperAdminPage = lazy(() => import("./pages/SuperAdminPage"));
const SuperAdminLogin = lazy(() => import("./pages/SuperAdminLogin"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// Protected route component using MobX auth store
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  checkProfileComplete?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = observer(
  ({
    children,
    requireAdmin = false,
    requireSuperAdmin = false,
    checkProfileComplete = false,
  }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Directly access the observable values for the render phase
    const isAuthenticated = authStore.isAuthenticated;
    const sessionChecked = authStore.sessionChecked;

    useEffect(() => {
      const disposer = reaction(
        () => ({
          isAuthenticated: authStore.isAuthenticated,
          user: authStore.user,
          sessionChecked: authStore.sessionChecked,
        }),
        (data) => {
          console.log("ProtectedRoute reaction triggered:", {
            isAuthenticated: data.isAuthenticated,
            sessionChecked: data.sessionChecked,
            user: data.user
              ? {
                  id: data.user.id,
                  email: data.user.email,
                  isProfileComplete: data.user.isProfileComplete,
                }
              : null,
            currentPath: location.pathname,
          });

          if (!data.isAuthenticated) {
            // Redirect to login if not authenticated
            console.log(
              "Not authenticated, redirecting to login from",
              location.pathname
            );
            navigate("/login", {
              state: { from: location.pathname },
              replace: true,
            });
            return;
          }

          if (requireSuperAdmin && !data.user?.isSuperAdmin) {
            console.log(
              "Super admin access required but user is not super admin, redirecting to home"
            );
            navigate("/", { replace: true });
            return;
          }

          if (requireAdmin && !data.user?.isAdmin) {
            console.log("Admin access required but user is not admin:", {
              userId: data.user?.id,
              email: data.user?.email,
              isAdmin: data.user?.isAdmin,
            });
            navigate("/", { replace: true });
            return;
          }

          // Only redirect to profile/complete if:
          // 1. We're checking for profile completion
          // 2. The user's profile is incomplete
          // 3. We're not already on a venues page (prevents redirect loop on refresh)
          // 4. We're not already on the profile/complete page (prevents redirect loop)
          if (
            checkProfileComplete &&
            !data.user?.isProfileComplete &&
            !location.pathname.includes("/venues") &&
            location.pathname !== "/profile/complete"
          ) {
            console.log(
              "Profile not complete, redirecting from",
              location.pathname
            );
            navigate("/profile/complete", { replace: true });
            return;
          }
        },
        { fireImmediately: true }
      );

      return () => disposer();
    }, [
      navigate,
      location,
      requireAdmin,
      requireSuperAdmin,
      checkProfileComplete,
    ]);

    // Show loading state while authentication check is in progress
    if (!sessionChecked) {
      return (
        <div className="flex items-center justify-center min-h-screen dark:bg-dark-bg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 dark:border-brand-400"></div>
        </div>
      );
    }

    // Show the route content if authenticated and has required privileges
    return isAuthenticated ? <>{children}</> : null;
  }
);

// Loading component for suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen dark:bg-dark-bg">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 dark:border-brand-400"></div>
  </div>
);

// App component
const App: React.FC = observer(() => {
  const location = useLocation();

  // Combined effect for session checking and socket initialization
  useEffect(() => {
    // First, check if session needs to be checked
    let needsSessionCheck = false;

    // Read the observable inside runInAction
    runInAction(() => {
      needsSessionCheck = !authStore.sessionChecked;
    });

    console.log(
      "App mounted, current path:",
      location.pathname,
      "needsSessionCheck:",
      needsSessionCheck
    );

    // Perform session check if needed
    if (needsSessionCheck) {
      console.log("Checking session on app mount");
      authStore.checkSession().then((isAuthenticated) => {
        console.log(
          "Session check completed, isAuthenticated:",
          isAuthenticated
        );
      });
    }

    // Set up reaction for authentication state changes
    const disposer = reaction(
      () => ({
        isAuthenticated: authStore.isAuthenticated,
        sessionChecked: authStore.sessionChecked,
      }),
      (data) => {
        console.log("App auth reaction triggered:", data);
        if (data.isAuthenticated) {
          // Initialize socket and load profile when authenticated
          socketStore.connect();
          // Only load profile if session is checked to prevent duplicate loads
          if (data.sessionChecked) {
            userStore.loadProfile();
          }
        } else {
          // Disconnect socket and clear profile when not authenticated
          socketStore.disconnect();
          userStore.clearProfile();
        }
      },
      { fireImmediately: true }
    );

    return () => {
      disposer();
      socketStore.disconnect();
    };
  }, [location.pathname]);

  return (
    <Navbar>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/superadmin/login" element={<SuperAdminLogin />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />

          {/* Protected Routes */}
          <Route
            path="/venues"
            element={
              <ProtectedRoute checkProfileComplete>
                <VenuesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/complete"
            element={
              <ProtectedRoute>
                <ProfileComplete />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clubs"
            element={
              <ProtectedRoute checkProfileComplete>
                <ClubsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clubs/:clubId"
            element={
              <ProtectedRoute checkProfileComplete>
                <ClubDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute requireSuperAdmin>
                <SuperAdminPage />
              </ProtectedRoute>
            }
          />

          {/* Not Found Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Footer />
    </Navbar>
  );
});

export default App;
