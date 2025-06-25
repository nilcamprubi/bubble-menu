import { View, Dimensions } from 'react-native';
import BubbleMenu from './components/BubbleMenu';
import type { BubbleProps } from './components/BubbleWrapper';
import type { BubbleMenuStyleProps } from './components/BubbleMenu';
import { styles } from './styles';
import AhaBubble from './components/AhaBubble';

const radius = 50;

const menuItems: BubbleProps[] = [ 
  { id: "Belleza", text: "Belleza", radius: radius, icon: require('./assets/belleza-icon.png') }, 
  { id: "Cerrajería", text: "Cerrajería", radius: radius, icon: require('./assets/cerrajeria-icon.png') },
  { id: "Residencia", text: "Residencia", radius: radius, icon: require('./assets/residencia-icon.png') },
  { id: "Cuidados", text: "Cuidados", radius: radius, icon: require('./assets/cuidados-icon.png') }, 
  { id: "Masajista", text: "Masajista", radius: radius, icon: require('./assets/masajistas-icon.png') }, 
  { id: "Cuidados2", text: "Cuidados", radius: radius, icon: require('./assets/cuidados-icon.png') }, 
  { id: "Masajista2", text: "Masajista", radius: radius, icon: require('./assets/masajistas-icon.png') }, 
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
        menuDistance={70}
        height={Dimensions.get('window').height}
        width={Dimensions.get('window').width}
        style={menuStyle}
        bubbleComponent={AhaBubble}
      />
    </View>
  );
}
