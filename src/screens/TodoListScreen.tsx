import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Button, TextInput, StyleSheet } from 'react-native';
import { Todo } from '../types/todo.types';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useGetTodos } from '../hooks/useTodosQueries';
import { useAddTodo, useToggleTodoComplete, useDeleteTodo } from '../hooks/useTodosMutations';
import TodoItem from '../components/TodoItem';

interface TodoListScreenProps {
  navigation: NavigationProp<ParamListBase>;
}

const TodoListScreen: React.FC<TodoListScreenProps> = ({ navigation }) => {
  const [newTodoTitle, setNewTodoTitle] = useState('');

  const { data: todos, isLoading, isError, error } = useGetTodos();
  const addTodoMutation = useAddTodo();
  const toggleTodoCompleteMutation = useToggleTodoComplete();
  const deleteTodoMutation = useDeleteTodo();

  const handleAdd = useCallback(() => {
    if (!newTodoTitle.trim()) return;
    addTodoMutation.mutate({ title: newTodoTitle, completed: false, failed: false });
    setNewTodoTitle('');
  }, [newTodoTitle, addTodoMutation]);

  const handleToggleComplete = useCallback((id: string, completed: boolean) => {
    toggleTodoCompleteMutation.mutate({ id, completed });
  }, [toggleTodoCompleteMutation]);

  const handleDelete = useCallback((id: string) => {
    deleteTodoMutation.mutate(id);
  }, [deleteTodoMutation]);

  const renderItem = useCallback(({ item }: { item: Todo }) => (
    <TodoItem 
      item={item}
      onToggleComplete={handleToggleComplete} 
      onDelete={handleDelete} 
    />
  ), [handleToggleComplete, handleDelete]);

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
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default TodoListScreen; 