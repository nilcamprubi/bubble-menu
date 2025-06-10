import { View } from 'react-native';
import Bubble from './components/Bubble';
import type { BubbleProps } from './components/Bubble';
import BubbleMenu from './components/BubbleMenu';
import { styles } from './styles';

const menuItems: BubbleProps[] = [ 
  { label: "Home", text: "Home", radius: 50, icon: require('./assets/home-icon.png') }, 
  { label: "Diets", text: "Diets", radius: 40 }, 
  { label: "Recipes", text: "Recipes", radius: 40, icon: require('./assets/home-icon.png') }, 
  { label: "Tips", text: "Tips", radius: 40 },
  { label: "Profile", text: "Profile", radius: 40, icon: require('./assets/home-icon.png') },
  { label: "Order", text: "Order", radius: 40 },
  { label: "Buy", text: "Buy", radius: 40, icon: require('./assets/home-icon.png') },
];

export default function App() {
  return (
    <View style={styles.container}>
      <BubbleMenu
        items={menuItems}
        menuRadius={0}
      />
    </View>
  );
}
