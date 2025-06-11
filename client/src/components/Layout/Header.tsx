// client/src/components/Layout/Header.tsx

import React from 'react'
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorModeValue,
  useColorMode,
  Avatar,
  Text,
  useDisclosure
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { HamburgerIcon, CloseIcon, SunIcon, MoonIcon } from '@chakra-ui/icons'

import { useAuthStore } from '@/stores/authStore'
import { Logo } from '@/components/Logo'

export const Header: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { colorMode, toggleColorMode } = useColorMode()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <Box bg={bg} borderBottom="1px" borderColor={borderColor} position="sticky" top={0} zIndex={1000}>
      <Flex h={16} alignItems="center" justifyContent="space-between" maxW="7xl" mx="auto" px={4}>
        {/* Logo */}
        <RouterLink to="/">
          <Logo />
        </RouterLink>

        {/* Desktop Navigation */}
        <HStack spacing={8} alignItems="center" display={{ base: 'none', md: 'flex' }}>
          {!user ? (
            // Guest Navigation
            <HStack spacing={4}>
              <Button as={RouterLink} to="/auth/login" variant="ghost">
                Login
              </Button>
              <Button as={RouterLink} to="/auth/register" colorScheme="blue">
                Sign Up
              </Button>
            </HStack>
          ) : (
            // User Navigation
            <HStack spacing={4}>
              <IconButton
                aria-label="Toggle color mode"
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                variant="ghost"
                size="sm"
              />

              <Menu>
                <MenuButton as={Button} variant="ghost" rightIcon={<Avatar size="sm" src={user.avatar} />}>
                  <Text fontSize="sm" fontWeight="medium">
                    {user.firstName || user.email}
                  </Text>
                </MenuButton>
                <MenuList>
                  <MenuItem as={RouterLink} to="/dashboard">
                    Dashboard
                  </MenuItem>
                  <MenuItem as={RouterLink} to="/profile">
                    Profile
                  </MenuItem>
                  <MenuItem as={RouterLink} to="/settings">
                    Settings
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem onClick={handleLogout} color="red.500">
                    Logout
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          )}
        </HStack>

        {/* Mobile menu button */}
        <IconButton
          size="md"
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label="Open Menu"
          display={{ md: 'none' }}
          onClick={isOpen ? onClose : onOpen}
        />
      </Flex>

      {/* Mobile Navigation */}
      {isOpen && (
        <Box pb={4} display={{ md: 'none' }} bg={bg} borderTop="1px" borderColor={borderColor}>
          {!user ? (
            <VStack spacing={1} align="stretch" px={4}>
              <Button as={RouterLink} to="/auth/login" variant="ghost" justifyContent="flex-start">
                Login
              </Button>
              <Button as={RouterLink} to="/auth/register" variant="ghost" justifyContent="flex-start">
                Sign Up
              </Button>
            </VStack>
          ) : (
            <VStack spacing={1} align="stretch" px={4}>
              <Button as={RouterLink} to="/dashboard" variant="ghost" justifyContent="flex-start">
                Dashboard
              </Button>
              <Button as={RouterLink} to="/profile" variant="ghost" justifyContent="flex-start">
                Profile
              </Button>
              <Button as={RouterLink} to="/settings" variant="ghost" justifyContent="flex-start">
                Settings
              </Button>
              <Button onClick={handleLogout} variant="ghost" justifyContent="flex-start" color="red.500">
                Logout
              </Button>
            </VStack>
          )}
        </Box>
      )}
    </Box>
  )
}

// =============================================