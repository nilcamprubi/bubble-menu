import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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

const BubbleMenu = ({ items, menuDistance, height, width, bubbleRadius = 50, style, bubbleComponent } : BubbleMenuProps) => {
  console.log("BubbleMenu Rendered")
  // Window dimensions and center points
  const centerX = width / 2;
  const centerY = height / 2;

  // Refs and State
  const bubbleRefs = useRef<Record<string, BubbleRef>>({});
  const [isAnyBubbleDragging, setIsAnyBubbleDragging] = useState(false);
  
  // Use refs for positions to avoid re-renders
  const bubblePositionsRef = useRef<Record<string, Position>>({});
  const positionDifferencesRef = useRef<Record<string, Position>>({});
  const UISyncRef = useRef<number>(1);
  const animationFrameRef = useRef<number | null>(null);

  // Utility Functions
  const constrainToWindow = useCallback((pos: Position, radius: number): Position => ({
    x: Math.max(40, Math.min(width - radius * 2 - 40, pos.x)),
    y: Math.max(0, Math.min(height - radius * 2, pos.y))
  }), [width, height]);

  const clampPosition = useCallback((pos: Position, radius: number): Position => ({
    x: Math.max(0, Math.min(width - radius * 2, pos.x)),
    y: Math.max(0, Math.min(height - radius * 2, pos.y))
  }), [width, height]);

  // Memoized initial positions
  const initialPositions = useMemo(() => {
    const positions: Record<string, Position> = {};
    items.forEach((item, index) => {
      const menuRotation = 4;
      const angle = index === 0 ? 0 : (index * (2 * Math.PI)) / (items.length - 1) - Math.PI / menuRotation;
      const radius = menuDistance + 130;
      const distance = index === 0 ? 0 : radius;
      const x = centerX + Math.cos(angle) * distance - bubbleRadius;
      const y = centerY + Math.sin(angle) * distance - bubbleRadius;
      positions[item.id] = constrainToWindow({ x, y }, bubbleRadius);
    });
    return positions;
  }, [items, centerX, centerY, menuDistance, width, height, bubbleRadius, constrainToWindow]);

  // Initialize positions only once
  useEffect(() => {
    bubblePositionsRef.current = { ...initialPositions };
  }, [initialPositions]);

  const updateBubblePosition = useCallback((id: string, newPosition: Position) => {
    bubblePositionsRef.current = {
      ...bubblePositionsRef.current,
      [id]: newPosition
    };
  }, []);


  // Optimized collision detection
  const getDistanceData = useCallback((idA: string, idB: string) => {
    const bubbleAPos = bubblePositionsRef.current[idA];
    const bubbleBPos = bubblePositionsRef.current[idB];
    if (!bubbleAPos || !bubbleBPos) return null;
    
    const dx = bubbleBPos.x - bubbleAPos.x;
    const dy = bubbleBPos.y - bubbleAPos.y;
    const minDist = bubbleRadius * 2 + 10;

    return { 
      distanceBetweenCenters: Math.hypot(dx, dy), 
      dx, 
      dy, 
      minDist 
    };
  }, [bubbleRadius]);

  const checkCollision = useCallback((idA: string, idB: string): { isColliding: boolean, id: string } => {
    const distanceData = getDistanceData(idA, idB);
    if (!distanceData) return { isColliding: false, id: idB };
    
    const { distanceBetweenCenters, minDist } = distanceData;
    return { isColliding: distanceBetweenCenters < minDist, id: idB };
  }, [getDistanceData]);

  const checkIndividualCollision = useCallback((idA: string) => {
    return items.some(other => {
      if (other.id === idA) return false;
      const distanceData = getDistanceData(idA, other.id);
      return distanceData && distanceData.distanceBetweenCenters < distanceData.minDist;
    });
  }, [items, getDistanceData]);

  // Optimized collision handling
  const handleCollision = useCallback((idA: string, idB: string) => {
    const distanceData = getDistanceData(idA, idB);
    if (!distanceData) return;

    const { minDist, dx, dy } = distanceData;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) return;

    const overlap = minDist - distance;
    let moveX = (dx / distance) * (overlap / 2);
    let moveY = (dy / distance) * (overlap / 2);
    
    if (Math.abs(moveX) < 0.5 && Math.abs(moveY) < 0.5) {
      const nudge = 1;
      moveX = dx === 0 ? nudge : (dx / Math.abs(dx)) * nudge;
      moveY = dy === 0 ? nudge : (dy / Math.abs(dy)) * nudge;
    }
    
    const bubbleAPos = bubblePositionsRef.current[idA];
    const bubbleBPos = bubblePositionsRef.current[idB];
    if (!bubbleAPos || !bubbleBPos) return;

    const updatedPosA = clampPosition({
      x: bubbleAPos.x - moveX,
      y: bubbleAPos.y - moveY
    }, bubbleRadius);
    
    const updatedPosB = clampPosition({
      x: bubbleBPos.x + moveX,
      y: bubbleBPos.y + moveY
    }, bubbleRadius);

    // Update positions without triggering immediate re-renders
    if (!bubbleRefs.current[idA]?.getIsDragging()) {
      updateBubblePosition(idA, updatedPosA);
    }
    if (!bubbleRefs.current[idB]?.getIsDragging()) {
      updateBubblePosition(idB, updatedPosB);
    }
  }, [getDistanceData, clampPosition, bubbleRadius, updateBubblePosition]);

  // Optimized position checking
  const isBubbleOutOfPosition = useCallback((id: string) => {
    const initialPos = initialPositions[id];
    const bubblePos = bubblePositionsRef.current[id];
    if (!initialPos || !bubblePos) return false;

    const threshold = 1; // Increased threshold to reduce micro-movements
    return Math.abs(initialPos.x - bubblePos.x) > threshold || 
           Math.abs(initialPos.y - bubblePos.y) > threshold;
  }, [initialPositions]);

  const isAnyBubbleOutOfPosition = useCallback(() => {
    const bubblesOutOfPosition: string[] = [];
    
    for (const item of items) {
      if (isBubbleOutOfPosition(item.id)) {
        bubblesOutOfPosition.push(item.id);
      }
    }
    
    return { result: bubblesOutOfPosition.length > 0, array: bubblesOutOfPosition };
  }, [items, isBubbleOutOfPosition]);

  // Optimized return to initial positions
  const moveBubblesBackToInitialPositions = useCallback(() => {
    let hasUpdates = false;
    
    items.forEach(item => {
      const bubble = bubbleRefs.current[item.id];
      if (!bubble || bubble.getIsDragging()) return;

      const collision = checkIndividualCollision(item.id);
      const isOutOfPosition = isBubbleOutOfPosition(item.id);

      if (!collision && isOutOfPosition) {
        const initialPos = initialPositions[item.id];
        const bubblePos = bubblePositionsRef.current[item.id];
        if (!initialPos || !bubblePos) return;

        const deltaX = (initialPos.x - bubblePos.x) * 0.5;
        const deltaY = (initialPos.y - bubblePos.y) * 0.5;
        
        const nextPos = {
          x: Math.abs(deltaX) < 0.5 ? initialPos.x : bubblePos.x + deltaX,
          y: Math.abs(deltaY) < 0.5 ? initialPos.y : bubblePos.y + deltaY
        };

        updateBubblePosition(item.id, nextPos);
        hasUpdates = true;
      }
    });
    
    return hasUpdates;
  }, [items, checkIndividualCollision, isBubbleOutOfPosition, initialPositions, updateBubblePosition]);

  // Optimized UI update
  const updateUI = useCallback(() => {
    let hasUIUpdates = false;
    
    for (const item of items) {
      const bubble = bubbleRefs.current[item.id];
      if (!bubble) continue;
      
      const UIPos = bubble.getPosition();
      const logicPos = bubblePositionsRef.current[item.id];
      if (!logicPos) continue;
      
      if (UISyncRef.current === 1) {
        positionDifferencesRef.current[item.id] = {
          x: logicPos.x - UIPos.x,
          y: logicPos.y - UIPos.y
        };
      }
      
      const positionDifference = positionDifferencesRef.current[item.id];
      if (positionDifference && (Math.abs(positionDifference.x) > 0.1 || Math.abs(positionDifference.y) > 0.1)) {
        const stepSize = 1 / K.FPS_SYNC;
        const step = {
          x: positionDifference.x * stepSize,
          y: positionDifference.y * stepSize
        };
        
        const newPos = {
          x: UIPos.x + step.x,
          y: UIPos.y + step.y
        };
        
        bubble.setPosition(newPos);
        hasUIUpdates = true;
      }
    }
    
    return hasUIUpdates;
  }, [items]);

  // Main logic loop with reduced frequency
  useEffect(() => {
    let logicTimeoutId: NodeJS.Timeout;
    let uiTimeoutId: NodeJS.Timeout;
    
    const runLogicLoop = () => {
      const { result, array } = isAnyBubbleOutOfPosition();
      
      if (result) {
        // Process collisions
        for (let i = 0; i < array.length; i++) {
          const previouslyChecked = new Set(array.slice(0, i));
          
          for (const item of items) {
            if (array[i] === item.id || previouslyChecked.has(item.id)) continue;
            
            if (checkCollision(array[i], item.id).isColliding) {
              handleCollision(array[i], item.id);
            }
          }
        }
        
        moveBubblesBackToInitialPositions();
      }
      
      logicTimeoutId = setTimeout(runLogicLoop, 1000 / K.FPS_LOGIC);
    };
    
    const runUILoop = () => {
      if (isAnyBubbleOutOfPosition().result) {
        updateUI();
        UISyncRef.current = (UISyncRef.current % 3) + 1;
      }
      
      uiTimeoutId = setTimeout(runUILoop, 1000 / K.FPS_UI);
    };
    
    logicTimeoutId = setTimeout(runLogicLoop, 1000 / K.FPS_LOGIC);
    uiTimeoutId = setTimeout(runUILoop, 1000 / K.FPS_UI);
    
    return () => {
      clearTimeout(logicTimeoutId);
      clearTimeout(uiTimeoutId);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnyBubbleOutOfPosition, items, checkCollision, handleCollision, moveBubblesBackToInitialPositions, updateUI]);

  // Memoized bubble wrapper components
  const centerBubble = useMemo(() => (
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
          bubbleRefs.current[items[0].id || ""] = ref;
        }
      }}
    />
  ), [items[0], bubbleRadius, initialPositions, style?.bubble, bubbleComponent, updateBubblePosition, height, width]);

  const surroundingBubbles = useMemo(() => 
    items.slice(1).map((item) => (
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
            bubbleRefs.current[item.id] = ref;
          }
        }}
      />
    ))
  , [items, bubbleRadius, initialPositions, style?.bubble, bubbleComponent, updateBubblePosition, height, width]);

  return (
    <View style={[styles.container, style?.container]}>
      {centerBubble}
      {surroundingBubbles}
    </View>
  );
};

export default React.memo(BubbleMenu);