import React, {useRef} from 'react';
import {Animated, View, StyleSheet, PanResponder, Text} from 'react-native';
import { Shadow } from 'react-native-shadow-2';

export interface BubbleProps {
  label: string;
  radius: number;
}

const Bubble = ({ label, radius } : BubbleProps) => {
  const pan = useRef(new Animated.ValueXY()).current;

  // Sets the movement of the bubble
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        pan.setValue({
          x: gesture.dx,
          y: gesture.dy
        });
      },
      onPanResponderRelease: () => {
        Animated.spring(pan, {
          toValue: {x: 0, y: 0},
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          transform: [
            { translateX: pan.x },
            { translateY: pan.y }
          ]
        }
      ]}
      {...panResponder.panHandlers}
    >
      <Shadow
        distance={5}
        startColor="rgba(0, 0, 0, 0.1)"
        offset={[0, 2]}
      >
        <View 
          style={[
            styles.circle, 
            { 
              width: radius*2, 
              height: radius*2, 
              borderRadius: radius,
            }
          ]}
        >
          <Text style={[styles.text]}>{label}</Text>
        </View>
      </Shadow>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
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
});

export default Bubble; 