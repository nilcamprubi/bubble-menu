import React, {
  forwardRef
} from 'react';
import { View, Text, Image, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Shadow } from 'react-native-shadow-2';
import { styles } from '../styles';
import { BubbleStyleProps } from './BubbleWrapper';
export interface BubbleProps {
  label: string;
  radius: number;
  originalX?: number;
  originalY?: number;
  text?: string;
  icon?: any; // Can be a require() image or a URL
  style?: BubbleStyleProps;
}

const Bubble = forwardRef(({ label, radius, text, icon, style }: BubbleProps, ref) => {

  return (
          <View 
            style={[
              styles.circle, 
              style?.circle,
              { 
                width: radius*2, 
                height: radius*2, 
                borderRadius: 42,
                transform: [{ rotate: '45deg' }],
                padding: icon ? 8 : 0,
                backgroundColor: '#171b38',
                borderWidth: 0,
              }
            ]}
          >
            <View 
              style={{ 
                transform: [{ rotate: '-45deg' }],
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
            {icon && (
              <Image 
                source={icon}
                style={[
                  styles.icon,
                  style?.icon,
                  { 
                    width: radius * (text ? 0.8 : 1),
                    height: radius * (text ? 0.8 : 1),
                    marginBottom: 4
                  }
                ]}
              />
            )}
            {text && (
              <Text style={[
                styles.text,
                style?.text,
                { fontSize: icon ? radius/3.6 : 16, color: '#CBD22C' } // font size adapts to the radius of the bubble and the icon
              ]}>{text}</Text>
            )}
            </View>
          </View>
      ) 
});

export default Bubble; 