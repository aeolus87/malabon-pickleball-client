import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  User,
  MapPin,
  Info,
  Mail,
  Settings,
  LogOut,
  Book,
  Sun,
  Moon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { authStore } from "../../stores/AuthStore";
import { userStore } from "../../stores/UserStore";
import { getDisplayName } from "../../utils/userUtils";
import { useTheme } from "../../contexts/ThemeContext";
import Footer from "../Footer";
import Avatar from "../Avatar";

interface NavbarProps {
  children?: React.ReactNode;
}

const Navbar: React.FC<NavbarProps> = observer(({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Auto-collapse sidebar on smaller screens and detect mobile
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await authStore.logout();
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getNavigationLinks = () => {
    // Home link only for non-authenticated users
    const baseLinks = authStore.isAuthenticated
      ? []
      : [{ path: "/", label: "Home", icon: <Home size={20} /> }];

    const authenticatedLinks = authStore.isAuthenticated
      ? [
          { path: "/venues", label: "Venues", icon: <MapPin size={20} /> },
          { path: "/profile", label: "Profile", icon: <User size={20} /> },
          { path: "/clubs", label: "Clubs", icon: <Book size={20} /> },
        ]
      : [];

    // These links are visible to everyone
    const publicLinks = [
      { path: "/about", label: "About Us", icon: <Info size={20} /> },
      { path: "/contact", label: "Contact", icon: <Mail size={20} /> },
    ];

    return [...baseLinks, ...authenticatedLinks, ...publicLinks];
  };

  const navigationLinks = getNavigationLinks();

  // Explicitly access observables to prevent MobX warnings
  const user = authStore.user;
  const userProfile = userStore.profile;
  const isAdmin = authStore.user?.isAdmin;

  // Use the utility functions to get display name and avatar URL
  const userDisplayName = getDisplayName(
    userProfile?.displayName || user?.displayName,
    user?.email
  );

  // Render sidebar layout for authenticated users
  if (authStore.isAuthenticated) {
    return (
      <div className="flex h-screen dark:bg-dark-bg dark:text-dark-text transition-colors duration-300">
        {/* Sidebar - Desktop & Mobile */}
        <div
          className={`fixed inset-y-0 left-0 bg-white dark:bg-dark-card dark:border-dark-border transition-all duration-300 ease-in-out z-30 border-r border-gray-200 shadow-sm
            ${
              isMobile
                ? `${isMenuOpen ? "translate-x-0" : "-translate-x-full"} w-72`
                : `${isSidebarCollapsed ? "w-16" : "w-64"} lg:translate-x-0`
            }`}
        >
          {/* Sidebar Header with Logo */}
          <div
            className={`${isSidebarCollapsed && !isMobile ? "p-3" : "p-4"} border-b border-gray-200 dark:border-dark-border flex items-center ${
              isSidebarCollapsed && !isMobile
                ? "justify-center"
                : "justify-between"
            }`}
          >
            {!(isMobile || isSidebarCollapsed) ? (
              <>
                <Link to="/" className="flex items-center gap-2">
                  <img
                    src="/mplogos.png"
                    alt="Malabon PickleBallers Logo"
                    className="w-8 h-8 object-contain"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-brand-600 dark:text-brand-400 leading-tight">
                      Malabon
                    </span>
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-300 leading-tight -mt-1">
                      PickleBallers
                    </span>
                  </div>
                </Link>
                <button
                  onClick={toggleSidebar}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="Toggle sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                {!isMobile && isSidebarCollapsed ? (
                  <button
                    onClick={toggleSidebar}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label="Toggle sidebar"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                ) : (
                  isMobile && (
                    <div className="flex items-center justify-between w-full">
                      <Link to="/" className="flex items-center gap-2">
                        <img
                          src="/mplogos.png"
                          alt="Malabon PickleBallers Logo"
                          className="w-8 h-8 object-contain"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-brand-600 dark:text-brand-400 leading-tight">
                            Malabon
                          </span>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-300 leading-tight -mt-1">
                            PickleBallers
                          </span>
                        </div>
                      </Link>
                      <button
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={toggleMenu}
                        aria-label="Close menu"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )
                )}
              </>
            )}
          </div>

          {/* User Profile Section */}
          <div
            className={`${isSidebarCollapsed && !isMobile ? "p-3" : "p-4"} border-b border-gray-200 dark:border-dark-border ${
              isSidebarCollapsed && !isMobile ? "flex justify-center" : ""
            }`}
          >
            {!(isMobile || isSidebarCollapsed) ? (
              <div className="flex items-center space-x-3">
                <Avatar
                  src={userProfile?.photoURL || user?.photoURL}
                  name={userDisplayName}
                  alt={userDisplayName}
                  size="md"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-sm dark:text-gray-300">
                    {userDisplayName}
                  </span>
                </div>
              </div>
            ) : (
              <>
                {!isMobile && (
                  <Avatar
                    src={userProfile?.photoURL || user?.photoURL}
                    name={userDisplayName}
                    alt={userDisplayName}
                    size="md"
                  />
                )}
                {isMobile && (
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={userProfile?.photoURL || user?.photoURL}
                      name={userDisplayName}
                      alt={userDisplayName}
                      size="md"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm dark:text-gray-300">
                        {userDisplayName}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Navigation Links */}
          <div className="flex-grow overflow-y-auto py-2">
            <ul className={`space-y-1 ${isSidebarCollapsed && !isMobile ? "px-2" : "px-3"}`}>
              {navigationLinks.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center ${
                      isSidebarCollapsed && !isMobile
                        ? "justify-center px-2 py-3"
                        : "px-3 py-2.5"
                    } text-sm font-medium transition-colors rounded-lg ${
                      isActive(item.path)
                        ? "bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300"
                        : "text-gray-600 hover:bg-brand-50 hover:text-brand-700 dark:text-gray-300 dark:hover:bg-dark-muted dark:hover:text-brand-300"
                    }`}
                    onClick={() => isMobile && setIsMenuOpen(false)}
                  >
                    <span className={`${!(isSidebarCollapsed && !isMobile) ? "mr-3" : ""}`}>{item.icon}</span>
                    {!(isSidebarCollapsed && !isMobile) && (
                      <span>{item.label}</span>
                    )}
                  </Link>
                </li>
              ))}

              {/* Admin link if user is admin */}
              {isAdmin && (
                <li>
                  <Link
                    to="/admin"
                    className={`flex items-center ${
                      isSidebarCollapsed && !isMobile
                        ? "justify-center px-2 py-3"
                        : "px-3 py-2.5"
                    } text-sm font-medium transition-colors rounded-lg ${
                      isActive("/admin")
                        ? "bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300"
                        : "text-gray-600 hover:bg-brand-50 hover:text-brand-700 dark:text-gray-300 dark:hover:bg-dark-muted dark:hover:text-brand-300"
                    }`}
                    onClick={() => isMobile && setIsMenuOpen(false)}
                  >
                    <span className={`${!(isSidebarCollapsed && !isMobile) ? "mr-3" : ""}`}>
                      <Settings size={20} />
                    </span>
                    {!(isSidebarCollapsed && !isMobile) && (
                      <span>Admin Panel</span>
                    )}
                  </Link>
                </li>
              )}

              {/* Super Admin link if user is super admin */}
              {user?.isSuperAdmin && (
                <li>
                  <Link
                    to="/superadmin"
                    className={`flex items-center ${
                      isSidebarCollapsed && !isMobile
                        ? "justify-center px-2 py-3"
                        : "px-3 py-2.5"
                    } text-sm font-medium transition-colors rounded-lg ${
                      isActive("/superadmin")
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                        : "text-gray-600 hover:bg-purple-50 hover:text-purple-700 dark:text-gray-300 dark:hover:bg-dark-muted dark:hover:text-purple-300"
                    }`}
                    onClick={() => isMobile && setIsMenuOpen(false)}
                  >
                    <span className={`${!(isSidebarCollapsed && !isMobile) ? "mr-3" : ""}`}>
                      <Settings size={20} />
                    </span>
                    {!(isSidebarCollapsed && !isMobile) && (
                      <span>Super Admin</span>
                    )}
                  </Link>
                </li>
              )}

              {/* Theme Toggle */}
              <li>
                <button
                  onClick={toggleTheme}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed && !isMobile ? "justify-center px-2 py-3" : "px-3 py-2.5"
                  } text-sm font-medium transition-colors rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-dark-muted dark:hover:text-gray-100`}
                >
                  <span className={`${!(isSidebarCollapsed && !isMobile) ? "mr-3" : ""}`}>
                    {theme === "dark" ? (
                      <Sun size={20} className="text-yellow-400" />
                    ) : (
                      <Moon size={20} className="text-gray-600" />
                    )}
                  </span>
                  {!(isSidebarCollapsed && !isMobile) && (
                    <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                  )}
                </button>
              </li>

              {/* Logout */}
              <li className="mt-4">
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed && !isMobile ? "justify-center px-2 py-3" : "px-3 py-2.5"
                  } text-sm font-medium transition-colors rounded-lg text-red-600 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300`}
                >
                  <span className={`${!(isSidebarCollapsed && !isMobile) ? "mr-3" : ""}`}>
                    <LogOut size={20} />
                  </span>
                  {!(isSidebarCollapsed && !isMobile) && <span>Logout</span>}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Mobile menu button - only visible on mobile */}
        {isMobile && !isMenuOpen && (
          <div className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center px-4 shadow-sm">
            <button
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              onClick={toggleMenu}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="ml-3 font-medium text-gray-800 dark:text-gray-200">
              {location.pathname === "/profile"
                ? "Profile"
                : location.pathname === "/venues"
                ? "Venues"
                : location.pathname === "/clubs"
                ? "Clubs"
                : location.pathname === "/about"
                ? "About Us"
                : location.pathname === "/contact"
                ? "Contact"
                : location.pathname === "/admin"
                ? "Admin Panel"
                : location.pathname === "/superadmin"
                ? "Super Admin"
                : "Home"}
            </div>
          </div>
        )}

        {/* Main content area - adjusted for sidebar width and mobile header */}
        <div
          className={`flex-1 transition-all duration-300 ${
            isMobile
              ? "ml-0 pt-16"
              : isSidebarCollapsed
              ? "lg:ml-16"
              : "lg:ml-64"
          }`}
        >
          <main className="min-h-screen">
            {/* Pass children content */}
            {children}
          </main>
        </div>
      </div>
    );
  }

  // For non-authenticated users
  return (
    <div className="bg-white dark:bg-dark-bg min-h-screen flex flex-col dark:text-dark-text transition-colors duration-300">
      <header className="bg-white dark:bg-dark-card shadow-sm border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <img
                  src="/mplogos.png"
                  alt="Malabon PickleBallers Logo"
                  className="w-8 h-8 object-contain"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-brand-600 dark:text-brand-400 leading-tight">
                    Malabon
                  </span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-300 leading-tight -mt-1">
                    PickleBallers
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigationLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                    isActive(item.path)
                      ? "border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-300"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {/* Login button */}
              <Link
                to="/login"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                  isActive("/login")
                    ? "border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-300"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600"
                }`}
              >
                Login
              </Link>
              {/* Theme toggle button */}
              <button
                onClick={toggleTheme}
                className="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600"
              >
                {theme === "dark" ? (
                  <Sun size={18} className="text-yellow-400 mr-1" />
                ) : (
                  <Moon size={18} className="mr-1" />
                )}
                {theme === "dark" ? "Light" : "Dark"}
              </button>
            </nav>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={toggleTheme}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-md mr-2"
              >
                {theme === "dark" ? (
                  <Sun size={20} className="text-yellow-400" />
                ) : (
                  <Moon size={20} />
                )}
              </button>
              <button
                onClick={toggleMenu}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-md"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigationLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive(item.path)
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-900/20 dark:text-brand-300"
                      : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-dark-muted dark:hover:border-gray-600 dark:hover:text-gray-100"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {/* Login button */}
              <Link
                to="/login"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive("/login")
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-900/20 dark:text-brand-300"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-dark-muted dark:hover:border-gray-600 dark:hover:text-gray-100"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow">{children}</main>

      <Footer />
    </div>
  );
});

export default Navbar;
