import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Dimensions, ViewStyle } from 'react-native';
import Bubble from './CustomBubble'
import type { BubbleProps, Position, BubbleStyleProps } from './CustomBubble';
import { styles } from '../styles';
import DefaultBubble from './DefaultBubble';


export interface BubbleMenuStyleProps {
  container?: ViewStyle;
  centerBubble?: ViewStyle;
  menuBubbleContainer?: ViewStyle;
  bubble?: BubbleStyleProps;
  shadow?: boolean;
}

interface BubbleMenuProps {
  items: BubbleProps[] // Array of bubbles to display
  menuRadius: number // Radius of the menu
  style?: BubbleMenuStyleProps // Style for the menu and its bubbles
}

const BubbleMenu = ({ items, menuRadius, style } : BubbleMenuProps) => {
  const { width, height } = Dimensions.get('window');
  const centerX = width / 2;
  const centerY = height / 2;
  const bubbleRefs = useRef<Record<string, { getPosition: () => Position; setPosition: (pos: Position) => void; getIsDragging: () => boolean }>>({});

  // Keep position within window bounds
  const constrainToWindow = (pos: Position, radius: number): Position => {
    return {
      x: Math.max(0, Math.min(width - radius * 2, pos.x)),
      y: Math.max(radius, Math.min(height - radius * 2, pos.y))
    };
  };

  // Calculate initial positions of bubbles
  const initialPositions = useMemo(() => {
    return items.map((item, index) => {
      const angle = index === 0 ? 0 : (index * (2 * Math.PI)) / (items.length - 1) - Math.PI / 2;
      const radius = menuRadius + 110; // Distance between bubbles, minimum distance is 110
      const distance = index === 0 ? 0 : radius;
      const x = centerX + Math.cos(angle) * distance - item.radius;
      const y = centerY + Math.sin(angle) * distance - item.radius;

      console.log("Bubble ", item.label, " initial position: ", { x: x + 100, y: y + 100 });
  
      return constrainToWindow({ x, y }, item.radius);
    });
  }, [items, centerX, centerY]);
  const [bubblePositions, setBubblePositions] = useState<Position[]>(initialPositions);

  // Check if a bubble is being dragged
  const isBubbleDragging = (i: number) => {
    return bubbleRefs.current[items[i].label]?.getIsDragging();
  };

  // Get distance data between two bubbles
  const getDistanceData = (i: number, j: number) => {
    const bubbles = bubbleRefs.current;
    const bubbleA = bubbles[items[i].label];
    const bubbleB = bubbles[items[j].label];
    const bubbleAPos = bubbleA.getPosition();
    const bubbleBPos = bubbleB.getPosition();
    const dx = bubbleBPos.x - bubbleAPos.x;
    const dy = bubbleBPos.y - bubbleAPos.y;

    const minDist = items[i].radius + items[j].radius; 

    return { distanceBetweenCenters: Math.hypot(dx, dy), dx, dy, bubbleA, bubbleB, minDist };
  };

  // Implementation
  function checkCollision(i: number, j?: number): { isColliding: boolean, index: number | undefined } {
    if (j !== undefined) {
      // Distance data fetching
      const { distanceBetweenCenters, minDist } = getDistanceData(i, j!);
      // Check if bubbles are overlapping
      const areOverlapping = distanceBetweenCenters < minDist;
      return { isColliding: areOverlapping, index: j };
    } else {
      for (let j = 0; j < items.length; j++) {
        if (i === j) {
          continue;
        }
        // Distance data fetching
        const { distanceBetweenCenters, minDist } = getDistanceData(i, j);
        // Check if bubbles are overlapping
        const areOverlapping = distanceBetweenCenters < minDist;
        if (areOverlapping) {
          console.log("Collision: ", items[i].label, " and ", items[j].label, " ", areOverlapping);
          return { isColliding: true, index: j };
        }
      }
      return { isColliding: false, index: undefined };
    }
  }

  // Handle collision between two bubbles
  const handleCollision = (i: number, j: number) => {
    // Distance data fetching
    const { distanceBetweenCenters, minDist, bubbleA, bubbleB, dx, dy } = getDistanceData(i, j);

    const overlapDistance = minDist - distanceBetweenCenters;
    const percentOverlap = overlapDistance / minDist;

    // Update refs with constrained positions
    const bubbleAPos = bubbleA.getPosition();
    const newPosA = constrainToWindow({
      x: bubbleAPos.x - dx * percentOverlap,
      y: bubbleAPos.y - dy * percentOverlap
    }, items[i].radius);


    const bubbleBPos = bubbleB.getPosition();
    const newPosB = constrainToWindow({
      x: bubbleBPos.x + dx * percentOverlap,
      y: bubbleBPos.y + dy * percentOverlap
    }, items[j].radius);

    // Smooth the transition by interpolating between current and new positions
    const updatedPosA = {
        x: bubbleAPos.x + (newPosA.x - bubbleAPos.x) * 0.3,
        y: bubbleAPos.y + (newPosA.y - bubbleAPos.y) * 0.3
    };
    bubbleA.setPosition(updatedPosA);

    const updatedPosB = {
      x: bubbleBPos.x + (newPosB.x - bubbleBPos.x) * 0.3,
      y: bubbleBPos.y + (newPosB.y - bubbleBPos.y) * 0.3
    };
    bubbleB.setPosition(updatedPosB);

    // Update state positions
    setBubblePositions(prev => {
      const newPositions = [...prev];
      if (!bubbleA.getIsDragging()) {
        newPositions[i] = bubbleA.getPosition();
      }
      if (!bubbleB.getIsDragging()) {
        newPositions[j] = bubbleB.getPosition();
      }
      return newPositions;
    });
  };

  // Check if any bubble is out of position
  const isAnyBubbleOutOfPosition = () => {
    let isOutOfPosition = false;
    isOutOfPosition = items.some(item => {
      const index = items.indexOf(item);
      const initialPos = initialPositions[index];
      const bubble = bubbleRefs.current[item.label];
      const bubblePos = bubble.getPosition();

      if (initialPos.x !== bubblePos.x || initialPos.y !== bubblePos.y) {
        // console.log("Bubble ", item.label, " is out of position");
        return true;
      }
    });
    
    // console.log("Is any bubble out of position: ", isOutOfPosition);
    return isOutOfPosition;
  }

  // Move bubbles back to their initial positions
  const moveBubblesBackToInitialPositions = () => {
    // console.log("Moving bubbles back to initial positions");
      items.forEach(item => {
        const index = items.indexOf(item);
        const collision = checkCollision(items.indexOf(item));
        const movableBubble = !collision.isColliding || !isBubbleDragging(collision.index!);

        if (!isBubbleDragging(items.indexOf(item)) && movableBubble) {
          const initialPos = initialPositions[index];
          const bubble = bubbleRefs.current[item.label];

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

  // Collision detection
  useEffect(() => {
    const interval = setInterval(() => {      
      // Collision detection
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          // If bubbles are overlapping, move them apart
          if (checkCollision(i, j).isColliding) {
            handleCollision(i, j);
          } 
          if (isAnyBubbleOutOfPosition()) {
            moveBubblesBackToInitialPositions();
          }
        }
      }
    }, 1000 / 120); // 120 times per second

    return () => clearInterval(interval);
  }, []);


  return (
    <View style={[styles.container, style?.container]}>
      {/* Center Home bubble */}
      <View style={[
        styles.centerBubble, 
        style?.centerBubble,
        { 
          left: bubblePositions[0]?.x ?? 0, 
          top: bubblePositions[0]?.y ?? 0 
        }
      ]}>
        <Bubble 
          label={items[0].label}
          radius={items[0].radius}
          originalX={bubblePositions[0]?.x ?? 0}
          originalY={bubblePositions[0]?.y ?? 0}
          text={items[0].text}
          icon={items[0].icon}
          style={{
            ...style?.bubble,
            shadow: style?.shadow
          }}
          bubbleComponent={DefaultBubble}
          ref={(ref: { getPosition: () => Position; setPosition: (pos: Position) => void; getIsDragging: () => boolean } | null) => {
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
      {/* Surrounding bubbles in a wheel formation */}
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
            <Bubble 
              label={item.label}
              radius={item.radius}
              originalX={bubblePositions[actualIndex]?.x ?? 0}
              originalY={bubblePositions[actualIndex]?.y ?? 0}
              text={item.text}
              icon={item.icon}
              style={{
                ...style?.bubble,
                shadow: style?.shadow
              }}
              bubbleComponent={DefaultBubble}
              ref={(ref: { getPosition: () => Position; setPosition: (pos: Position) => void; getIsDragging: () => boolean } | null) => {
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