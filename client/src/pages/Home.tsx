// client/src/pages/Home.tsx

import React from 'react'
import {
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Box,
  Grid,
  GridItem,
  Card,
  CardBody,
  useColorModeValue,
  Icon
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { FiShield, FiDatabase, FiZap, FiCode, FiGlobe, FiUsers } from 'react-icons/fi'

import { useAuth } from '@/hooks/useAuth'

const HomePage: React.FC = () => {
  const { user } = useAuth()
  const cardBg = useColorModeValue('white', 'gray.800')

  const features = [
    {
      icon: FiShield,
      title: 'Secure Authentication',
      description: 'JWT-based auth with OAuth integration (Google, GitHub) and email verification.'
    },
    {
      icon: FiDatabase,
      title: 'Modern Database',
      description: 'MongoDB with Prisma ORM for type-safe database operations and migrations.'
    },
    {
      icon: FiZap,
      title: 'Fast Development',
      description: 'Hot reloading, TypeScript, and comprehensive debugging tools included.'
    },
    {
      icon: FiCode,
      title: 'Best Practices',
      description: 'ESLint, Prettier, testing setup, and production-ready configuration.'
    },
    {
      icon: FiGlobe,
      title: 'API Ready',
      description: 'REST APIs with GraphQL support, file uploads, and email services.'
    },
    {
      icon: FiUsers,
      title: 'User Management',
      description: 'Complete user profiles, role-based access, and account management.'
    }
  ]

  return (
    <>
      <Helmet>
        <title>MERN Template - Full Stack Starter</title>
        <meta name="description" content="A comprehensive MERN stack template with authentication, file uploads, and debugging tools" />
      </Helmet>

      <Container maxW="7xl" py={16}>
        <VStack spacing={16} align="stretch">
          {/* Hero Section */}
          <VStack spacing={8} textAlign="center" py={16}>
            <Heading
              size="2xl"
              bgGradient="linear(to-r, brand.400, brand.600)"
              bgClip="text"
              maxW="4xl"
            >
              Full-Stack MERN Template
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl">
              A production-ready MERN stack template with authentication, file uploads, 
              email services, and comprehensive debugging tools.
            </Text>
            <HStack spacing={4}>
              {!user ? (
                <>
                  <Button as={RouterLink} to="/auth/register" size="lg" colorScheme="brand">
                    Get Started
                  </Button>
                  <Button as={RouterLink} to="/auth/login" variant="outline" size="lg">
                    Sign In
                  </Button>
                </>
              ) : (
                <Button as={RouterLink} to="/dashboard" size="lg" colorScheme="brand">
                  Go to Dashboard
                </Button>
              )}
            </HStack>
          </VStack>

          {/* Features Grid */}
          <Box>
            <VStack spacing={8} mb={12}>
              <Heading size="lg" textAlign="center">
                Everything you need to build modern web applications
              </Heading>
              <Text fontSize="lg" color="gray.600" textAlign="center" maxW="3xl">
                This template includes all the essential features and best practices 
                for building scalable full-stack applications.
              </Text>
            </VStack>

            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
              {features.map((feature, index) => (
                <GridItem key={index}>
                  <Card bg={cardBg} h="full" transition="transform 0.2s" _hover={{ transform: 'translateY(-4px)' }}>
                    <CardBody>
                      <VStack spacing={4} align="start">
                        <Box p={3} bg="brand.50" borderRadius="lg" _dark={{ bg: 'brand.900' }}>
                          <Icon as={feature.icon} w={6} h={6} color="brand.500" />
                        </Box>
                        <Heading size="md">{feature.title}</Heading>
                        <Text color="gray.600">{feature.description}</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </GridItem>
              ))}
            </Grid>
          </Box>

          {/* Tech Stack */}
          <Box>
            <VStack spacing={8} textAlign="center">
              <Heading size="lg">Built with Modern Technologies</Heading>
              <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={8} w="full">
                {['React', 'Node.js', 'MongoDB', 'TypeScript'].map((tech) => (
                  <Box key={tech} p={6} bg={cardBg} borderRadius="lg" boxShadow="sm">
                    <Text fontWeight="semibold" fontSize="lg">{tech}</Text>
                  </Box>
                ))}
              </Grid>
            </VStack>
          </Box>

          {/* CTA Section */}
          {!user && (
            <Box textAlign="center" py={16}>
              <VStack spacing={6}>
                <Heading size="lg">Ready to get started?</Heading>
                <Text fontSize="lg" color="gray.600">
                  Create your account and start building amazing applications today.
                </Text>
                <Button as={RouterLink} to="/auth/register" size="lg" colorScheme="brand">
                  Sign Up Now
                </Button>
              </VStack>
            </Box>
          )}
        </VStack>
      </Container>
    </>
  )
}

export default HomePage