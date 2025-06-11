// client/src/components/Logo.tsx

import React from 'react'
import { Box, Text, useColorModeValue } from '@chakra-ui/react'

export const Logo: React.FC = () => {
  const textColor = useColorModeValue('blue.500', 'blue.300')

  return (
    <Box>
      <Text
        fontSize="xl"
        fontWeight="bold"
        color={textColor}
        letterSpacing="tight"
      >
        MERN Template
      </Text>
    </Box>
  )
}