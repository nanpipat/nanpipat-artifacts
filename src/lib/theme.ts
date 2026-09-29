import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const config = defineConfig({
  globalCss: {
    html: {
      scrollBehavior: 'smooth'
    },
    body: {
      bg: { base: '#f0e7db', _dark: '#202023' }
    }
  },
  theme: {
    tokens: {
      fonts: {
        heading: { value: "'M PLUS Rounded 1c', sans-serif" }
      },
      colors: {
        grassTeal: { value: '#88ccca' }
      }
    }
  }
})

export const system = createSystem(defaultConfig, config)
