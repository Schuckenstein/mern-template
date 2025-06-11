// client/src/pages/auth/Register.tsx

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
  Divider,
  Link,
  Alert,
  AlertIcon,
  Progress,
  useColorModeValue
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FaGoogle, FaGithub } from 'react-icons/fa'
import { Helmet } from 'react-helmet-async'

import { useAuth } from '@/hooks/useAuth'
import { validateEmail, validatePassword } from '@/utils/validation'
import { authService } from '@/services/authService'
import { RegisterCredentials } from '@shared/types'

interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

const RegisterPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<RegisterFormData>()

  const watchedPassword = watch('password')

  const getPasswordStrength = (password: string): number => {
    const { isValid, errors } = validatePassword(password)
    return isValid ? 100 : Math.max(0, (5 - errors.length) * 20)
  }

  const getPasswordColor = (strength: number): string => {
    if (strength < 40) return 'red'
    if (strength < 80) return 'orange'
    return 'green'
  }

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true)
      setAuthError(null)

      const credentials: RegisterCredentials = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password
      }

      await registerUser(credentials)
      navigate('/dashboard')
    } catch (error: any) {
      setAuthError(error.message || 'Registration failed')
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
        <title>Sign Up - MERN Template</title>
        <meta name="description" content="Create your account" />
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
                Create your account
              </Heading>
              <Text color="gray.600" textAlign="center">
                Get started with your free account
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
                Sign up with Google
              </Button>
              <Button
                leftIcon={<FaGithub />}
                variant="outline"
                size="lg"
                w="full"
                onClick={() => handleOAuthLogin('github')}
              >
                Sign up with GitHub
              </Button>
            </VStack>

            <HStack>
              <Divider />
              <Text fontSize="sm" color="gray.500" px={3}>
                OR
              </Text>
              <Divider />
            </HStack>

            {/* Registration Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <VStack spacing={4}>
                <HStack spacing={4}>
                  <FormControl isInvalid={!!errors.firstName}>
                    <FormLabel>First name</FormLabel>
                    <Input
                      placeholder="First name"
                      {...register('firstName', {
                        required: 'First name is required',
                        minLength: {
                          value: 2,
                          message: 'First name must be at least 2 characters'
                        }
                      })}
                    />
                    <FormErrorMessage>{errors.firstName?.message}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.lastName}>
                    <FormLabel>Last name</FormLabel>
                    <Input
                      placeholder="Last name"
                      {...register('lastName', {
                        required: 'Last name is required',
                        minLength: {
                          value: 2,
                          message: 'Last name must be at least 2 characters'
                        }
                      })}
                    />
                    <FormErrorMessage>{errors.lastName?.message}</FormErrorMessage>
                  </FormControl>
                </HStack>

                <FormControl isInvalid={!!errors.email}>
                  <FormLabel>Email address</FormLabel>
                  <Input
                    type="email"
                    placeholder="Enter your email"
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
                    placeholder="Create a password"
                    {...register('password', {
                      required: 'Password is required',
                      validate: (value) => {
                        const { isValid, errors: validationErrors } = validatePassword(value)
                        return isValid || validationErrors[0]
                      }
                    })}
                  />
                  {watchedPassword && (
                    <VStack mt={2} spacing={1} align="stretch">
                      <Progress
                        value={getPasswordStrength(watchedPassword)}
                        size="sm"
                        colorScheme={getPasswordColor(getPasswordStrength(watchedPassword))}
                      />
                      <Text fontSize="xs" color="gray.500">
                        Password strength: {getPasswordStrength(watchedPassword) >= 80 ? 'Strong' : 
                          getPasswordStrength(watchedPassword) >= 40 ? 'Medium' : 'Weak'}
                      </Text>
                    </VStack>
                  )}
                  <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.confirmPassword}>
                  <FormLabel>Confirm password</FormLabel>
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => value === watchedPassword || 'Passwords do not match'
                    })}
                  />
                  <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
                </FormControl>

                <Button
                  type="submit"
                  size="lg"
                  w="full"
                  isLoading={isLoading}
                  loadingText="Creating account..."
                >
                  Create account
                </Button>
              </VStack>
            </form>

            {/* Sign in link */}
            <Text textAlign="center" color="gray.600">
              Already have an account?{' '}
              <Link as={RouterLink} to="/auth/login" color="brand.500" fontWeight="semibold">
                Sign in
              </Link>
            </Text>
          </VStack>
        </Box>
      </Container>
    </>
  )
}

export default RegisterPage