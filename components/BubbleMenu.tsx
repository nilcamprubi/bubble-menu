import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Dimensions, ViewStyle } from 'react-native';
import BubbleWrapper from './BubbleWrapper'
import type { BubbleProps, BubbleWrapperProps, Position, BubbleStyleProps } from './BubbleWrapper';
import { styles } from '../styles';

// Types and Interfaces
export interface BubbleMenuStyleProps {
  container?: ViewStyle;
  centerBubble?: ViewStyle;
  menuBubbleContainer?: ViewStyle;
  bubble?: BubbleStyleProps;
}

interface BubbleMenuProps {
  items: BubbleProps[] // Array of bubbles to display
  menuRadius: number // Radius of the menu
  style?: BubbleMenuStyleProps // Style for the menu and its bubbles
  bubbleComponent?: React.ComponentType<BubbleProps>;
}

// Define the ref type
type BubbleRef = {
  getPosition: () => Position;
  setPosition: (pos: Position) => void;
  getIsDragging: () => boolean;
} | null;


 // BubbleMenu Component: Creates a circular menu with draggable bubbles that can interact with each other
 
const BubbleMenu = ({ items, menuRadius, style, bubbleComponent } : BubbleMenuProps) => {
  // Window dimensions and center points
  const { width, height } = Dimensions.get('window');
  const centerX = width / 2;
  const centerY = height / 2;

  // Refs and State
  const bubbleRefs = useRef<Record<string, BubbleRef>>({});
  const [isAnyBubbleDragging, setIsAnyBubbleDragging] = useState(false);

  // Utility Functions
  // Keep position within window bounds
  const constrainToWindow = (pos: Position, radius: number): Position => ({
    x: Math.max(0, Math.min(width - radius * 2, pos.x)),
    y: Math.max(radius, Math.min(height - radius * 2, pos.y))
  });

  // Calculates initial positions for all bubbles in a circular formation
  const initialPositions = useMemo(() => 
    items.map((item, index) => {
      const menuRotation = 4; // Controls the rotation of the bubble formation
      const angle = index === 0 ? 0 : (index * (2 * Math.PI)) / (items.length - 1) - Math.PI / menuRotation;
      const radius = menuRadius + 130; // Distance between bubbles, minimum distance is 130
      const distance = index === 0 ? 0 : radius;
      const x = centerX + Math.cos(angle) * distance - item.radius;
      const y = centerY + Math.sin(angle) * distance - item.radius;
      
      return constrainToWindow({ x, y }, item.radius); // Constrain the position to the window bounds
    }), [items, centerX, centerY]);

  const [bubblePositions, setBubblePositions] = useState<Position[]>(initialPositions); // State for the positions of the bubbles

  // Bubble State Management
  // Checks if a specific bubble is being dragged
  const isBubbleDragging = (i: number) => 
    bubbleRefs.current[items[i].label]?.getIsDragging();

  // Get distance data between two bubbles
  const getDistanceData = (i: number, j: number) => {
    const bubbles = bubbleRefs.current;
    const bubbleA = bubbles[items[i].label];
    const bubbleB = bubbles[items[j].label];

    if (!bubbleA || !bubbleB) {
      throw new Error(`Bubble references not found for indices ${i} and ${j}`);
    }

    const bubbleAPos = bubbleA.getPosition();
    const bubbleBPos = bubbleB.getPosition();
    const dx = bubbleBPos.x - bubbleAPos.x;
    const dy = bubbleBPos.y - bubbleAPos.y;
    const minDist = items[i].radius + items[j].radius + 20; // Minimum distance between bubbles

    return { 
      distanceBetweenCenters: Math.hypot(dx, dy), 
      dx, 
      dy, 
      bubbleA, 
      bubbleB, 
      minDist 
    };
  };

  // Collision Detection: Checks for collisions between bubbles
  function checkCollision(i: number, j?: number): { isColliding: boolean, index: number | undefined } {
    if (j !== undefined) {
      const { distanceBetweenCenters, minDist } = getDistanceData(i, j);
      return { isColliding: distanceBetweenCenters < minDist, index: j };
    }

    // Check collision with all other bubbles
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      const { distanceBetweenCenters, minDist } = getDistanceData(i, j);
      if (distanceBetweenCenters < minDist) {
        return { isColliding: true, index: j };
      }
    }
    return { isColliding: false, index: undefined };
  }

  // Handle collision between two bubbles
  const handleCollision = (i: number, j: number) => {
    // Distance data fetching
    const { distanceBetweenCenters, minDist, bubbleA, bubbleB, dx, dy } = getDistanceData(i, j);

    if (!bubbleA || !bubbleB) {
      console.warn('Cannot handle collision: bubble references are null');
      return;
    }

    const overlapDistance = minDist - distanceBetweenCenters;
    const percentOverlap = overlapDistance / minDist;

    // Calculate new positions
    const bubbleAPos = bubbleA.getPosition();
    const bubbleBPos = bubbleB.getPosition();

    // Update positions with smooth interpolation
    const updatedPosA = {
      x: bubbleAPos.x + (bubbleAPos.x - dx * percentOverlap - bubbleAPos.x) * 0.3,
      y: bubbleAPos.y + (bubbleAPos.y - dy * percentOverlap - bubbleAPos.y) * 0.3
    };
    const updatedPosB = {
      x: bubbleBPos.x + (bubbleBPos.x + dx * percentOverlap - bubbleBPos.x) * 0.3,
      y: bubbleBPos.y + (bubbleBPos.y + dy * percentOverlap - bubbleBPos.y) * 0.3
    };

    // Apply new positions
    bubbleA.setPosition(updatedPosA);
    bubbleB.setPosition(updatedPosB);

    // Update state
    setBubblePositions(prev => {
      const newPositions = [...prev];
      if (!bubbleA.getIsDragging()) newPositions[i] = bubbleA.getPosition();
      if (!bubbleB.getIsDragging()) newPositions[j] = bubbleB.getPosition();
      return newPositions;
    });
  };

  // Check if any bubble is out of position
  const isAnyBubbleOutOfPosition = () => {
    return items.some(item => {
      const index = items.indexOf(item);
      const initialPos = initialPositions[index];
      const bubble = bubbleRefs.current[item.label];

      if (!bubble) {
        console.warn(`Bubble reference not found for ${item.label}`);
        return false;
      }

      const bubblePos = bubble.getPosition();

      // Compare positions with 2 decimal precision
      const roundedInitialX = Math.round(initialPos.x * 100) / 100;
      const roundedInitialY = Math.round(initialPos.y * 100) / 100;
      const roundedBubbleX = Math.round(bubblePos.x * 100) / 100;
      const roundedBubbleY = Math.round(bubblePos.y * 100) / 100;

      return roundedInitialX !== roundedBubbleX || roundedInitialY !== roundedBubbleY;
    });    
  }

  // Move bubbles back to their initial positions
  const moveBubblesBackToInitialPositions = () => {
    items.forEach(item => {
      const index = items.indexOf(item);
      const collision = checkCollision(items.indexOf(item));
      const movableBubble = !collision.isColliding || !isBubbleDragging(collision.index!);

      if (!isBubbleDragging(items.indexOf(item)) && movableBubble) {
        const initialPos = initialPositions[index];
        const bubble = bubbleRefs.current[item.label];

        if (!bubble) {
          console.warn(`Bubble reference not found for ${item.label}`);
          return;
        }

        if (!bubble.getIsDragging()) {
          const bubblePos = bubble.getPosition();
          bubble.setPosition({
            x: bubblePos.x + (initialPos.x - bubblePos.x) * 0.1,
            y: bubblePos.y + (initialPos.y - bubblePos.y) * 0.1
          });
        }

        setBubblePositions(prev => {
          const newPositions = [...prev];
          if (!bubble.getIsDragging()) {
            newPositions[index] = bubble.getPosition();
          }
          return newPositions;
        });
      }
    });
  };

  // Collision Detection Effect
  useEffect(() => {
    const interval = setInterval(() => { 
      if (isAnyBubbleDragging || isAnyBubbleOutOfPosition()) { 
        // Check for collisions between all bubble pairs
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            if (checkCollision(i, j).isColliding) {
              handleCollision(i, j);
            } 
            if (isAnyBubbleOutOfPosition()) {
              moveBubblesBackToInitialPositions();
            }
          }
        }
      }
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(interval);
  }, []);

  // Render
  return (
    <View style={[styles.container, style?.container]}>
      {/* Center Bubble */}
      <View style={[
        styles.centerBubble, 
        style?.centerBubble,
        { 
          left: bubblePositions[0]?.x ?? 0, 
          top: bubblePositions[0]?.y ?? 0 
        }
      ]}>
        <BubbleWrapper 
          {...items[0]}
          originalX={bubblePositions[0]?.x ?? 0}
          originalY={bubblePositions[0]?.y ?? 0}
          style={style?.bubble}
          bubbleComponent={bubbleComponent}
          setIsAnyBubbleDragging={setIsAnyBubbleDragging}
          ref={(ref: BubbleRef) => {
            if (ref) {
              bubbleRefs.current[items[0].label || ""] = {
                getPosition: ref.getPosition,
                setPosition: ref.setPosition,
                getIsDragging: ref.getIsDragging
              };
            }
          }}
        />
      </View>

      {/* Surrounding Bubbles */}
      {items.slice(1).map((item, index) => {
        const actualIndex = index + 1;
        return (
          <View 
            key={item.label}
            style={[
              styles.bubbleContainer,
              style?.menuBubbleContainer,
              {
                left: bubblePositions[actualIndex]?.x ?? 0,
                top: bubblePositions[actualIndex]?.y ?? 0,
              }
            ]}
          >
            <BubbleWrapper 
              {...item}
              originalX={bubblePositions[actualIndex]?.x ?? 0}
              originalY={bubblePositions[actualIndex]?.y ?? 0}
              style={style?.bubble}
              bubbleComponent={bubbleComponent}
              setIsAnyBubbleDragging={setIsAnyBubbleDragging}
              ref={(ref: BubbleRef) => {
                if (ref) {
                  bubbleRefs.current[item.label] = {
                    getPosition: ref.getPosition,
                    setPosition: ref.setPosition,
                    getIsDragging: ref.getIsDragging
                  };
                }
              }}
            />
          </View>
        );
      })}
    </View>
  );
};

export default BubbleMenu; 