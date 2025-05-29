import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Button } from 'react-native';
import { Todo } from '../types/todo.types';

interface TodoItemProps {
  item: Todo;
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  // onPress: () => void; // 상세 화면 이동 등을 위한 prop (추후 추가)
}

const TodoItem: React.FC<TodoItemProps> = React.memo(({
  item,
  onToggleComplete,
  onDelete,
  // onPress,
}) => {
  return (
    <View style={styles.todoItemContainer}>
      <Switch
        value={item.completed}
        onValueChange={(value) => onToggleComplete(item.id, value)}
      />
      <TouchableOpacity 
        style={styles.todoTextContainer}
        // onPress={onPress} // 상세 화면 이동 등을 위한 핸들러
      >
        <Text style={[styles.todoTitle, item.completed && styles.completedTodo]}>
          {item.title}
        </Text>
      </TouchableOpacity>
      <Button title="삭제" onPress={() => onDelete(item.id)} color="red" />
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