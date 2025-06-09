import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Bubble from './Bubble'
import type { BubbleProps, Position } from './Bubble';

interface BubbleMenuProps {
  items: BubbleProps[]
}

const BubbleMenu = ({ items } : BubbleMenuProps) => {
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

  const initialPositions = useMemo(() => {
    return items.map((item, index) => {
      const angle = index === 0 ? 0 : (index * (2 * Math.PI)) / (items.length - 1) - Math.PI / 2;
      const distance = index === 0 ? 0 : 130;
      const x = centerX + Math.cos(angle) * distance - item.radius;
      const y = centerY + Math.sin(angle) * distance - item.radius;
  
      return constrainToWindow({ x, y }, item.radius);
    });
  }, [items, centerX, centerY]);
  const [bubblePositions, setBubblePositions] = useState<Position[]>(initialPositions);

  const isAnyBubbleDragging = useMemo(() => {
    console.log("isAnyBubbleDragging: ", items.some(item => bubbleRefs.current[item.label]?.getIsDragging()));
    return items.some(item => bubbleRefs.current[item.label]?.getIsDragging());
  }, [items]);

  const isAnyBubbleOutOfPosition = useMemo(() => {
    return items.some(item => {
      const bubble = bubbleRefs.current[item.label];
      if (!bubble) return false;
      const currentPos = bubble.getPosition();
      const initialPos = initialPositions[items.indexOf(item)];
      return currentPos.x !== initialPos.x || currentPos.y !== initialPos.y;
    });
  }, [items, initialPositions]);

  // Initialize bubble refs and positions
  useEffect(() => {
    const initialPositions = items.map((item, index) => {
      const angle = index === 0 ? 0 : (index * (2 * Math.PI)) / (items.length - 1) - Math.PI/2;
      const distance = index === 0 ? 0 : 130;
      const x = centerX + Math.cos(angle) * distance - item.radius;
      const y = centerY + Math.sin(angle) * distance - item.radius;
      
      return constrainToWindow({ x, y }, item.radius);
    });

    setBubblePositions(initialPositions);
  }, [items, centerX, centerY]);

  // Collision detection
  useEffect(() => {
    const interval = setInterval(() => {
      const bubbles = bubbleRefs.current;
      
      // Collision detection
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const circleA = bubbles[items[i].label];
          const circleB = bubbles[items[j].label];

          if (!circleA || !circleB) continue;

          const minDist = items[i].radius + items[j].radius + 10;

          const dx = circleB.getPosition().x - circleA.getPosition().x;
          const dy = circleB.getPosition().y - circleA.getPosition().y;
          const distanceBetweenCenters = Math.hypot(dx, dy);
          const areOverlapping = distanceBetweenCenters < minDist;

          if (areOverlapping && distanceBetweenCenters !== 0) {
            console.log("Collision detected: ", items[i].label, " and ", items[j].label);
            console.log("Position ", items[i].label, ": ", circleA.getPosition().x, " ", circleA.getPosition().y);
            console.log("Position ", items[j].label, ": ", circleB.getPosition().x, " ", circleB.getPosition().y);
            const overlapDistance = minDist - distanceBetweenCenters;
            const percentOverlap = overlapDistance / minDist;

            // Update refs with constrained positions
            const newPosA = constrainToWindow({
              x: circleA.getPosition().x - dx * percentOverlap,
              y: circleA.getPosition().y - dy * percentOverlap
            }, items[i].radius);

            const newPosB = constrainToWindow({
              x: circleB.getPosition().x + dx * percentOverlap,
              y: circleB.getPosition().y + dy * percentOverlap
            }, items[j].radius);

            // Smooth the transition by interpolating between current and new positions
            circleA.setPosition({
              x: circleA.getPosition().x + (newPosA.x - circleA.getPosition().x) * 0.3,
              y: circleA.getPosition().y + (newPosA.y - circleA.getPosition().y) * 0.3
            });

            circleB.setPosition({
              x: circleB.getPosition().x + (newPosB.x - circleB.getPosition().x) * 0.3,
              y: circleB.getPosition().y + (newPosB.y - circleB.getPosition().y) * 0.3
            });

            // Update state positions
            setBubblePositions(prev => {
              const newPositions = [...prev];
              if (!circleA.getIsDragging()) {
                newPositions[i] = circleA.getPosition();
              }
              if (!circleB.getIsDragging()) {
                newPositions[j] = circleB.getPosition();
              }
              return newPositions;
            });
          } 
          
          console.log("isAnyBubbleDragging: ", isAnyBubbleDragging, " isAnyBubbleOutOfPosition: ", isAnyBubbleOutOfPosition);
          if ((!isAnyBubbleDragging) && (isAnyBubbleOutOfPosition)) {
            console.log("Moving bubbles back to initial positions");
            // Move bubbles back to their initial positions if not being dragged
            if (!circleA.getIsDragging()) {
              const initialPosA = initialPositions[i];
              circleA.setPosition({
                x: circleA.getPosition().x + (initialPosA.x - circleA.getPosition().x) * 0.1,
                y: circleA.getPosition().y + (initialPosA.y - circleA.getPosition().y) * 0.1
              });
            }
            if (!circleB.getIsDragging()) {
              const initialPosB = initialPositions[j];
              circleB.setPosition({
                x: circleB.getPosition().x + (initialPosB.x - circleB.getPosition().x) * 0.1,
                y: circleB.getPosition().y + (initialPosB.y - circleB.getPosition().y) * 0.1
              });
            }

            // Update state positions
            setBubblePositions(prev => {
              const newPositions = [...prev];
              if (!circleA.getIsDragging()) {
                newPositions[i] = circleA.getPosition();
              }
              if (!circleB.getIsDragging()) {
                newPositions[j] = circleB.getPosition();
              }
              return newPositions;
            });
          }
        }
      }
    }, 1000 / 120); // 120 times per second

    return () => clearInterval(interval);
  }, []);


  return (
    <View style={styles.container}>
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
          getPosition={() => bubbleRefs.current[items[0].label]?.getPosition()}
          setPosition={(pos) => bubbleRefs.current[items[0].label]?.setPosition(pos)}
          ref={(ref: { getPosition: () => Position; setPosition: (pos: Position) => void; getIsDragging: () => boolean } | null) => {
            if (ref) {
              bubbleRefs.current[items[0].label] = {
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
              getPosition={() => bubbleRefs.current[item.label]?.getPosition()}
              setPosition={(pos) => bubbleRefs.current[item.label]?.setPosition(pos)}
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