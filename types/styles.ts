import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

export interface BubbleStyles {
  container: ViewStyle;
  circle: ViewStyle;
  text: TextStyle;
  icon?: ImageStyle;
}

export interface BubbleMenuStyles {
  container: ViewStyle;
  centerBubble: ViewStyle;
  menuBubbleContainer: ViewStyle;
  bubble: BubbleStyles;
}

export interface BubbleTheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    border: string;
  };
  spacing: {
    small: number;
    medium: number;
    large: number;
  };
  typography: {
    fontSize: {
      small: number;
      medium: number;
      large: number;
    };
    fontWeight: {
      normal: string;
      bold: string;
    };
  };
  shadows: {
    small: ViewStyle;
    medium: ViewStyle;
    large: ViewStyle;
  };
} 