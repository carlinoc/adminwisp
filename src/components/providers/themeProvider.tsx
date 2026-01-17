"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// Cambia la importación del tipo a esta:
import { type ThemeProviderProps } from "next-themes" 

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}