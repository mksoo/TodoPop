import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '@/styles';

interface ScreenHeaderProps {
  title?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  left,
  right,
  containerStyle,
  titleStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.side}>{left}</View>
      <Text style={[styles.title, titleStyle]} numberOfLines={1} ellipsizeMode="tail">
        {title}
      </Text>
      <View style={styles.side}>{right}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.grayscale[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.grayscale[200],
    minHeight: 56,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  side: {
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ScreenHeader; 