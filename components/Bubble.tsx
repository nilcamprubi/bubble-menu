import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef
} from 'react';
import {Animated, View, PanResponder, Text, Image, ViewStyle, TextStyle, ImageStyle} from 'react-native';
import { Shadow } from 'react-native-shadow-2';
import { styles } from '../styles';

export interface BubbleStyleProps {
  container?: ViewStyle;
  circle?: ViewStyle;
  text?: TextStyle;
  icon?: ImageStyle;
  shadow?: boolean;
}

export interface BubbleProps {
  label: string;
  radius: number;
  originalX?: number;
  originalY?: number;
  text?: string;
  icon?: any; // Can be a require() image or a URL
  style?: BubbleStyleProps;
}

export interface Position {
  x: number;
  y: number;
}

const Bubble = forwardRef(({ label, radius, originalX, originalY, text, icon, style }: BubbleProps, ref) => {
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
      {style?.shadow !== false ? (
        <Shadow
          distance={5}
          startColor="rgba(0, 0, 0, 0.1)"
          offset={[0, 2]}
        >
          <View 
            style={[
              styles.circle, 
              style?.circle,
              { 
                width: radius*2, 
                height: radius*2, 
                borderRadius: radius,
                padding: icon ? 8 : 0,
              }
            ]}
          >
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
                { fontSize: icon ? 14 : 16 }
              ]}>{text}</Text>
            )}
          </View>
        </Shadow>
      ) : (
        <View 
          style={[
            styles.circle, 
            style?.circle,
            { 
              width: radius*2, 
              height: radius*2, 
              borderRadius: radius,
              padding: icon ? 8 : 0,
            }
          ]}
        >
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
              { fontSize: icon ? 14 : 16 }
            ]}>{text}</Text>
          )}
        </View>
      )}
    </Animated.View>
  );
});

export default Bubble; 