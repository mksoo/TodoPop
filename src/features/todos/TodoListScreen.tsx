import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Button, TextInput, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { addTodo, getTodos, updateTodo, deleteTodo, Todo } from './useTodo';
import { NavigationProp, ParamListBase } from '@react-navigation/native'; // React Navigation 타입

// Zustand 스토어 예시 (실제 구현은 src/stores/todoStore.ts 등 별도 파일로 분리 권장)
import {create} from 'zustand';

interface TodoStore {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
  fetchTodos: () => Promise<void>;
  handleAddTodo: (title: string) => Promise<void>;
  handleUpdateTodo: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => Promise<void>;
  handleDeleteTodo: (id: string) => Promise<void>;
  toggleComplete: (id: string, completed: boolean) => Promise<void>;
}

const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  isLoading: false,
  error: null,
  fetchTodos: async () => {
    set({ isLoading: true, error: null });
    try {
      const todos = await getTodos();
      set({ todos, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },
  handleAddTodo: async (title: string) => {
    if (!title.trim()) return;
    // Optimistic update (선택적)
    // const tempId = Date.now().toString();
    // set(state => ({ todos: [...state.todos, { id: tempId, title, completed: false, failed: false, createdAt: new Date() }] }));
    try {
      const newTodoId = await addTodo({ title, completed: false, failed: false });
      if (newTodoId) {
        // 성공 시 실제 데이터로 상태 업데이트 또는 fetchTodos 다시 호출
        get().fetchTodos(); 
      }
    } catch (e) {
      set({ error: (e as Error).message });
      // Optimistic update 롤백 (선택적)
      // set(state => ({ todos: state.todos.filter(t => t.id !== tempId) }));
    }
  },
  handleUpdateTodo: async (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => {
    try {
      await updateTodo(id, updates);
      get().fetchTodos(); // 또는 로컬에서 상태 직접 업데이트
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
  handleDeleteTodo: async (id: string) => {
    // Optimistic update (선택적)
    // set(state => ({ todos: state.todos.filter(t => t.id !== id) }));
    try {
      await deleteTodo(id);
      get().fetchTodos(); // 또는 로컬에서 상태 직접 업데이트
    } catch (e) {
      set({ error: (e as Error).message });
      // Optimistic update 롤백 (선택적)
      // set(state => ({ todos: [...state.todos, 원래_todo_객체] })); 
    }
  },
  toggleComplete: async (id: string, completed: boolean) => {
    get().handleUpdateTodo(id, { completed });
  },
}));

interface TodoListScreenProps {
  navigation: NavigationProp<ParamListBase>; // 기본 네비게이션 prop 타입
}

const TodoListScreen: React.FC<TodoListScreenProps> = ({ navigation }) => {
  const {
    todos,
    isLoading,
    error,
    fetchTodos,
    handleAddTodo,
    // handleUpdateTodo, // toggleComplete 또는 상세 화면에서 사용
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
        // onPress={() => navigation.navigate('TodoDetail', { todoId: item.id })} // 상세 화면으로 이동 (추후 구현)
      >
        <Text style={[styles.todoTitle, item.completed && styles.completedTodo]}>
          {item.title}
        </Text>
        {/* <Text style={styles.todoDate}>{item.createdAt.toDate().toLocaleDateString()}</Text> */}
        {/* dueDate 등 추가 정보 표시 */}
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
    elevation: 2, // for Android shadow
    shadowColor: '#000', // for iOS shadow
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
  // todoDate: {
  //   fontSize: 12,
  //   color: '#666',
  // },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default TodoListScreen; 