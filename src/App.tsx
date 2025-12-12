// src/App.tsx
import React, { useEffect, lazy, Suspense, useCallback, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { reaction, runInAction } from "mobx";
import { authStore } from "./stores/AuthStore";
import { socketStore } from "./stores/SocketStore";
import { userStore } from "./stores/UserStore";
import Navbar from "./components/Navbar";
import { useIdleTimeout } from "./hooks/useIdleTimeout";
import { printConsoleWelcome, warmupServer } from "./utils/consoleUtils";
import "./index.css";

// Use lazy loading for routes to improve initial page load time
const HomePage = lazy(() => import("./pages/HomePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const VenuesPage = lazy(() => import("./pages/VenuesPage"));
const ClubsPage = lazy(() => import("./pages/ClubsPage"));
const ClubDetailPage = lazy(() => import("./pages/ClubDetailPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const GoogleCallbackPage = lazy(() => import("./pages/GoogleCallback"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const SuperAdminPage = lazy(() => import("./pages/SuperAdminPage"));
const SuperAdminLogin = lazy(() => import("./pages/SuperAdminLogin"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const CoachPage = lazy(() => import("./pages/CoachPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

// Protected route component using MobX auth store
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  requireCoach?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = observer(
  ({
    children,
    requireAdmin = false,
    requireSuperAdmin = false,
    requireCoach = false,
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
                  isVerified: data.user.isVerified,
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

          // Check if user is verified (allow access to /register and /verify-email for unverified users)
          // Skip verification check for super admin
          if (
            !data.user?.isSuperAdmin &&
            !data.user?.isVerified &&
            location.pathname !== "/register" &&
            location.pathname !== "/verify-email"
          ) {
            console.log(
              "User not verified, redirecting to register from",
              location.pathname
            );
            navigate("/register", {
              state: { 
                from: location.pathname,
                message: "Please verify your email before accessing this page."
              },
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

          // Coach access: coaches, admins, and super admins can access coach pages
          if (requireCoach && data.user?.role !== "coach" && !data.user?.isAdmin && !data.user?.isSuperAdmin) {
            console.log("Coach access required but user is not a coach/admin:", {
              userId: data.user?.id,
              email: data.user?.email,
              role: data.user?.role,
            });
            navigate("/", { replace: true });
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
      requireCoach,
    ]);

    // Show loading state while authentication check is in progress
    if (!sessionChecked) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen dark:bg-dark-bg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 dark:border-brand-400 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-sm max-w-xs text-center">
            Verifying your session...
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs max-w-xs text-center mt-2">
            First load might take a moment if our server is waking up.
          </p>
        </div>
      );
    }

    // Show the route content if authenticated and has required privileges
    return isAuthenticated ? <>{children}</> : null;
  }
);

// Loading component for suspense fallback
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen dark:bg-dark-bg">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 dark:border-brand-400 mb-4"></div>
    <p className="text-gray-600 dark:text-gray-300 text-sm max-w-xs text-center">
      Loading Malabon PickleBallers...
    </p>
    <p className="text-gray-500 dark:text-gray-400 text-xs max-w-xs text-center mt-2">
      First load might take a moment if our server is waking up.
    </p>
  </div>
);

// App component
const App: React.FC = observer(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  // Idle timeout - logs out user after 5 minutes of inactivity
  const handleIdleLogout = useCallback(() => {
    setShowIdleWarning(false);
    authStore.clearAuth();
    socketStore.disconnect();
    userStore.clearProfile();
    navigate("/login?idle=true", { replace: true });
  }, [navigate]);

  useIdleTimeout({
    timeout: 1 * 60 * 1000, // 1 minute (DEMO - change back to 5 minutes for production)
    warningBefore: 30 * 1000, // warn 30 seconds before logout (DEMO)
    onIdle: handleIdleLogout,
    onWarn: () => setShowIdleWarning(true),
    onActive: () => setShowIdleWarning(false),
    enabled: authStore.isAuthenticated,
  });

  // Initialize server connection and display welcome message
  useEffect(() => {
    // Print welcome ASCII art to console
    printConsoleWelcome();

    // Call warmup endpoint to initialize the server faster
    warmupServer();
  }, []);

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
        {showIdleWarning && (
          <div
            className="mx-auto max-w-3xl mt-3 px-4"
            role="alert"
            aria-live="polite"
          >
            <div className="rounded-md border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/30 px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-sm text-yellow-900 dark:text-yellow-100">
                You’ve been inactive. You’ll be logged out in 30 seconds.
              </p>
              <button
                type="button"
                onClick={() => setShowIdleWarning(false)}
                className="shrink-0 rounded-md bg-yellow-600 text-white text-sm px-3 py-1.5 hover:bg-yellow-700"
              >
                I’m still here
              </button>
            </div>
          </div>
        )}
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            path="/auth/google/callback"
            element={<GoogleCallbackPage />}
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/profile/:userId" element={<UserProfilePage />} />
          <Route path="/superadmin/login" element={<SuperAdminLogin />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route
            path="/venues"
            element={
              <ProtectedRoute>
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
            path="/clubs"
            element={
              <ProtectedRoute>
                <ClubsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clubs/:clubId"
            element={
              <ProtectedRoute>
                <ClubDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Coach Routes */}
          <Route
            path="/coach"
            element={
              <ProtectedRoute requireCoach>
                <CoachPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Routes */}
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
    </Navbar>
  );
});

export default App;
