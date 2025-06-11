// client/src/theme/index.ts
import { extendTheme, type ThemeConfig } from '@chakra-ui/react'
import { colors } from './colors'
import { components } from './components'
import { fonts } from './fonts'
import { styles } from './styles'

const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: true,
  disableTransitionOnChange: false
}

export const theme = extendTheme({
  config,
  colors,
  fonts,
  styles,
  components,
  semanticTokens: {
    colors: {
      'chakra-body-text': {
        _light: 'gray.800',
        _dark: 'whiteAlpha.900'
      },
      'chakra-body-bg': {
        _light: 'white',
        _dark: 'gray.800'
      },
      'chakra-border-color': {
        _light: 'gray.200',
        _dark: 'whiteAlpha.300'
      },
      'chakra-subtle-bg': {
        _light: 'gray.100',
        _dark: 'gray.700'
      },
      'chakra-subtle-text': {
        _light: 'gray.600',
        _dark: 'gray.400'
      }
    }
  },
  space: {
    '4.5': '1.125rem',
    '5.5': '1.375rem',
    '6.5': '1.625rem',
    '7.5': '1.875rem'
  },
  sizes: {
    'container.2xl': '1400px'
  }
})