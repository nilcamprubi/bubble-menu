import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shadow } from 'react-native-shadow-2';

interface CircleProps {
  size: number;
  text: string;
  textStyle?: object;
}

const Circle: React.FC<CircleProps> = ({ size, text, textStyle }) => {
  return (
    <Shadow
      distance={5}
      startColor="rgba(0, 0, 0, 0.1)"
      offset={[0, 2]}
    >
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.text, textStyle]}>{text}</Text>
      </View>
    </Shadow>
  );
};

const styles = StyleSheet.create({
  circle: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});

export default Circle; 