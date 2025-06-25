import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {
  Animated,
  ImageStyle,
  PanResponder,
  Pressable,
  TextStyle,
  ViewStyle,
} from 'react-native';
import DefaultBubble from './DefaultBubble';
import { styles } from '../styles';
import { K } from '../constants';

// Interface definitions (unchanged)
export interface BubbleStyleProps {
  container?: ViewStyle;
  circle?: ViewStyle;
  text?: TextStyle;
  icon?: ImageStyle;
}

export interface BubbleProps {
  id: string;
  radius?: number;
  originalX?: number;
  originalY?: number;
  text?: string;
  icon?: any;
  style?: BubbleStyleProps;
  key?: string;
  onPress?: () => void;
}

export interface BubbleWrapperProps {
  item: BubbleProps;
  bubbleComponent?: React.ComponentType<BubbleProps>;
  updateBubblePositions: (id: string, newPosition: Position) => void;
  height: number;
  width: number;
}

export interface Position {
  x: number;
  y: number;
}


const BubbleWrapper = forwardRef<any, BubbleWrapperProps>(({
  item,
  bubbleComponent: BubbleComponent = DefaultBubble,
  updateBubblePositions,
  height,
  width,
}, ref) => {
  console.log("BubbleWrapper Rendered: ", item.id);

  const { id, originalX = 0, originalY = 0, radius = 50, onPress } = item;

  // Refs for managing state without causing re-renders
  const translation = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const currentPosition = useRef<Position>({ x: originalX, y: originalY });
  const isDragging = useRef(false);
  const avoidCollision = useRef(false);
  const lastLogicUpdateRef = useRef(0);

  const LOGIC_FRAME_INTERVAL = 1000 / K.FPS_LOGIC;

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    getPosition: () => currentPosition.current,
    setPosition: (pos: Position) => {
      if (!isDragging.current) {
        Animated.timing(translation, {
          toValue: { x: pos.x - originalX, y: pos.y - originalY },
          useNativeDriver: true,
          duration: 1000 / (K.FPS_UI * K.FPS_SYNC),
        }).start();
        currentPosition.current = { x: pos.x, y: pos.y };
      }
    },
    getIsDragging: () => isDragging.current,
    getAvoidCollision: () => avoidCollision.current,
    setAvoidCollision: (value: boolean) => {
      avoidCollision.current = value;
    },
  }), [originalX, originalY, translation]);


  const clampPosition = useCallback((x: number, y: number) => {
    const minX = 0;
    const minY = 0;
    const maxX = width - radius * 2;
    const maxY = height - radius * 2;
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  }, [width, height, radius]);

  // Pan responder with corrected logic
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          isDragging.current = true;
        },
        onPanResponderMove: (_, gesture) => {
          // CORRECTED LOGIC: Calculate new position based on original position + total gesture delta
          const targetX = originalX + gesture.dx;
          const targetY = originalY + gesture.dy;

          const clampedPosition = clampPosition(targetX, targetY);
          
          // Update the logical position ref
          currentPosition.current = clampedPosition;
          
          // Update the visual animation value. It's the delta from the original spot.
          const deltaX = clampedPosition.x - originalX;
          const deltaY = clampedPosition.y - originalY;
          translation.setValue({ x: deltaX, y: deltaY });

          // Throttle the position updates to the parent
          const now = Date.now();
          if (now - lastLogicUpdateRef.current >= LOGIC_FRAME_INTERVAL) {
            updateBubblePositions(id, currentPosition.current);
            lastLogicUpdateRef.current = now;
          }
        },
        onPanResponderRelease: () => {
          isDragging.current = false;

          // translation.setValue({x:0,y:0})
          // Animate back to the original position (delta of 0,0)
          Animated.spring(translation, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
            // After animation, reset logical position and notify parent
          currentPosition.current = { x: originalX, y: originalY };
          updateBubblePositions(id, { x: originalX, y: originalY });

          lastLogicUpdateRef.current = 0;
        },
      }),
    [id, originalX, originalY, clampPosition, updateBubblePositions, translation]
  );
  
  // The animated style now correctly uses the transform from the translation ref
  const animatedStyle = {
    transform: translation.getTranslateTransform(),
  };

  return (
    <Animated.View
      style={[
        styles.bubbleContainer,
        item.style?.container,
        {
          left: originalX,
          top: originalY,
          transform: [
            { translateX: translation.x },
            { translateY: translation.y }
          ]
        },
        animatedStyle,
      ]}
      {...panResponder.panHandlers}
    >
      <Pressable
        key={item.key}
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
        })}
        onPressIn={onPress}
      >
        <BubbleComponent
            {...item}
            radius={radius}
        />
      </Pressable>
    </Animated.View>
  );
});

export default React.memo(BubbleWrapper);