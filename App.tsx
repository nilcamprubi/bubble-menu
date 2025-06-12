import { View } from 'react-native';
import type { BubbleProps } from './components/CustomBubble';
import BubbleMenu from './components/BubbleMenu';
import type { BubbleMenuStyleProps } from './components/BubbleMenu';
import { styles } from './styles';
import DefaultBubble from './components/DefaultBubble';

const menuItems: BubbleProps[] = [ 
  { label: "Home", text: "Home", radius: 50, icon: require('./assets/home-icon.png') }, 
  { label: "Diets", text: "Diets", radius: 40 }, 
  { label: "Recipes", text: "Recipes", radius: 40, icon: require('./assets/home-icon.png') }, 
  { label: "Tips", text: "Tips", radius: 40 },
  { label: "Profile", text: "Profile", radius: 40, icon: require('./assets/home-icon.png') },
  { label: "Order", text: "Order", radius: 40 },
  { label: "Buy", text: "Buy", radius: 40, icon: require('./assets/home-icon.png') },
];

const menuStyle: BubbleMenuStyleProps = {
  container: {
    backgroundColor: 'transparent',
  },
  centerBubble: {
    backgroundColor: 'transparent',
  },
  menuBubbleContainer: {
    backgroundColor: 'transparent',
  },
  bubble: {
    circle: {
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    text: {
      color: '#333333',
      fontWeight: '500',
    },
    icon: {
    },
  },
  shadow: true,
};

export default function App() {
  return (
    <View style={styles.container}>
      <BubbleMenu
        items={menuItems}
        menuRadius={0}
        style={menuStyle}
        bubbleComponent={DefaultBubble}
      />
    </View>
  );
}
