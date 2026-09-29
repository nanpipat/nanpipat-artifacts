import { useColorMode, useColorModeValue } from './ui/color-mode'
import { AnimatePresence, motion } from 'framer-motion'
import { ClientOnly, IconButton, Skeleton } from '@chakra-ui/react'
import { IoMoon, IoSunny } from 'react-icons/io5'

const ThemeToggleButton = () => {
  const { toggleColorMode } = useColorMode()

  return (
    <ClientOnly fallback={<Skeleton boxSize="10" borderRadius="md" />}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          style={{ display: 'inline-block' }}
          key={useColorModeValue('light', 'dark')}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <IconButton
            aria-label="Toggle theme"
            colorPalette={useColorModeValue('purple', 'orange')}
            onClick={toggleColorMode}
          >
            {useColorModeValue(<IoMoon />, <IoSunny />)}
          </IconButton>
        </motion.div>
      </AnimatePresence>
    </ClientOnly>
  )
}

export default ThemeToggleButton
