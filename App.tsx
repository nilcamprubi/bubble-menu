import { View } from 'react-native';
import type { BubbleProps } from './components/BubbleWrapper';
import BubbleMenu from './components/BubbleMenu';
import type { BubbleMenuStyleProps } from './components/BubbleMenu';
import { styles } from './styles';
import DefaultBubble from './components/DefaultBubble';
import AhaBubble from './components/AhaBubble';

const radius = 50;

const menuItems: BubbleProps[] = [ 
  { label: "Belleza", text: "Belleza", radius: radius, icon: require('./assets/belleza-icon.png') }, 
  { label: "Cerrajería", text: "Cerrajería", radius: radius, icon: require('./assets/cerrajeria-icon.png') },
  { label: "Residencia", text: "Residencia", radius: radius, icon: require('./assets/residencia-icon.png') },
  { label: "Cuidados", text: "Cuidados", radius: radius, icon: require('./assets/cuidados-icon.png') }, 
  { label: "Masajista", text: "Masajista", radius: radius, icon: require('./assets/masajistas-icon.png') }, 
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
};

export default function App() {
  return (
    <View style={styles.container}>
      <BubbleMenu
        items={menuItems}
        menuRadius={10}
        style={menuStyle}
        bubbleComponent={AhaBubble}
      />
    </View>
  );
}
