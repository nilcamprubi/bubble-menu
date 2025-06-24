import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, ViewStyle } from 'react-native';
import type { BubbleProps, BubbleStyleProps, Position } from './BubbleWrapper';
import BubbleWrapper from './BubbleWrapper';
import { styles } from '../styles';
import { K } from '../constants';

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
  const bubblePositionsRef = useRef<Record<string, Position>>(bubblePositions);
  const positionDifferencesRef = useRef<Record<string, Position>>({});
  const UISyncRef = useRef<number>(1);

  
  const updateBubblePosition = (id: string, newPosition: Position) => {
    setBubblePositions(prev => {
      const newPositions = { ...prev };
      newPositions[id] = newPosition;
      return newPositions;
    });
  }


  useEffect(() => {
    bubblePositionsRef.current = bubblePositions;
  }, [bubblePositions]);

  // Bubble State Management
  // Checks if a specific bubble is being dragged
  const isBubbleDragging = (id: string) => 
    bubbleRefs.current[id]?.getIsDragging();

  // Get distance data between two bubbles
  const getDistanceData = (idA: string, idB: string) => {
    const bubbleAPos = bubblePositionsRef.current[idA];
    const bubbleBPos = bubblePositionsRef.current[idB];
    const dx = bubbleBPos.x - bubbleAPos.x;
    const dy = bubbleBPos.y - bubbleAPos.y;
    const minDist = bubbleRadius + bubbleRadius + 10; // Minimum distance between bubbles

    return { 
      distanceBetweenCenters: Math.hypot(dx, dy), 
      dx, 
      dy, 
      minDist 
    };
  };

  // Collision Detection: Checks for collisions between bubbles
  function checkCollision(idA: string, idB: string): { isColliding: boolean, id: string } {
    console.log("Checking collision between: ", idA, " and ", idB)
    const { distanceBetweenCenters, minDist } = getDistanceData(idA, idB);
    return { isColliding: distanceBetweenCenters < minDist, id: idB };
  }

    // Collision Detection: Checks for collisions between bubbles
    function checkIndividualCollision(idA: string) {
      // Check collision with all other bubbles
      for (const other of items) {
        if (other.id === idA) continue;
        const { distanceBetweenCenters, minDist } = getDistanceData(idA, other.id);
        if (distanceBetweenCenters < minDist) {
          return true;
        }
      }
      return false;
    }

  // Handle collision between two bubbles
  const handleCollision = (idA: string, idB: string) => {
    console.log("Handling collision between ", idA, " and ", idB); 

    // Distance data fetching
    const { minDist, dx, dy } = getDistanceData(idA, idB);

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
    
    const bubbleAPos = bubblePositionsRef.current[idA];
    const bubbleBPos = bubblePositionsRef.current[idB];

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


    // Update state
    setBubblePositions(prev => {
      const newPositions = { ...prev };
      if (!bubbleRefs.current[idA]?.getIsDragging()) newPositions[idA] = updatedPosA;
      if (!bubbleRefs.current[idB]?.getIsDragging()) newPositions[idB] = updatedPosB;
      return newPositions;
    });
  };

  const isBubbleOutOfPosition = (id: string) => {
    const initialPos = initialPositions[id];
    const bubble = bubbleRefs.current[id];
    const bubblePos = bubblePositionsRef.current[id];

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
    let anyBubbleOut = false;
    const bubblesOutOfPosition: string[] = [];
    items.some(item => {
      const initialPos = initialPositions[item.id];

      // Compare positions with no decimals
      const roundedInitialX = Math.round(initialPos.x);
      const roundedInitialY = Math.round(initialPos.y);
      const roundedBubbleX = Math.round(bubblePositionsRef.current[item.id].x);
      const roundedBubbleY = Math.round(bubblePositionsRef.current[item.id].y);

      if (roundedInitialX !== roundedBubbleX || roundedInitialY !== roundedBubbleY) {
        anyBubbleOut = true;
        bubblesOutOfPosition.push(item.id);
      }
    });    

    return {result: anyBubbleOut, array: bubblesOutOfPosition}
  }

  // Helper: Check if moving a bubble to a position would cause a collision
  const willCollideAtPosition = (id: string, targetPos: Position) => {
    for (const other of items) {
      if (other.id === id) continue;
      const otherPos = bubblePositionsRef.current[other.id];
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
      const collision = checkIndividualCollision(item.id);
      const movableBubble = !collision && isBubbleOutOfPosition(item.id);

      if (!isBubbleDragging(item.id) && movableBubble) {
        const initialPos = initialPositions[item.id];
        const bubble = bubbleRefs.current[item.id];

        if (!bubble) {
          console.warn(`Bubble reference not found for ${item.id}`);
          return;
        }

        if (!bubble.getIsDragging()) {
          const bubblePos = bubblePositionsRef.current[item.id];
          const deltaX = (initialPos.x - bubblePos.x) * 0.5;
          const deltaY = (initialPos.y - bubblePos.y) * 0.5;
          const nextPos = {
            x: Math.abs(initialPos.x - bubblePos.x) < 0.5 ? initialPos.x : bubblePos.x + deltaX,
            y: Math.abs(initialPos.y - bubblePos.y) < 0.5 ? initialPos.y : bubblePos.y + deltaY
          };

          // Only move if it won't cause a collision
          if (!willCollideAtPosition(item.id, nextPos)) {
            setBubblePositions(prev => {
              const newPositions = { ...prev };
              if (!bubble.getIsDragging()) {
                newPositions[item.id] = nextPos;
              }
              return newPositions;
            });
          }
        }
      }
    });
  };

  const updateUI = () => {
    for (const item of items) {
      const bubble = bubbleRefs.current[item.id];
      const UIPos = bubble?.getPosition()!;
      const logicPos = bubblePositionsRef.current[item.id];
      
      // Calculate initial difference when logic updates (every 3 UI frames)
      if (UISyncRef.current === 1) {
        positionDifferencesRef.current[item.id] = {
          x: logicPos.x - UIPos.x,
          y: logicPos.y - UIPos.y
        };
      }
      
      const positionDifference = positionDifferencesRef.current[item.id];
      if (positionDifference && (positionDifference.x !== 0 || positionDifference.y !== 0)) {
        // Move by 1/3 of the total difference each frame
        const stepSize = 1 / K.FPS_SYNC; // 1/3 if UI=60, Logic=20
        const step = {
          x: positionDifference.x * stepSize,
          y: positionDifference.y * stepSize
        };
        
        const newPos = {
          x: UIPos.x + step.x,
          y: UIPos.y + step.y
        };
        

        bubble?.setPosition(newPos);
      }
    }
  };

  // Collision Detection Effect
  useEffect(() => {
    const interval_Logic = setInterval(() => {
      const { result, array } = isAnyBubbleOutOfPosition(); 
      if (result === true) { 
        // Check for collisions between all bubble pairs
        for (let i = 0; i < array.length; i++) {
          console.log("array: ", array)
          // Create a set of previously checked array items (from 0 to i-1)
          const previouslyChecked = new Set(array.slice(0, i));

          for (let j = 0; j < items.length; j++) {

            // Skip if it is the same bubble
            if (array[i] === items[j].id) continue;

            // Skip if items[j].id was checked before in array[0..i-1]
            if (previouslyChecked.has(items[j].id)) continue;

            if (checkCollision(array[i], items[j].id).isColliding) {
              console.log("Handling Collision between ", items[i].id, " and ", items[j].id)
              handleCollision(array[i], items[j].id);
            } 
          }
        }
        moveBubblesBackToInitialPositions();
      }
    }, 1000 / K.FPS_LOGIC);


    const interval_UI = setInterval(() => { 
      if (isAnyBubbleOutOfPosition().result) {
        updateUI();
        UISyncRef.current = (UISyncRef.current % 3) + 1;
      }
    }, 1000 / K.FPS_UI);

    return () => {
      clearInterval(interval_Logic);
      clearInterval(interval_UI);
    };
  }, [initialPositions, items]);

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
          updateBubblePositions={updateBubblePosition}
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
              updateBubblePositions={updateBubblePosition}
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