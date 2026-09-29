import { Box, Button, HStack, Icon, Text } from '@chakra-ui/react'
import { useColorModeValue } from '@/components/ui/color-mode'
import { IoDownloadOutline, IoExpandOutline } from 'react-icons/io5'
import Link from 'next/link'
import type { Deck } from '../lib/content'

interface DeckPreviewProps {
  courseSlug: string
  deck: Deck
}

const DeckPreview = ({ courseSlug, deck }: DeckPreviewProps) => {
  const border = useColorModeValue('gray.200', 'whiteAlpha.200')
  const muted = useColorModeValue('gray.500', 'whiteAlpha.600')

  return (
    <Box borderWidth="1px" borderColor={border} borderRadius="lg" overflow="hidden">
      <Box css={{ aspectRatio: '16 / 9' }} position="relative" bg="white">
        <iframe
          src={deck.url}
          title={deck.title}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            border: 0,
            pointerEvents: 'none',
          }}
        />
        <Box asChild position="absolute" inset={0}>
          <Link
            href={`/courses/${courseSlug}/slides/${deck.id}`}
            aria-label={`Open slides: ${deck.title}`}
          />
        </Box>
      </Box>
      <HStack
        p={3}
        justify="space-between"
        flexWrap="wrap"
        gap={2}
        borderTopWidth="1px"
        borderTopColor={border}
      >
        <Box>
          <Text fontWeight="bold" fontSize="sm">
            {deck.title}
          </Text>
          <Text fontSize="xs" color={muted}>
            {deck.slides} slides · {deck.file}
          </Text>
        </Box>
        <HStack gap={2}>
          <Button asChild size="xs" variant="ghost" colorPalette="teal">
            <Link href={deck.url} target="_blank">
              <Icon as={IoDownloadOutline} />
              HTML
            </Link>
          </Button>
          <Button asChild size="xs" colorPalette="teal">
            <Link href={`/courses/${courseSlug}/slides/${deck.id}`}>
              <Icon as={IoExpandOutline} />
              Open slides
            </Link>
          </Button>
        </HStack>
      </HStack>
    </Box>
  )
}

export default DeckPreview
