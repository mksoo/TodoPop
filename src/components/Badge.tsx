import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

import { colors } from '../styles';


interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Badge: React.FC<BadgeProps> = ({ label, color = colors.grayscale[200], textColor = colors.grayscale[700], style, textStyle }) => {
  return (
    <View style={[styles.badge, { backgroundColor: color }, style]}>
      <Text style={[styles.badgeText, { color: textColor }, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: colors.grayscale[200],
  },
  badgeText: {
    color: colors.grayscale[700],
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default Badge; 