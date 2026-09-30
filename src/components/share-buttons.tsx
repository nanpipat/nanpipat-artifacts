'use client'

import { useState } from 'react'
import { HStack, IconButton } from '@chakra-ui/react'
import {
  IoCheckmarkOutline,
  IoLinkOutline,
  IoLogoFacebook,
  IoLogoLinkedin,
  IoLogoTwitter,
} from 'react-icons/io5'
import { FaLine } from 'react-icons/fa'
import { useColorModeValue } from './ui/color-mode'

interface ShareButtonsProps {
  /** in-site path, e.g. /articles/<slug> — combined with window.location.origin */
  path: string
}

const ShareButtons = ({ path }: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false)
  const muted = useColorModeValue('gray.600', 'whiteAlpha.700')

  const getUrl = () =>
    typeof window !== 'undefined'
      ? `${window.location.origin}${path}`
      : `https://artifacts.nanpipat.top${path}`

  const share = (kind: 'x' | 'facebook' | 'linkedin' | 'line') => {
    const url = encodeURIComponent(getUrl())
    const target =
      kind === 'x'
        ? `https://twitter.com/intent/tweet?url=${url}`
        : kind === 'facebook'
          ? `https://www.facebook.com/sharer/sharer.php?u=${url}`
          : kind === 'linkedin'
            ? `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
            : `https://social-plugins.line.me/lineit/share?url=${url}`
    window.open(target, '_blank', 'noopener,noreferrer,width=640,height=560')
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(getUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <HStack gap={2} alignItems="center">
      <IconButton
        aria-label={copied ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์'}
        title={copied ? 'คัดลอกลิงก์แล้ว!' : 'คัดลอกลิงก์'}
        size="sm"
        variant="outline"
        onClick={copy}
        color={copied ? 'teal.500' : muted}
        borderColor={copied ? 'teal.500' : undefined}
      >
        {copied ? <IoCheckmarkOutline /> : <IoLinkOutline />}
      </IconButton>
      <IconButton
        aria-label="Share on X"
        title="แชร์ไป X"
        size="sm"
        variant="ghost"
        onClick={() => share('x')}
        color={muted}
      >
        <IoLogoTwitter />
      </IconButton>
      <IconButton
        aria-label="Share on Facebook"
        title="แชร์ไป Facebook"
        size="sm"
        variant="ghost"
        onClick={() => share('facebook')}
        color={muted}
      >
        <IoLogoFacebook />
      </IconButton>
      <IconButton
        aria-label="Share on LinkedIn"
        title="แชร์ไป LinkedIn"
        size="sm"
        variant="ghost"
        onClick={() => share('linkedin')}
        color={muted}
      >
        <IoLogoLinkedin />
      </IconButton>
      <IconButton
        aria-label="Share on LINE"
        title="แชร์ไป LINE"
        size="sm"
        variant="ghost"
        onClick={() => share('line')}
        color="#06c755"
      >
        <FaLine />
      </IconButton>
    </HStack>
  )
}

export default ShareButtons
