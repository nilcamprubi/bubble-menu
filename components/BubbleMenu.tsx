import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import Bubble from './Bubble'
import type { BubbleProps, Position } from './Bubble';
import { styles } from '../styles';

interface BubbleMenuProps {
  items: BubbleProps[]
}

const BubbleMenu = ({ items } : BubbleMenuProps) => {
  const { width, height } = Dimensions.get('window');
  const centerX = width / 2;
  const centerY = height / 2;
  const bubbleRefs = useRef<Record<string, { getPosition: () => Position; setPosition: (pos: Position) => void; getIsDragging: () => boolean }>>({});
  const [collisionMatrix, setCollisionMatrix] = useState<boolean[][]>(
    Array.from({ length: items.length }, () =>
      Array.from({ length: items.length }, () => false)
    )
  );

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
      const distance = index === 0 ? 0 : 110;
      const x = centerX + Math.cos(angle) * distance - item.radius;
      const y = centerY + Math.sin(angle) * distance - item.radius;
  
      return constrainToWindow({ x, y }, item.radius);
    });
  }, [items, centerX, centerY]);
  const [bubblePositions, setBubblePositions] = useState<Position[]>(initialPositions);

  // Check if any bubble is being dragged
  const isAnyBubbleDragging = () => {
    return items.some(item => bubbleRefs.current[item.label]?.getIsDragging());
  };

  const checkCollision = (i: number, j: number) => {
    const bubbles = bubbleRefs.current;
    const circleA = bubbles[items[i].label];
    const circleB = bubbles[items[j].label];

    // Minimum distance between bubbles
    const minDist = items[i].radius + items[j].radius + 10; 

    // Distance between centers of bubbles
    const dx = circleB.getPosition().x - circleA.getPosition().x;
    const dy = circleB.getPosition().y - circleA.getPosition().y;
    const distanceBetweenCenters = Math.hypot(dx, dy);

    // Check if bubbles are overlapping
    const areOverlapping = distanceBetweenCenters < minDist;

    // if (areOverlapping) { console.log("Collision: ", items[i].label, " and ", items[j].label, " ", areOverlapping); }

    return areOverlapping;
  };

  // Move bubbles back to their initial positions
  const moveBubblesBackToInitialPositions = () => {
    if ((!isAnyBubbleDragging())) {
      items.forEach(item => {
        const index = items.indexOf(item);
        const initialPos = initialPositions[index];
        const circle = bubbleRefs.current[item.label];

        if (!circle.getIsDragging()) {
          circle.setPosition({
            x: circle.getPosition().x + (initialPos.x - circle.getPosition().x) * 0.1,
            y: circle.getPosition().y + (initialPos.y - circle.getPosition().y) * 0.1
          });
        }

        setBubblePositions(prev => {
          const newPositions = [...prev];
          if (!circle.getIsDragging()) {
            newPositions[index] = circle.getPosition();
          }
          return newPositions;
        });
      });
    }
  };

  // Collision detection
  useEffect(() => {
    const interval = setInterval(() => {
      const bubbles = bubbleRefs.current;
      
      // Collision detection
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          // Distance between centers of bubbles
          const bubbles = bubbleRefs.current;
          const circleA = bubbles[items[i].label];
          const circleB = bubbles[items[j].label];
      
          // Minimum distance between bubbles
          const minDist = items[i].radius + items[j].radius + 10; 
      
          // Distance between centers of bubbles
          const dx = circleB.getPosition().x - circleA.getPosition().x;
          const dy = circleB.getPosition().y - circleA.getPosition().y;
          const distanceBetweenCenters = Math.hypot(dx, dy);
          
          // If bubbles are overlapping, move them apart
          if (checkCollision(i, j)) {
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
          moveBubblesBackToInitialPositions();
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

export default BubbleMenu; 