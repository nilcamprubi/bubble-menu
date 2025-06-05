import { StyleSheet, View, Dimensions } from 'react-native';
import Bubble from './components/Bubble';
import type { BubbleProps } from './components/Bubble';

const menuItems: BubbleProps[] = [ 
  { label: "Home", radius: 50 }, 
  { label: "Diets", radius: 40 }, 
  { label: "Recipes", radius: 40 }, 
  { label: "Tips", radius: 40 },
  { label: "Profile", radius: 40 },
  { label: "Order", radius: 40 },
  { label: "Buy", radius: 40 } 
];

export default function App() {
  const { width, height } = Dimensions.get('window');
  const centerX = width / 2;
  const centerY = height / 2;

  return (
    <View style={styles.container}>
      {/* Surrounding bubbles in a wheel formation */}
      {menuItems.slice(1).map((item, index) => {
        const angle = (index * (2 * Math.PI)) / (menuItems.length - 1) - Math.PI/2; // Start from top
        const distance = 100; // Distance from center
        const x = centerX + Math.cos(angle) * distance - item.radius;
        const y = centerY + Math.sin(angle) * distance - item.radius;
        
        return (
          <View 
            key={item.label}
            style={[
              styles.bubbleContainer,
              {
                left: x,
                top: y,
              }
            ]}
          >
            <Bubble 
              label={item.label}
              radius={item.radius}
            />
          </View>
        );
      })}

      {/* Center Home bubble */}
      <View style={[styles.centerBubble, { left: centerX - menuItems[0].radius, top: centerY - menuItems[0].radius }]}>
        <Bubble 
          label={menuItems[0].label}
          radius={menuItems[0].radius}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerBubble: {
    position: 'absolute',
  },
  bubbleContainer: {
    position: 'absolute',
  },
});
