import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, TextInput, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Todo } from '../types/todo.types';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useTodoStore } from '../stores/todoStore';

interface TodoListScreenProps {
  navigation: NavigationProp<ParamListBase>;
}

const TodoListScreen: React.FC<TodoListScreenProps> = ({ navigation }) => {
  const {
    todos,
    isLoading,
    error,
    fetchTodos,
    handleAddTodo,
    handleDeleteTodo,
    toggleComplete,
  } = useTodoStore();
  const [newTodoTitle, setNewTodoTitle] = useState('');

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const renderItem = ({ item }: { item: Todo }) => (
    <View style={styles.todoItemContainer}>
      <Switch
        value={item.completed}
        onValueChange={(value) => toggleComplete(item.id, value)}
      />
      <TouchableOpacity 
        style={styles.todoTextContainer} 
      >
        <Text style={[styles.todoTitle, item.completed && styles.completedTodo]}>
          {item.title}
        </Text>
      </TouchableOpacity>
      <Button title="삭제" onPress={() => handleDeleteTodo(item.id)} color="red" />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Todo List</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="새로운 할 일 입력..."
          value={newTodoTitle}
          onChangeText={setNewTodoTitle}
        />
        <Button title="추가" onPress={() => {
          handleAddTodo(newTodoTitle);
          setNewTodoTitle('');
        }} />
      </View>
      {isLoading && <Text>로딩 중...</Text>}
      {error && <Text style={styles.errorText}>오류: {error}</Text>}
      <FlatList
        data={todos}
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