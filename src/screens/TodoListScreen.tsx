import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Button, TextInput, StyleSheet } from 'react-native';
import { Todo } from '../types/todo.types';
import { useGetTodos } from '../hooks/useTodosQueries';
import { useAddTodo } from '../hooks/useTodosMutations';
import TodoItem from '../components/TodoItem';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';


const TodoListScreen: React.FC = () => {
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'TodoList'>>();

  const { data: todos, isLoading, isError, error } = useGetTodos();
  const { mutate: addTodo } = useAddTodo();

  const handleAdd = useCallback(() => {
    if (!newTodoTitle.trim()) return;
    addTodo({ title: newTodoTitle });
    setNewTodoTitle('');
  }, [newTodoTitle, addTodo]);
  
  const renderItem = useCallback(({ item }: { item: Todo }) => {
    return (
    <TodoItem 
      item={item}
    />
  )}, []);

  if (isLoading) return <Text>로딩 중...</Text>;
  if (isError || error) return <Text style={styles.errorText}>오류: {error?.message || '알 수 없는 오류'}</Text>;

  return (
    <View style={styles.container}>
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