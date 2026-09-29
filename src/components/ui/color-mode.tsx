'use client'

import { ClientOnly, IconButton, Skeleton } from '@chakra-ui/react'
import { ThemeProvider, useTheme } from 'next-themes'
import * as React from 'react'
import { IoMoon, IoSunny } from 'react-icons/io5'

export function ColorModeProvider(props: React.PropsWithChildren) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    />
  )
}

export type ColorMode = 'light' | 'dark'

export interface UseColorModeReturn {
  colorMode: ColorMode
  setColorMode: (colorMode: ColorMode) => void
  toggleColorMode: () => void
}

export function useColorMode(): UseColorModeReturn {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme()
  const colorMode = forcedTheme || resolvedTheme
  const toggleColorMode = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }
  return {
    colorMode: colorMode as ColorMode,
    setColorMode: setTheme,
    toggleColorMode
  }
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode()
  // next-themes resolves the theme in a client effect, so during SSR (and the
  // hydration render) colorMode is undefined. This site defaults to dark
  // (ColorModeProvider defaultTheme="dark"), so treat unresolved as dark to
  // keep the server render consistent with the applied `.dark` class.
  return colorMode === 'light' ? light : dark
}

export function ColorModeIcon() {
  const { colorMode } = useColorMode()
  return colorMode === 'dark' ? <IoMoon /> : <IoSunny />
}
