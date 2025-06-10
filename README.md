# BubbleMenu Component

A dynamic, interactive circular menu component for React Native that displays items in a wheel formation with smooth animations and collision detection.

## Features

- Circular menu layout with customizable radius
- Drag and drop functionality for menu items
- Collision detection between bubbles
- Smooth animations and transitions
- Support for icons and text
- Responsive design that adapts to screen size
- Automatic repositioning of bubbles

## Installation

```bash
npm install bubble-menu
# or
yarn add bubble-menu
```

## Usage

```typescript
import { View } from 'react-native';
import BubbleMenu from 'bubble-menu';
import type { BubbleProps } from 'bubble-menu';

const menuItems: BubbleProps[] = [
  { 
    label: "Home",     // Required: Unique identifier for the bubble
    text: "Home",      // Optional: Text to display in the bubble
    radius: 50,        // Required: Size of the bubble
    icon: require('./assets/home-icon.png') // Optional: Icon to display
  },
  { 
    label: "Profile",
    text: "Profile",
    radius: 40,
    icon: require('./assets/profile-icon.png')
  },
  // ... more items
];

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <BubbleMenu
        items={menuItems}
        menuRadius={0}  // Optional: Base radius for the menu circle
      />
    </View>
  );
}
```

## Props

### BubbleMenu Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| items | BubbleProps[] | Yes | Array of bubble items to display |
| menuRadius | number | No | Base radius for the menu circle (default: 0) |

### BubbleProps Interface

```typescript
interface BubbleProps {
  label: string;        // Required: Unique identifier for the bubble
  text?: string;        // Optional: Text to display in the bubble
  radius: number;       // Required: Size of the bubble
  icon?: any;          // Optional: Icon to display (can be require() or URL)
}
```

## Styling

The component uses the following styles that can be customized:

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
  icon: {
    marginBottom: 8,
    resizeMode: 'contain',
  },
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
```

## Behavior

- The first item in the array becomes the center bubble
- Remaining items are arranged in a circle around the center
- Bubbles can be dragged and will automatically return to their positions
- Collision detection prevents bubbles from overlapping
- Bubbles maintain their relative positions when the screen is resized

## Example

```typescript
const menuItems: BubbleProps[] = [
  { 
    label: "Home",
    text: "Home",
    radius: 50,
    icon: require('./assets/home-icon.png')
  },
  { 
    label: "Profile",
    text: "Profile",
    radius: 40,
    icon: require('./assets/profile-icon.png')
  },
  { 
    label: "Settings",
    text: "Settings",
    radius: 40
  },
  { 
    label: "Notifications",
    radius: 40,
    icon: require('./assets/notifications-icon.png')
  }
];
```

## Notes

- The `label` prop is required and must be unique for each bubble
- The `radius` prop determines the size of the bubble
- Icons should be square and preferably of similar dimensions
- The menu automatically adjusts to screen size changes
- Bubbles will maintain their positions relative to the center
- Collision detection ensures bubbles don't overlap during interaction

## Dependencies

- react-native
- react-native-shadow-2 (for shadow effects)

## License

MIT 