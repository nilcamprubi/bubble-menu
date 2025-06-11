import { BubbleTheme } from '../types/styles';

export const defaultTheme: BubbleTheme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    text: '#000000',
    border: '#E5E5EA',
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
  },
  typography: {
    fontSize: {
      small: 12,
      medium: 16,
      large: 20,
    },
    fontWeight: {
      normal: '400',
      bold: '600',
    },
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
  },
}; 