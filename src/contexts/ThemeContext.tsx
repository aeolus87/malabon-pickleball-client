import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type Theme = "light" | "dark";
type FontSize = "normal" | "large" | "larger";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

// Font size multipliers (applied to root element)
const fontSizeMap: Record<FontSize, string> = {
  normal: "16px",   // Default
  large: "18px",    // 12.5% larger
  larger: "20px",   // 25% larger
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Check if user has a theme preference saved in localStorage
  const getSavedTheme = (): Theme => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }

    // If no saved preference, check system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }

    // Default to light mode
    return "light";
  };

  const getSavedFontSize = (): FontSize => {
    const saved = localStorage.getItem("fontSize");
    if (saved === "normal" || saved === "large" || saved === "larger") {
      return saved;
    }
    return "larger"; // Default to extra large for better readability
  };

  const [theme, setTheme] = useState<Theme>(getSavedTheme);
  const [fontSize, setFontSizeState] = useState<FontSize>(getSavedFontSize);

  // Apply theme to document when theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Save preference to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Apply font size to document
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = fontSizeMap[fontSize];
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (!localStorage.getItem("theme")) {
        setTheme(mediaQuery.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
