import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { Animated, ImageStyle, PanResponder, Pressable, TextStyle, ViewStyle } from 'react-native';
import DefaultBubble from './DefaultBubble';
import { styles } from '../styles';
import { K } from '../constants';

// Style interfaces for the bubble component
export interface BubbleStyleProps {
  container?: ViewStyle;
  circle?: ViewStyle;
  text?: TextStyle;
  icon?: ImageStyle;
}

// Props for the bubble component
export interface BubbleProps {
  id: string;
  radius?: number;
  originalX?: number;
  originalY?: number;
  text?: string;
  icon?: any; // Can be a require() image or a URL
  style?: BubbleStyleProps;
  key?: string;
  onPress?: () => void;
}

// Props for the bubble wrapper component
export interface BubbleWrapperProps {
  item: BubbleProps;
  bubbleComponent?: React.ComponentType<BubbleProps>;
  setIsAnyBubbleDragging: (isDragging: boolean) => void;
  updateBubblePositions: (id: string, newPosition: Position) => void;
  height: number;
  width: number;
}

// Position interface for bubble coordinates
export interface Position {
  x: number;
  y: number;
}

// BubbleWrapper Component: Creates a draggable bubble with custom styling and behavior
const BubbleWrapper = forwardRef(({ 
  item, 
  bubbleComponent,
  setIsAnyBubbleDragging,
  updateBubblePositions,
  height,
  width
}: BubbleWrapperProps, ref) => {
  console.log("BubbleWrapper Rendered: ", item.id)

  // Animation and state management
  const translation = useRef(new Animated.ValueXY({x: item.originalX!, y: item.originalY!})).current;
  const [currentPosition, setCurrentPosition] = useState<Position>({ x: item.originalX!, y: item.originalY! });
  const [isDragging, setIsDragging] = useState(false);
  const [avoidCollision, setAvoidCollision] = useState(false);
  const lastLogicUpdateRef = useRef(0);
  const LOGIC_FRAME_INTERVAL = 1000 / K.FPS_LOGIC;

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getPosition: () => currentPosition,
    setPosition: (pos: Position) => {
      if (!isDragging) {
        setCurrentPosition(pos);
      }
    },
    getIsDragging: () => isDragging,
    getAvoidCollision: () => avoidCollision,
    setAvoidCollision: (value: boolean) => setAvoidCollision(value)
  }));

  // Update parent component when dragging state changes
  useEffect(() => {
    if (!isDragging) {
      Animated.timing(translation, {
        toValue: { x: currentPosition.x - item.originalX!, y: currentPosition.y - item.originalY! },
        useNativeDriver: true,
        duration: 1000 / (K.FPS_UI * K.FPS_SYNC),
      }).start();
    } else {
    translation.setValue({
        x: currentPosition.x - item.originalX!,
        y: currentPosition.y - item.originalY!
      });
    }
  }, [currentPosition]);

  // Helper to constrain position within bounds
  const clampPosition = (x: number, y: number) => {
    const radius = item.radius || 50;
    const minX = 0;
    const minY = 0;
    const maxX = width - radius * 2;
    const maxY = height - radius * 2;
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  };

  // Pan responder for drag and drop functionality
  const panResponder = useRef(
    PanResponder.create({
      // Start dragging on touch
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        setIsDragging(true);
      },

      // Handle movement
      onPanResponderMove: (_, gesture) => {
        const unclampedX = item.originalX! + gesture.dx;
        const unclampedY = item.originalY! + gesture.dy;
        const { x, y } = clampPosition(unclampedX, unclampedY);
        setCurrentPosition({ x, y });
        
        // Throttle logic updates to FPS_Logic
        const now = Date.now();
        if (now - lastLogicUpdateRef.current >= LOGIC_FRAME_INTERVAL) {
          updateBubblePositions(item.id, { x, y });
          lastLogicUpdateRef.current = now;
        }
      },

      // Handle release
      onPanResponderRelease: () => {
        // Animate back to original position
        setIsDragging(false);
        Animated.spring(translation, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          speed: 0.5, 
          bounciness: 2,
        }).start(() => {
          setCurrentPosition({ x: item.originalX!, y: item.originalY! });
          updateBubblePositions(item.id, {x: item.originalX!, y: item.originalY!})
        });
        lastLogicUpdateRef.current = 0; // Reset throttle
      },
    }),
  ).current;

  // Render the bubble with animation and touch handling
  return (
    <Animated.View 
      style={[
        styles.bubbleContainer,
        item.style?.container,
        {
          left: item.originalX,
          top: item.originalY,
          transform: [
            { translateX: translation.x },
            { translateY: translation.y }
          ]
        }
      ]}
      {...panResponder.panHandlers}
    >
      <Pressable
        key={item.key}
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
        })}
        onPress={item.onPress}
      >
        {(() => {
          const Component = bubbleComponent || DefaultBubble;
          return (
            <Component
              id={item.id}
              label={item.id}
              radius={item.radius || 50}
              originalX={item.originalX}
              originalY={item.originalY}
              text={item.text}
              icon={item.icon}
              style={item.style}
            />
          );
        })()}
      </Pressable>
    </Animated.View>
  );
});

export default BubbleWrapper; 