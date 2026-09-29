import { Box } from '@chakra-ui/react'

const Footer = () => {
  return (
    <Box textAlign="center" opacity={0.4} fontSize="sm" mt={16}>
      &copy; {new Date().getFullYear()} Nanpipat Klinpratoom. All Rights Reserved.
    </Box>
  )
}

export default Footer
