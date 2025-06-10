import { View } from 'react-native';
import Bubble from './components/Bubble';
import type { BubbleProps } from './components/Bubble';
import BubbleMenu from './components/BubbleMenu';
import { styles } from './styles';

const menuItems: BubbleProps[] = [ 
  { label: "Home", radius: 50 }, 
  { label: "Diets", radius: 40 }, 
  { label: "Recipes", radius: 40 }, 
  { label: "Tips", radius: 40 },
  { label: "Profile", radius: 40 },
  { label: "Order", radius: 40 },
  { label: "Buy", radius: 40 } ,
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
