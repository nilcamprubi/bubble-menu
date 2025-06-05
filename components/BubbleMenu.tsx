import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import BubbleSelect, { Bubble, BubbleNode } from 'react-native-bubble-select';
import Circle from './Circle';


export interface BubbleItem {
  label: string;
  radius: number;
}

interface BubbleMenuProps {
  items: BubbleItem[];
}

const BubbleMenu: React.FC<BubbleMenuProps> = ({
  items
}) => {
  const { width, height } = Dimensions.get('window');

  // Handles the selection of a menu category.
  const handleSelect = (bubble: BubbleNode): void => {
    console.log('Selected: ', bubble.id)
  }

  return (
    <View style={styles.container}>
      <BubbleSelect
        onSelect={bubble => handleSelect(bubble)}
        width={width}
        height={height}
        allowsMultipleSelection={false}
        maxSelectedItems={1}
        bubbleSize={0}
      >
        {items.map((item) => {
          console.log("Bubble printed:", item.label);
          return (
            <Bubble 
              key={item.label} 
              id={item.label} 
              text={item.label}
              fontColor='white'
              color='black'
              selectedColor='blue'
              selectedScale={1.1}
              marginScale={1.2}
              radius={item.radius}
              autoSize={true}
            />
          );
        })} 
      </BubbleSelect>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center'
  },
  itemContainer: {
    position: 'absolute',
  },
});

export default BubbleMenu; 