import React, {useEffect, useRef} from 'react';
import {Animated, View, StyleSheet, PanResponder, Text} from 'react-native';
import { Shadow } from 'react-native-shadow-2';

export interface BubbleProps {
  label: string;
  radius: number;
  originalX?: number;
  originalY?: number;
  onPositionChange?: (position: { x: number; y: number }) => void;
}

interface Position {
  x: number;
  y: number;
}

const Bubble = ({ label, radius, originalX = 0, originalY = 0, onPositionChange } : BubbleProps) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const currentPosition = useRef<Position>({ x: originalX, y: originalY });

  // Update current position when pan changes
  useEffect(() => {
    const listener = pan.addListener((value) => {
      const newPos = {
        x: originalX + value.x,
        y: originalY + value.y
      };
      currentPosition.current = newPos;
      onPositionChange?.(newPos);
    });
    return () => pan.removeListener(listener);
  }, [pan, originalX, originalY, onPositionChange]);

  // Sets the movement of the bubble
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        pan.setValue({
          x: gesture.dx / 20,
          y: gesture.dy / 20
        });
      },
      onPanResponderRelease: () => {
        Animated.spring(pan, {
          toValue: {x: 0, y: 0},
          useNativeDriver: true,
          friction: 5,
          tension: 40
        }).start(({ finished }) => {
          if (finished) {
            // Update position when spring animation completes
            const newPos = { x: originalX, y: originalY };
            currentPosition.current = newPos;
            onPositionChange?.(newPos);
          }
        });
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