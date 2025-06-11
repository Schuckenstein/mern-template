// client/src/components/LoadingSpinner.tsx

import React from 'react'
import { Box, Spinner, VStack, Text } from '@chakra-ui/react'

interface LoadingSpinnerProps {
  message?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'xl' 
}) => {
  return (
    <Box 
      display="flex" 
      alignItems="center" 
      justifyContent="center" 
      minH="100vh"
      bg="gray.50"
      _dark={{ bg: "gray.900" }}
    >
      <VStack spacing={4}>
        <Spinner size={size} color="blue.500" thickness="4px" />
        <Text color="gray.600" _dark={{ color: "gray.400" }}>
          {message}
        </Text>
      </VStack>
    </Box>
  )
}

// =============================================