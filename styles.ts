import { StyleSheet, Dimensions } from 'react-native';

export const styles = StyleSheet.create({
  // App styles
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Bubble styles
  bubbleContainer: {
    position: 'absolute',
  },
  circle: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    color: '#333',
  },

  // BubbleMenu styles
  menuContainer: {
    flex: 1,
  },
  centerBubble: {
    position: 'absolute',
  },
  menuBubbleContainer: {
    position: 'absolute',
  },
}); 