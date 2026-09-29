import { Box, Image } from '@chakra-ui/react'
import { IoBookOutline } from 'react-icons/io5'
import { useColorModeValue } from './ui/color-mode'

interface CoverProps {
  src?: string | null
  alt: string
  /** icon shown on the fallback tile when no cover image exists */
  fallbackIcon?: React.ElementType
}

const Cover = ({ src, alt, fallbackIcon: FallbackIcon = IoBookOutline }: CoverProps) => {
  const fallbackBg = useColorModeValue(
    'linear-gradient(135deg, #88ccca 0%, #3d7aed 100%)',
    'linear-gradient(135deg, #2b4a44 0%, #23233a 100%)'
  )

  return (
    <Box css={{ aspectRatio: '16 / 9' }} position="relative" overflow="hidden" bg={fallbackBg}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          w="100%"
          h="100%"
          objectFit="cover"
          display="block"
          loading="lazy"
        />
      ) : (
        <Box
          position="absolute"
          inset={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <FallbackIcon aria-hidden size="3.5rem" opacity={0.5} color="white" />
        </Box>
      )}
    </Box>
  )
}

export default Cover
