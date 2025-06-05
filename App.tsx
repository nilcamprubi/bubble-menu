import { StyleSheet, View } from 'react-native';
import BubbleMenu from './components/BubbleMenu';
import type { BubbleItem } from './components/BubbleMenu';

const menuItems: BubbleItem[] = [ 
  { label: "Home", radius: 70 }, 
  { label: "Diets", radius: 50 }, 
  { label: "Recipes", radius: 50 }, 
  { label: "Tips", radius: 50 },
  { label: "Profile", radius: 50 } 
];

export default function App() {
  return (
    <View style={styles.container}>
      <BubbleMenu
        items={menuItems}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
