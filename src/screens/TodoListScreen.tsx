import React, { useState } from 'react';
import { View, Text, FlatList, Button, TextInput, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Todo } from '../types/todo.types';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useGetTodos, useAddTodo, useUpdateTodo, useDeleteTodo } from '../features/todos/hooks/useTodos';

interface TodoListScreenProps {
  navigation: NavigationProp<ParamListBase>;
}

const TodoListScreen: React.FC<TodoListScreenProps> = ({ navigation }) => {
  const [newTodoTitle, setNewTodoTitle] = useState('');

  const { data: todos, isLoading, isError, error } = useGetTodos();
  const addTodoMutation = useAddTodo();
  const updateTodoMutation = useUpdateTodo();
  const deleteTodoMutation = useDeleteTodo();

  const handleAdd = () => {
    if (!newTodoTitle.trim()) return;
    addTodoMutation.mutate({ title: newTodoTitle, completed: false, failed: false });
    setNewTodoTitle('');
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    updateTodoMutation.mutate({ id, updates: { completed } });
  };

  const handleDelete = (id: string) => {
    deleteTodoMutation.mutate(id);
  };

  const renderItem = ({ item }: { item: Todo }) => (
    <View style={styles.todoItemContainer}>
      <Switch
        value={item.completed}
        onValueChange={(value) => handleToggleComplete(item.id, value)}
      />
      <TouchableOpacity 
        style={styles.todoTextContainer} 
      >
        <Text style={[styles.todoTitle, item.completed && styles.completedTodo]}>
          {item.title}
        </Text>
      </TouchableOpacity>
      <Button title="삭제" onPress={() => handleDelete(item.id)} color="red" />
    </View>
  );

  if (isLoading) return <Text>로딩 중...</Text>;
  if (isError || error) return <Text style={styles.errorText}>오류: {error?.message || '알 수 없는 오류'}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Todo List</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="새로운 할 일 입력..."
          value={newTodoTitle}
          onChangeText={setNewTodoTitle}
          onSubmitEditing={handleAdd}
        />
        <Button title="추가" onPress={handleAdd} />
      </View>
      <FlatList
        data={todos || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginRight: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
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
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default TodoListScreen; 