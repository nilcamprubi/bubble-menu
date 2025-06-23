import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, ViewStyle } from 'react-native';
import type { BubbleProps, BubbleStyleProps, Position } from './BubbleWrapper';
import BubbleWrapper from './BubbleWrapper';
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
  menuDistance: number // Radius of the menu
  height: number
  width: number
  bubbleRadius?: number
  style?: BubbleMenuStyleProps // Style for the menu and its bubbles
  bubbleComponent?: React.ComponentType<BubbleProps>;
}

// Define the ref type
type BubbleRef = {
  getPosition: () => Position;
  setPosition: (pos: Position) => void;
  getIsDragging: () => boolean;
  getAvoidCollision: () => boolean;
  setAvoidCollision: (value: boolean) => void;
} | null;


 // BubbleMenu Component: Creates a circular menu with draggable bubbles that can interact with each other
 
const BubbleMenu = ({ items, menuDistance, height, width, bubbleRadius, style, bubbleComponent } : BubbleMenuProps) => {
  // Window dimensions and center points
  const centerX = width / 2;
  const centerY = height / 2;

  if (bubbleRadius === undefined) {
    bubbleRadius = 50;
  }

  // Refs and State
  const bubbleRefs = useRef<Record<string, BubbleRef>>({});
  const [isAnyBubbleDragging, setIsAnyBubbleDragging] = useState(false);

  // Utility Functions
  // Keep position within window bounds
  const constrainToWindow = (pos: Position, radius: number): Position => ({
    x: Math.max(40, Math.min(width - radius * 2 - 40, pos.x)),
    y: Math.max(0, Math.min(height - radius * 2, pos.y))
  });

  // Clamp a position to the box bounds for a given radius
  const clampPosition = (pos: Position, radius: number): Position => ({
    x: Math.max(0, Math.min(width - radius * 2, pos.x)),
    y: Math.max(0, Math.min(height - radius * 2, pos.y))
  });

  // Calculates initial positions for all bubbles in a circular formation
  const initialPositions = useMemo(() => {
    const positions: Record<string, Position> = {};
    items.forEach((item, index) => {
      const menuRotation = 4; // Controls the rotation of the bubble formation
      const angle = index === 0 ? 0 : (index * (2 * Math.PI)) / (items.length - 1) - Math.PI / menuRotation;
      const radius = menuDistance + 130; // Distance between bubbles, minimum distance is 130
      const distance = index === 0 ? 0 : radius;
      const x = centerX + Math.cos(angle) * distance - bubbleRadius;
      const y = centerY + Math.sin(angle) * distance - bubbleRadius;
      positions[item.id] = constrainToWindow({ x, y }, bubbleRadius);
    });
    return positions;
  }, [items, centerX, centerY, menuDistance, width, height]);

  const [bubblePositions, setBubblePositions] = useState<Record<string, Position>>(initialPositions); // State for the positions of the bubbles
  console.log("bubblePositions", bubblePositions);

  // Bubble State Management
  // Checks if a specific bubble is being dragged
  const isBubbleDragging = (id: string) => 
    bubbleRefs.current[id]?.getIsDragging();

  // Get distance data between two bubbles
  const getDistanceData = (idA: string, idB: string) => {
    const bubbles = bubbleRefs.current;
    const bubbleA = bubbles[idA];
    const bubbleB = bubbles[idB];

    if (!bubbleA || !bubbleB) {
      throw new Error(`Bubble references not found for ids ${idA} and ${idB}`);
    }

    const bubbleAPos = bubbleA.getPosition();
    const bubbleBPos = bubbleB.getPosition();
    const dx = bubbleBPos.x - bubbleAPos.x;
    const dy = bubbleBPos.y - bubbleAPos.y;
    const minDist = bubbleRadius + bubbleRadius + 10; // Minimum distance between bubbles

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
  function checkCollision(idA: string, idB?: string): { isColliding: boolean, id: string | undefined } {
    if (idB !== undefined) {
      const { distanceBetweenCenters, minDist } = getDistanceData(idA, idB);
      return { isColliding: distanceBetweenCenters < minDist, id: idB };
    }

    // Check collision with all other bubbles
    for (const other of items) {
      if (other.id === idA) continue;
      const { distanceBetweenCenters, minDist } = getDistanceData(idA, other.id);
      if (distanceBetweenCenters < minDist) {
        return { isColliding: true, id: other.id };
      }
    }
    return { isColliding: false, id: undefined };
  }

  // Handle collision between two bubbles
  const handleCollision = (idA: string, idB: string) => {
    // Distance data fetching
    const { minDist, bubbleA, bubbleB, dx, dy } = getDistanceData(idA, idB);

    if (!bubbleA || !bubbleB) {
      console.warn('Cannot handle collision: bubble references are null');
      return;
    } else {
      console.log("Handling collision between ", idA, " and ", idB);
    }

    const distance = Math.hypot(dx, dy);
    if (distance === 0) return; // Prevent division by zero

    const overlap = minDist - distance;
    let moveX = (dx / distance) * (overlap / 2);
    let moveY = (dy / distance) * (overlap / 2);
    
    // If movement is too small, force a nudge
    if (Math.abs(moveX) < 0.5 && Math.abs(moveY) < 0.5) {
      const nudge = 1;
      moveX = dx === 0 ? nudge : (dx / Math.abs(dx)) * nudge;
      moveY = dy === 0 ? nudge : (dy / Math.abs(dy)) * nudge;
    }
    
    const bubbleAPos = bubbleA.getPosition();
    const bubbleBPos = bubbleB.getPosition();

    console.log("Move X: ", moveX);
    console.log("Move Y: ", moveY);
    console.log("Bubble A Pos: ", bubbleAPos);
    console.log("Bubble B Pos: ", bubbleBPos);

    // Update positions with smooth interpolation
    const radiusA = bubbleRadius;
    const radiusB = bubbleRadius;
    const unclampedPosA = {
      x: bubbleAPos.x - moveX,
      y: bubbleAPos.y - moveY
    };
    const unclampedPosB = {
      x: bubbleBPos.x + moveX,
      y: bubbleBPos.y + moveY
    };
    const updatedPosA = clampPosition(unclampedPosA, radiusA);
    const updatedPosB = clampPosition(unclampedPosB, radiusB);

    console.log("Updated Pos A: ", updatedPosA);
    console.log("Updated Pos B: ", updatedPosB);

    // Apply new positions
    bubbleA.setPosition(updatedPosA);
    bubbleB.setPosition(updatedPosB);

    // Update state
    setBubblePositions(prev => {
      const newPositions = { ...prev };
      if (!bubbleA.getIsDragging()) newPositions[idA] = bubbleA.getPosition();
      if (!bubbleB.getIsDragging()) newPositions[idB] = bubbleB.getPosition();
      return newPositions;
    });
  };

  const isBubbleOutOfPosition = (id: string) => {
    const initialPos = initialPositions[id];
    const bubble = bubbleRefs.current[id];
    const bubblePos = bubble?.getPosition();

    if (!bubble) {
      console.warn(`Bubble reference not found for ${id}`);
      return false;
    }

    const roundedInitialX = Math.round(initialPos.x);
    const roundedInitialY = Math.round(initialPos.y);
    const roundedBubbleX = Math.round(bubblePos!.x);
    const roundedBubbleY = Math.round(bubblePos!.y);

    return roundedInitialX !== roundedBubbleX || roundedInitialY !== roundedBubbleY;
  };

  // Check if any bubble is out of position
  const isAnyBubbleOutOfPosition = () => {
    return items.some(item => {
      const initialPos = initialPositions[item.id];
      const bubble = bubbleRefs.current[item.id];

      if (!bubble) {
        console.warn(`Bubble reference not found for ${item.id}`);
        return false;
      }

      const bubblePos = bubble.getPosition();

      // Compare positions with no decimals
      const roundedInitialX = Math.round(initialPos.x);
      const roundedInitialY = Math.round(initialPos.y);
      const roundedBubbleX = Math.round(bubblePos.x);
      const roundedBubbleY = Math.round(bubblePos.y);

      return roundedInitialX !== roundedBubbleX || roundedInitialY !== roundedBubbleY;
    });    
  }

  // Helper: Check if moving a bubble to a position would cause a collision
  const willCollideAtPosition = (id: string, targetPos: Position) => {
    for (const other of items) {
      if (other.id === id) continue;
      const otherBubble = bubbleRefs.current[other.id];
      if (!otherBubble) continue;
      const otherPos = otherBubble.getPosition();
      const dx = otherPos.x - targetPos.x;
      const dy = otherPos.y - targetPos.y;
      const minDist = (bubbleRadius ?? 50) * 2 + 10;
      if (Math.hypot(dx, dy) < minDist) {
        return true;
      }
    }
    return false;
  };

  // Move bubbles back to their initial positions
  const moveBubblesBackToInitialPositions = () => {
    items.forEach(item => {
      const collision = checkCollision(item.id);
      const movableBubble = !collision.isColliding && isBubbleOutOfPosition(item.id);

      if (!isBubbleDragging(item.id) && movableBubble) {
        const initialPos = initialPositions[item.id];
        const bubble = bubbleRefs.current[item.id];

        if (!bubble) {
          console.warn(`Bubble reference not found for ${item.id}`);
          return;
        }

        if (!bubble.getIsDragging()) {
          const bubblePos = bubble.getPosition();
          const deltaX = (initialPos.x - bubblePos.x) * 0.05;
          const deltaY = (initialPos.y - bubblePos.y) * 0.05;
          const nextPos = {
            x: Math.abs(initialPos.x - bubblePos.x) < 0.5 ? initialPos.x : bubblePos.x + deltaX,
            y: Math.abs(initialPos.y - bubblePos.y) < 0.5 ? initialPos.y : bubblePos.y + deltaY
          };

          // Only move if it won't cause a collision
          if (!willCollideAtPosition(item.id, nextPos)) {
            bubble.setPosition(nextPos);
          }
        }

        setBubblePositions(prev => {
          const newPositions = { ...prev };
          if (!bubble.getIsDragging()) {
            newPositions[item.id] = bubble.getPosition();
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
            if (checkCollision(items[i].id, items[j].id).isColliding) {
              handleCollision(items[i].id, items[j].id);
            } 
          }
        }
        moveBubblesBackToInitialPositions();
      }
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(interval);
  }, []);

  // Render
  return (
    <View style={[styles.container, style?.container]}>
      {/* Center Bubble */}
        <BubbleWrapper 
          key={items[0].id}
          item={{
            ...items[0],
            radius: bubbleRadius,
            originalX: initialPositions[items[0].id]?.x ?? 0,
            originalY: initialPositions[items[0].id]?.y ?? 0,
            style: style?.bubble,
          }}
          bubbleComponent={bubbleComponent}
          setIsAnyBubbleDragging={setIsAnyBubbleDragging}
          height={height}
          width={width}
          ref={(ref: BubbleRef) => {
            if (ref) {
              bubbleRefs.current[items[0].id || ""] = {
                getPosition: ref.getPosition,
                setPosition: ref.setPosition,
                getIsDragging: ref.getIsDragging,
                getAvoidCollision: ref.getAvoidCollision,
                setAvoidCollision: ref.setAvoidCollision
              };
            }
          }}
        />

      {/* Surrounding Bubbles */}
      {items.slice(1).map((item) => {
        return (
            <BubbleWrapper 
              key={item.id}
              item={{
                ...item,
                radius: bubbleRadius,
                originalX: initialPositions[item.id]?.x ?? 0,
                originalY: initialPositions[item.id]?.y ?? 0,
                style: style?.bubble,
              }}
              bubbleComponent={bubbleComponent}
              setIsAnyBubbleDragging={setIsAnyBubbleDragging}
              height={height}
              width={width}
              ref={(ref: BubbleRef) => {
                if (ref) {
                  bubbleRefs.current[item.id] = {
                    getPosition: ref.getPosition,
                    setPosition: ref.setPosition,
                    getIsDragging: ref.getIsDragging,
                    getAvoidCollision: ref.getAvoidCollision,
                    setAvoidCollision: ref.setAvoidCollision
                  };
                }
              }}
            />
        );
      })}
    </View>
  );
};

export default BubbleMenu; 