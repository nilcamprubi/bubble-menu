import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Bubble from './Bubble'
import type { BubbleProps } from './Bubble';

interface BubbleMenuProps {
  items: BubbleProps[]
}

interface BubbleRef {
  currentPosition: { x: number; y: number };
  radius: number;
  label: string;
}

interface BubblePosition {
  x: number;
  y: number;
}

const BubbleMenu = ({ items } : BubbleMenuProps) => {
  const { width, height } = Dimensions.get('window');
  const centerX = width / 2;
  const centerY = height / 2;
  const bubbleRefs = useRef<BubbleRef[]>([]);
  const [bubblePositions, setBubblePositions] = useState<BubblePosition[]>([]);

  // Keep position within window bounds
  const constrainToWindow = (pos: BubblePosition, radius: number): BubblePosition => {
    return {
      x: Math.max(radius, Math.min(width - radius, pos.x)),
      y: Math.max(radius, Math.min(height - radius, pos.y))
    };
  };

  // Initialize bubble refs and positions
  useEffect(() => {
    const initialPositions = items.map((item, index) => {
      const angle = index === 0 ? 0 : (index * (2 * Math.PI)) / (items.length - 1) - Math.PI/2;
      const distance = index === 0 ? 0 : 100;
      const x = centerX + Math.cos(angle) * distance - item.radius;
      const y = centerY + Math.sin(angle) * distance - item.radius;
      
      return constrainToWindow({ x, y }, item.radius);
    });

    setBubblePositions(initialPositions);
    bubbleRefs.current = items.map((item, index) => ({
      currentPosition: initialPositions[index],
      radius: item.radius,
      label: item.label
    }));
  }, []);

  // Collision detection
  useEffect(() => {
    const interval = setInterval(() => {
      const bubbles = bubbleRefs.current;
      let positionsChanged = false;
      
      // Collision detection
      for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
          const circleA = bubbles[i];
          const circleB = bubbles[j];

          const minDist = circleA.radius + circleB.radius;

          const dx = circleB.currentPosition.x - circleA.currentPosition.x;
          const dy = circleB.currentPosition.y - circleA.currentPosition.y;
          const distanceBetweenCenters = Math.hypot(dx, dy);
          const areOverlapping = distanceBetweenCenters < minDist;

          if (areOverlapping && distanceBetweenCenters !== 0) {
            console.log("Collision detected: ", circleA.label, " and ", circleB.label);
            const overlapDistance = minDist - distanceBetweenCenters;
            const percentOverlap = overlapDistance / minDist;

            // Reduce the movement factor significantly
            const movementFactor = 0.5; // Reduced from 0.5 to 0.15

            // Update refs with constrained positions
            const newPosA = constrainToWindow({
              x: circleA.currentPosition.x - dx * movementFactor,
              y: circleA.currentPosition.y - dy * movementFactor
            }, circleA.radius);

            const newPosB = constrainToWindow({
              x: circleB.currentPosition.x + dx * movementFactor,
              y: circleB.currentPosition.y + dy * movementFactor
            }, circleB.radius);

            // Smooth the transition by interpolating between current and new positions
            circleA.currentPosition = {
              x: circleA.currentPosition.x + (newPosA.x - circleA.currentPosition.x) * 0.1,
              y: circleA.currentPosition.y + (newPosA.y - circleA.currentPosition.y) * 0.1
            };

            circleB.currentPosition = {
              x: circleB.currentPosition.x + (newPosB.x - circleB.currentPosition.x) * 0.1,
              y: circleB.currentPosition.y + (newPosB.y - circleB.currentPosition.y) * 0.1
            };

            // Update state positions
            setBubblePositions(prev => {
              const newPositions = [...prev];
              newPositions[j] = circleB.currentPosition;
              return newPositions;
            });
            
            positionsChanged = true;
          }
        }
      }
    }, 1000 / 100000000); // 60 times per second

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Surrounding bubbles in a wheel formation */}
      {items.slice(1).map((item, index) => {
        const actualIndex = index + 1;
        return (
          <View 
            key={item.label}
            style={[
              styles.bubbleContainer,
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
              onPositionChange={(newPos) => {
                const constrainedPos = constrainToWindow(newPos, item.radius);
                bubbleRefs.current[actualIndex].currentPosition = constrainedPos;
                setBubblePositions(prev => {
                  const newPositions = [...prev];
                  newPositions[actualIndex] = constrainedPos;
                  return newPositions;
                });
              }}
            />
          </View>
        );
      })}

      {/* Center Home bubble */}
      <View style={[
        styles.centerBubble, 
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
          onPositionChange={(newPos) => {
            const constrainedPos = constrainToWindow(newPos, items[0].radius);
            bubbleRefs.current[0].currentPosition = constrainedPos;
            setBubblePositions(prev => {
              const newPositions = [...prev];
              newPositions[0] = constrainedPos;
              return newPositions;
            });
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerBubble: {
    position: 'absolute',
  },
  bubbleContainer: {
    position: 'absolute',
  },
});

export default BubbleMenu; 