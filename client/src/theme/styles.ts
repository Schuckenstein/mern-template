// client/src/theme/styles.ts

export const styles = {
  global: (props: any) => ({
    body: {
      fontFamily: 'body',
      color: props.colorMode === 'dark' ? 'whiteAlpha.900' : 'gray.800',
      bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
      lineHeight: 'base'
    },
    '*::placeholder': {
      color: props.colorMode === 'dark' ? 'whiteAlpha.400' : 'gray.400'
    },
    '*, *::before, &::after': {
      borderColor: props.colorMode === 'dark' ? 'whiteAlpha.300' : 'gray.200',
      wordWrap: 'break-word'
    },
    'html, body': {
      height: '100%'
    },
    '#root': {
      height: '100%'
    }
  })
}