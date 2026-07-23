import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, shadows } from '../constants/colors';

const Card = ({ 
  children, 
  onPress, 
  style, 
  padding = 16,
  shadow = 'small',
}) => {
  const getShadow = () => {
    switch (shadow) {
      case 'medium':
        return shadows.medium;
      case 'large':
        return shadows.large;
      case 'none':
        return {};
      default:
        return shadows.small;
    }
  };

  const cardStyle = [
    styles.card,
    getShadow(),
    { padding },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity 
        style={cardStyle} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginVertical: 6,
  },
});

export default Card;
