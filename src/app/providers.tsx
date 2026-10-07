import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { AuthProvider } from '../features/auth/model/AuthProvider.tsx'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0F766E',
      dark: '#115E59',
      light: '#14B8A6',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#1E3A5F',
      dark: '#152A45',
      light: '#334E72',
    },
    background: {
      default: '#F4F7F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#14212B',
      secondary: '#5B6B76',
    },
    divider: '#D7E0E6',
    success: {
      main: '#15803D',
    },
  },
  typography: {
    fontFamily: '"Source Sans 3", "Segoe UI", sans-serif',
    h4: {
      fontFamily: '"IBM Plex Sans", "Source Sans 3", sans-serif',
      fontWeight: 650,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontFamily: '"IBM Plex Sans", "Source Sans 3", sans-serif',
      fontWeight: 650,
      letterSpacing: '-0.02em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
})

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  )
}
