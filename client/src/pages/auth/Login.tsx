// client/src/pages/auth/Login.tsx
import React, { useState } from 'react'
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Checkbox,
  Divider,
  Link,
  Alert,
  AlertIcon,
  useColorModeValue
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FaGoogle, FaGithub } from 'react-icons/fa'
import { Helmet } from 'react-helmet-async'

import { useAuth } from '@/hooks/useAuth'
import { validateEmail } from '@/utils/validation'
import { authService } from '@/services/authService'
import { LoginCredentials } from '@shared/types'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || '/dashboard'

  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<LoginFormData>({
    defaultValues: {
      rememberMe: false
    }
  })

  const watchedEmail = watch('email')

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true)
      setAuthError(null)

      const credentials: LoginCredentials = {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe
      }

      await login(credentials)
      navigate(from, { replace: true })
    } catch (error: any) {
      setAuthError(error.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    const authUrl = provider === 'google' 
      ? authService.getGoogleAuthUrl() 
      : authService.getGitHubAuthUrl()
    
    window.location.href = authUrl
  }

  return (
    <>
      <Helmet>
        <title>Login - MERN Template</title>
        <meta name="description" content="Sign in to your account" />
      </Helmet>

      <Container maxW="md" py={12}>
        <Box
          bg={bg}
          p={8}
          borderRadius="xl"
          boxShadow="lg"
          border="1px"
          borderColor={borderColor}
        >
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <VStack spacing={2}>
              <Heading size="lg" textAlign="center">
                Welcome back
              </Heading>
              <Text color="gray.600" textAlign="center">
                Sign in to your account to continue
              </Text>
            </VStack>

            {/* Error Alert */}
            {authError && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {authError}
              </Alert>
            )}

            {/* OAuth Buttons */}
            <VStack spacing={3}>
              <Button
                leftIcon={<FaGoogle />}
                variant="outline"
                size="lg"
                w="full"
                onClick={() => handleOAuthLogin('google')}
              >
                Continue with Google
              </Button>
              <Button
                leftIcon={<FaGithub />}
                variant="outline"
                size="lg"
                w="full"
                onClick={() => handleOAuthLogin('github')}
              >
                Continue with GitHub
              </Button>
            </VStack>

            <HStack>
              <Divider />
              <Text fontSize="sm" color="gray.500" px={3}>
                OR
              </Text>
              <Divider />
            </HStack>

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.email}>
                  <FormLabel>Email address</FormLabel>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    size="lg"
                    {...register('email', {
                      required: 'Email is required',
                      validate: (value) => validateEmail(value) || 'Invalid email address'
                    })}
                  />
                  <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.password}>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    size="lg"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                  />
                  <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
                </FormControl>

                <HStack w="full" justify="space-between">
                  <Checkbox {...register('rememberMe')}>
                    Remember me
                  </Checkbox>
                  <Link as={RouterLink} to="/auth/forgot-password" color="brand.500">
                    Forgot password?
                  </Link>
                </HStack>

                <Button
                  type="submit"
                  size="lg"
                  w="full"
                  isLoading={isLoading}
                  loadingText="Signing in..."
                >
                  Sign in
                </Button>
              </VStack>
            </form>

            {/* Sign up link */}
            <Text textAlign="center" color="gray.600">
              Don't have an account?{' '}
              <Link as={RouterLink} to="/auth/register" color="brand.500" fontWeight="semibold">
                Sign up
              </Link>
            </Text>
          </VStack>
        </Box>
      </Container>
    </>
  )
}

export default LoginPage