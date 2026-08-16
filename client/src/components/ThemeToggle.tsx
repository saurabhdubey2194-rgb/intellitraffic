import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Dark/light theme toggle. Switchable only when the ThemeProvider
 * was created with switchable={true} (dark command-center is the default).
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { toggleTheme, switchable, theme } = useTheme();

  if (!switchable || !toggleTheme) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sidebar-border/60 text-sidebar-foreground/90 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${className}`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
