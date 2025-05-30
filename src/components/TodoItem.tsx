import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Button } from 'react-native';
import { Todo } from '../types/todo.types';
import { useGetTodo } from '../hooks/useTodosQueries';
import { useToggleTodoComplete, useDeleteTodo } from '../hooks/useTodosMutations';

interface TodoItemProps {
  item: Todo;
  // onPress: () => void; // 상세 화면 이동 등을 위한 prop (추후 추가)
}

const TodoItem: React.FC<TodoItemProps> = React.memo(({
  item,
  // onPress,
}) => {

  const { mutateAsync: toggleTodoComplete } = useToggleTodoComplete();
  const { mutateAsync: deleteTodo } = useDeleteTodo();

  const handleToggleComplete = useCallback(async (args: { id: string, completed: boolean }) => {
    const { id, completed } = args;
    await toggleTodoComplete({ id, completed });
  }, [toggleTodoComplete]);

  const handleDelete = useCallback(async (args: { id: string }) => {
    const { id } = args;
    await deleteTodo({id});
  }, [deleteTodo]);

  if (!item) return null;

  return (
    <View style={styles.todoItemContainer}>
      <Switch
        value={item.completed}
        onValueChange={(value) => handleToggleComplete({ id: item.id, completed: value })}
      />
      <TouchableOpacity 
        style={styles.todoTextContainer}
        // onPress={onPress} // 상세 화면 이동 등을 위한 핸들러
      >
        <Text style={[styles.todoTitle, item.completed && styles.completedTodo]}>
          {item.title}
        </Text>
      </TouchableOpacity>
      <Button title="삭제" onPress={() => handleDelete({ id: item.id })} color="red" />
    </View>
  );
});

const styles = StyleSheet.create({
  todoItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  todoTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  todoTitle: {
    fontSize: 18,
  },
  completedTodo: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
});

export default TodoItem; 