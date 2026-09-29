import Head from 'next/head'
import { ReactNode } from 'react'
import Navbar from '../navbar'
import { Box, Container } from '@chakra-ui/react'
import Footer from '../footer'

interface MainProps {
  children: ReactNode
  /** container max width, defaults to 1100px; use e.g. "768px" for reading pages */
  width?: string
  title?: string
  description?: string
}

const Main = ({ children, width = '1100px', title, description }: MainProps) => {
  return (
    <Box as="main" pb={8}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={description ?? 'Articles, courses and slides by Nanpipat Klinpratoom'} />
        {title ? <title>{title}</title> : <title>Artifacts - Nanpipat Klinpratoom</title>}
      </Head>

      <Navbar />

      <Container maxW={width} pt={20}>
        <Box position="relative" zIndex={1}>{children}</Box>
        <Footer />
      </Container>
    </Box>
  )
}

export default Main
