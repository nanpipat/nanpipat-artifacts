import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode } from 'react'
import { Box, Container, Flex, Heading, HStack, Link as ChakraLink } from '@chakra-ui/react'
import { IoCubeOutline } from 'react-icons/io5'
import { useColorModeValue } from './ui/color-mode'
import ThemeToggleButton from './theme-toggle-button'

const NavLink = ({ href, children }: { href: string; children: ReactNode }) => {
  const router = useRouter()
  const active = router.pathname.startsWith(href)
  const color = useColorModeValue('gray.600', 'whiteAlpha.700')
  const activeColor = useColorModeValue('teal.600', 'teal.300')
  return (
    <ChakraLink
      as={Link}
      href={href}
      fontWeight={active ? 'bold' : 'medium'}
      color={active ? activeColor : color}
      _hover={{ color: activeColor }}
    >
      {children}
    </ChakraLink>
  )
}

const Navbar = () => {
  const bg = useColorModeValue('#ffffff40', '#20202380')
  const logoColor = useColorModeValue('gray.800', 'whiteAlpha.900')
  return (
    <Box
      position="fixed"
      as="nav"
      w="100%"
      bg={bg}
      style={{ backdropFilter: 'blur(10px)' }}
      zIndex={1}
    >
      <Container
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        p={2}
        maxW="1100px"
      >
        <Flex justify="center" align="center">
          <Heading as="h1" size="lg" letterSpacing="tighter">
            <ChakraLink as={Link} href="/" _hover={{ textDecoration: 'none' }}>
              <HStack gap={1} color={logoColor}>
                <IoCubeOutline aria-hidden />
                <Box as="span" fontWeight="bold">Artifacts</Box>
              </HStack>
            </ChakraLink>
          </Heading>
        </Flex>
        <HStack gap={5} alignItems="center">
          <NavLink href="/articles">Articles</NavLink>
          <NavLink href="/courses">Courses</NavLink>
          <ThemeToggleButton />
        </HStack>
      </Container>
    </Box>
  )
}

export default Navbar
