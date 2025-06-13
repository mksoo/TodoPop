import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Button } from 'react-native';
import { Todo } from '../types/todo.types';
// import { useGetTodo } from '../hooks/useTodosQueries'; // TodoItem에서는 직접 사용하지 않음
import { useUpdateTodoStatus, useDeleteTodo } from '../hooks/useTodosMutations';
import { useNavigation } from '@react-navigation/native'; // NavigationProp, ParamListBase 제거 가능
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // NativeStackNavigationProp import
import { MainStackParamList } from '../navigation/AppNavigator'; // MainStackParamList import
import { colors, spacing, fontSize, borderRadius } from '../styles';
import Badge from './Badge';

interface TodoItemProps {
  item: Todo;
}

const TodoItem: React.FC<TodoItemProps> = React.memo(({
  item,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>(); 

  const { mutateAsync: updateTodoStatus } = useUpdateTodoStatus();
  const { mutateAsync: deleteTodo } = useDeleteTodo();

  const handleToggleStatusCb = useCallback(async () => {
    const newStatus = item.status === 'COMPLETED' ? 'ONGOING' : 'COMPLETED';
    await updateTodoStatus({ id: item.id, status: newStatus });
  }, [updateTodoStatus, item.id, item.status]);

  const handleDeleteCb = useCallback(async () => {
    await deleteTodo({ id: item.id });
  }, [deleteTodo, item.id]);

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
        item.status === 'COMPLETED' && styles.checkboxContainerCompleted
      ]}>
        {item.status === 'COMPLETED' && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.todoTextContainer}>
        <Text style={[styles.todoTitle, item.status === 'COMPLETED' && styles.completedTodo]}>
          {item.title}
        </Text>
        <Badge
          label={
            item.status === 'COMPLETED'
              ? '완료됨'
              : item.status === 'ONGOING'
              ? '진행중'
              : '실패'
          }
          color={
            item.status === 'COMPLETED'
              ? colors.success
              : item.status === 'ONGOING'
              ? colors.primary
              : colors.danger
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

export default TodoItem; 