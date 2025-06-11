// client/src/components/ErrorBoundary.tsx

import React from 'react'
import {
  Box,
  Button,
  VStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code
} from '@chakra-ui/react'
import { FallbackProps } from 'react-error-boundary'

export const ErrorFallback: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary
}) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="100vh"
      bg="gray.50"
      _dark={{ bg: "gray.900" }}
      p={4}
    >
      <VStack spacing={6} maxW="md" textAlign="center">
        <Alert status="error" flexDirection="column" textAlign="center" borderRadius="lg">
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Oops! Something went wrong
          </AlertTitle>
          <AlertDescription maxW="sm">
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </AlertDescription>
        </Alert>

        {import.meta.env.DEV && (
          <Box w="full" p={4} bg="red.50" borderRadius="md" border="1px" borderColor="red.200">
            <Text fontSize="sm" fontWeight="bold" mb={2} color="red.800">
              Error Details (Dev Mode):
            </Text>
            <Code p={2} fontSize="xs" whiteSpace="pre-wrap" w="full" display="block">
              {error.message}
            </Code>
          </Box>
        )}

        <Button onClick={resetErrorBoundary} colorScheme="blue" size="lg">
          Try Again
        </Button>
      </VStack>
    </Box>
  )
}

// =============================================