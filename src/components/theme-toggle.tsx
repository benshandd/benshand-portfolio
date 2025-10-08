"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const current = (theme ?? resolvedTheme ?? "system") as string;

  function handleToggle() {
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
  }

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={handleToggle}>
      {current === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
