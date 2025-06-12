import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef
} from 'react';
import {Animated, PanResponder, ViewStyle, TextStyle, ImageStyle, TouchableOpacity} from 'react-native';
import { styles } from '../styles';
import DefaultBubble from './DefaultBubble';

export interface BubbleStyleProps {
  container?: ViewStyle;
  circle?: ViewStyle;
  text?: TextStyle;
  icon?: ImageStyle;
}

export interface BubbleProps {
  label: string;
  radius: number;
  originalX?: number;
  originalY?: number;
  text?: string;
  icon?: any; // Can be a require() image or a URL
  style?: BubbleStyleProps;
  bubbleComponent?: React.ComponentType<BubbleProps>;
}

export interface Position {
  x: number;
  y: number;
}

const BubbleWrapper = forwardRef(({ label, radius, originalX, originalY, text, icon, style, bubbleComponent }: BubbleProps, ref) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [currentPosition, setCurrentPosition] = useState<Position>({ x: originalX!, y: originalY! });
  const [isDragging, setIsDragging] = useState(false);

  useImperativeHandle(ref, () => ({
    getPosition: () => {
      // console.log("Retrieving position of ", label,": ", currentPosition.x, " ", currentPosition.y)
      return currentPosition;
    },
    setPosition: (pos: Position) => {
      if (!isDragging) {
        setCurrentPosition(pos);
      }
    },
    getIsDragging: () => {
      return isDragging;
    }
  }));

    // Initialize bubble refs and positions
    useEffect(() => {
      // console.log(label, " position: ", currentPosition.x, " ", currentPosition.y)
    }, [currentPosition]);

  // Log state changes
  useEffect(() => {
    console.log("Dragging state changed for", label || "button", ":", isDragging);
  }, [isDragging]);

  // Sets the movement of the bubble
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        pan.setValue({
          x: gesture.dx,
          y: gesture.dy,
        });
        setCurrentPosition({
          x: originalX! + gesture.dx,
          y: originalY! + gesture.dy
        });
        setIsDragging(true);
      },
      onPanResponderRelease: () => {
        Animated.spring(pan, {
          toValue: {x: 0, y: 0},
          useNativeDriver: true,
        }).start();
        setCurrentPosition({
          x: originalX!,
          y: originalY!
        });
        setIsDragging(false);
      },
    }),
  ).current;

  return (
    <Animated.View 
      style={[
        styles.bubbleContainer,
        style?.container,
        { 
          transform: [
            { translateX: pan.x },
            { translateY: pan.y }
          ]
        }
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity onPress={() => {
        console.log("Bubble ", label, " pressed");
      }}>

      {React.createElement(bubbleComponent || DefaultBubble, {
        label,
        radius,
        originalX,
        originalY,
        text,
        icon,
        style
      })}

      </TouchableOpacity>

    </Animated.View>
  );
});

export default BubbleWrapper; 