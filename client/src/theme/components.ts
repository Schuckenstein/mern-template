// client/src/theme/components.ts

import { ComponentStyleConfig } from '@chakra-ui/react'

const Button: ComponentStyleConfig = {
  baseStyle: {
    fontWeight: 'semibold',
    borderRadius: 'md',
    _focus: {
      boxShadow: 'outline'
    }
  },
  sizes: {
    sm: {
      fontSize: 'sm',
      px: 4,
      py: 2
    },
    md: {
      fontSize: 'md',
      px: 6,
      py: 3
    },
    lg: {
      fontSize: 'lg',
      px: 8,
      py: 4
    }
  },
  variants: {
    solid: (props: any) => ({
      bg: `${props.colorScheme}.500`,
      color: 'white',
      _hover: {
        bg: `${props.colorScheme}.600`,
        _disabled: {
          bg: `${props.colorScheme}.500`
        }
      },
      _active: {
        bg: `${props.colorScheme}.700`
      }
    }),
    outline: (props: any) => ({
      border: '2px solid',
      borderColor: `${props.colorScheme}.500`,
      color: `${props.colorScheme}.500`,
      _hover: {
        bg: `${props.colorScheme}.50`,
        _dark: {
          bg: `${props.colorScheme}.900`
        }
      },
      _active: {
        bg: `${props.colorScheme}.100`,
        _dark: {
          bg: `${props.colorScheme}.800`
        }
      }
    }),
    ghost: (props: any) => ({
      color: `${props.colorScheme}.500`,
      _hover: {
        bg: `${props.colorScheme}.50`,
        _dark: {
          bg: `${props.colorScheme}.900`
        }
      },
      _active: {
        bg: `${props.colorScheme}.100`,
        _dark: {
          bg: `${props.colorScheme}.800`
        }
      }
    })
  },
  defaultProps: {
    colorScheme: 'brand'
  }
}

const Input: ComponentStyleConfig = {
  baseStyle: {
    field: {
      borderRadius: 'md',
      _focus: {
        borderColor: 'brand.500',
        boxShadow: '0 0 0 1px brand.500'
      }
    }
  },
  variants: {
    outline: {
      field: {
        border: '2px solid',
        borderColor: 'gray.200',
        _dark: {
          borderColor: 'whiteAlpha.300'
        },
        _hover: {
          borderColor: 'gray.300',
          _dark: {
            borderColor: 'whiteAlpha.400'
          }
        },
        _focus: {
          borderColor: 'brand.500',
          boxShadow: '0 0 0 1px brand.500'
        }
      }
    }
  },
  defaultProps: {
    variant: 'outline'
  }
}

const Textarea: ComponentStyleConfig = {
  baseStyle: {
    borderRadius: 'md',
    _focus: {
      borderColor: 'brand.500',
      boxShadow: '0 0 0 1px brand.500'
    }
  },
  variants: {
    outline: {
      border: '2px solid',
      borderColor: 'gray.200',
      _dark: {
        borderColor: 'whiteAlpha.300'
      },
      _hover: {
        borderColor: 'gray.300',
        _dark: {
          borderColor: 'whiteAlpha.400'
        }
      },
      _focus: {
        borderColor: 'brand.500',
        boxShadow: '0 0 0 1px brand.500'
      }
    }
  },
  defaultProps: {
    variant: 'outline'
  }
}

const Card: ComponentStyleConfig = {
  baseStyle: {
    container: {
      borderRadius: 'xl',
      bg: 'white',
      _dark: {
        bg: 'gray.700'
      },
      boxShadow: 'sm',
      border: '1px solid',
      borderColor: 'gray.200',
      _dark: {
        borderColor: 'whiteAlpha.300'
      }
    },
    body: {
      p: 6
    },
    header: {
      p: 6,
      pb: 0
    },
    footer: {
      p: 6,
      pt: 0
    }
  }
}

const Modal: ComponentStyleConfig = {
  baseStyle: {
    dialog: {
      borderRadius: 'xl',
      bg: 'white',
      _dark: {
        bg: 'gray.800'
      }
    }
  }
}

const Drawer: ComponentStyleConfig = {
  baseStyle: {
    dialog: {
      bg: 'white',
      _dark: {
        bg: 'gray.800'
      }
    }
  }
}

const Menu: ComponentStyleConfig = {
  baseStyle: {
    list: {
      borderRadius: 'md',
      border: '1px solid',
      borderColor: 'gray.200',
      _dark: {
        borderColor: 'whiteAlpha.300',
        bg: 'gray.700'
      },
      boxShadow: 'lg'
    },
    item: {
      _hover: {
        bg: 'gray.100',
        _dark: {
          bg: 'gray.600'
        }
      },
      _focus: {
        bg: 'gray.100',
        _dark: {
          bg: 'gray.600'
        }
      }
    }
  }
}

const Tooltip: ComponentStyleConfig = {
  baseStyle: {
    borderRadius: 'md',
    bg: 'gray.700',
    color: 'white',
    _dark: {
      bg: 'gray.300',
      color: 'gray.800'
    }
  }
}

const Alert: ComponentStyleConfig = {
  baseStyle: {
    container: {
      borderRadius: 'md'
    }
  },
  variants: {
    subtle: (props: any) => ({
      container: {
        bg: `${props.colorScheme}.50`,
        _dark: {
          bg: `${props.colorScheme}.900`
        }
      }
    }),
    'left-accent': (props: any) => ({
      container: {
        borderLeft: '4px solid',
        borderColor: `${props.colorScheme}.500`,
        bg: `${props.colorScheme}.50`,
        _dark: {
          bg: `${props.colorScheme}.900`
        }
      }
    }),
    'top-accent': (props: any) => ({
      container: {
        borderTop: '4px solid',
        borderColor: `${props.colorScheme}.500`,
        bg: `${props.colorScheme}.50`,
        _dark: {
          bg: `${props.colorScheme}.900`
        }
      }
    }),
    solid: (props: any) => ({
      container: {
        bg: `${props.colorScheme}.500`,
        color: 'white'
      }
    })
  }
}

const Badge: ComponentStyleConfig = {
  baseStyle: {
    borderRadius: 'md',
    fontWeight: 'semibold',
    fontSize: 'xs',
    px: 2,
    py: 1
  },
  variants: {
    solid: (props: any) => ({
      bg: `${props.colorScheme}.500`,
      color: 'white'
    }),
    subtle: (props: any) => ({
      bg: `${props.colorScheme}.100`,
      color: `${props.colorScheme}.800`,
      _dark: {
        bg: `${props.colorScheme}.900`,
        color: `${props.colorScheme}.200`
      }
    }),
    outline: (props: any) => ({
      border: '1px solid',
      borderColor: `${props.colorScheme}.500`,
      color: `${props.colorScheme}.500`
    })
  }
}

export const components = {
  Button,
  Input,
  Textarea,
  Card,
  Modal,
  Drawer,
  Menu,
  Tooltip,
  Alert,
  Badge
}