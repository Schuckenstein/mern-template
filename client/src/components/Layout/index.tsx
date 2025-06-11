// client/src/components/Layout/index.tsx

import React from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Container, Flex } from '@chakra-ui/react'

import { Header } from './Header'
import { Footer } from './Footer'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '@/stores/authStore'

export const Layout: React.FC = () => {
  const { user } = useAuthStore()

  return (
    <Flex direction="column" minH="100vh">
      <Header />
      
      <Flex flex="1">
        {user && <Sidebar />}
        
        <Box flex="1" as="main">
          <Container maxW="7xl" py={8}>
            <Outlet />
          </Container>
        </Box>
      </Flex>
      
      <Footer />
    </Flex>
  )
}

// =============================================