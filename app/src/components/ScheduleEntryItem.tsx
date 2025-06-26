import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // NavigationProp, ParamListBase 제거 가능
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // NativeStackNavigationProp import
import { MainStackParamList } from '../navigation/AppNavigator'; // MainStackParamList import
import { colors, spacing, fontSize, borderRadius } from '../styles';
import Badge from './Badge';
import { ScheduleEntry } from '@/types/scheduleEntry.types';
import { useDeleteScheduleEntry, useUpdateScheduleEntryCompleted } from '@/hooks/useScheduleEntryMutations';

interface ScheduleEntryItemProps {
  item: ScheduleEntry;
}

const ScheduleEntryItem: React.FC<ScheduleEntryItemProps> = React.memo(({
  item,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>(); 

  const { mutateAsync: deleteScheduleEntry } = useDeleteScheduleEntry();
  const { mutateAsync: updateScheduleEntryCompleted } = useUpdateScheduleEntryCompleted();

  const handleToggleStatusCb = useCallback(async () => {
    await updateScheduleEntryCompleted({ id: item.id, completed: !item.completed });
  }, [updateScheduleEntryCompleted, item.id, item.completed]);

  const handleDeleteCb = useCallback(async () => {
    await deleteScheduleEntry({ id: item.id });
  }, [deleteScheduleEntry, item.id]);

  const handleNavigateToEdit = () => {
    navigation.navigate('TodoEdit', { todoId: item.id });
  };

  if (!item) return null;

  return (
    <TouchableOpacity 
      style={styles.todoItemContainer}
      onPress={handleNavigateToEdit}>

      <TouchableOpacity onPress={handleToggleStatusCb} style={[
        styles.checkboxContainer,
        item.completed && styles.checkboxContainerCompleted
      ]}>
        {item.completed && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.todoTextContainer}>
        <Text style={[styles.todoTitle, item.completed && styles.completedTodo]}>
          {item.title}
        </Text>
        <Badge
          label={
            item.completed
              ? '완료됨'
              : '진행중'
          }
          color={
            item.completed
              ? colors.success
              : colors.primary
              
          }
          textColor={colors.grayscale[100]}
        />
      </View>
      <Button title="삭제" onPress={handleDeleteCb} color="red" />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  todoItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.sm,
    elevation: 2,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  todoTextContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  todoTitle: {
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  completedTodo: {
    textDecorationLine: 'line-through',
    color: colors.text.secondary,
  },
  checkboxContainer: {
    width: spacing.lg,
    height: spacing.lg,
    borderRadius: borderRadius.round,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  checkboxContainerCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.background.primary,
    fontSize: fontSize.md,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
});

export default ScheduleEntryItem; 