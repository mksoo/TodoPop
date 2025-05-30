import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator'; // 네비게이션 파라미터 타입
import { useGetTodo } from '../hooks/useTodosQueries';
import { useUpdateTodo } from '../hooks/useTodosMutations';

type TodoEditScreenRouteProp = RouteProp<RootStackParamList, 'TodoEdit'>;
// 네비게이션 prop 타입 정의 (goBack 사용을 위해)
type TodoEditScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TodoEdit'>;

const TodoEditScreen: React.FC = () => {
  const route = useRoute<TodoEditScreenRouteProp>();
  const navigation = useNavigation<TodoEditScreenNavigationProp>();
  const { todoId } = route.params;

  const { data: todo, isLoading: isLoadingTodo, isError: isTodoError, error: todoError } = useGetTodo(todoId);
  const { mutate: updateTodo, isPending: isUpdatingTodo, isError: isUpdateError, error: updateError } = useUpdateTodo();

  const [title, setTitle] = useState('');

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
    }
  }, [todo]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('오류', '제목을 입력해주세요.');
      return;
    }
    updateTodo({ id: todoId, updates: { title } }, {
      onSuccess: () => {
        navigation.goBack();
      },
      onError: (err) => {
        Alert.alert('저장 실패', err.message || 'Todo를 업데이트하는 중 오류가 발생했습니다.');
      }
    });
  };

  if (isLoadingTodo) return <ActivityIndicator size="large" style={styles.centered} />;
  if (isTodoError || !todo) return <Text style={styles.errorText}>Todo를 불러오는데 실패했습니다: {todoError?.message}</Text>;
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>제목:</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Todo 제목"
      />
      {isUpdateError && <Text style={styles.errorText}>저장 실패: {updateError?.message}</Text>}
      <Button title={isUpdatingTodo ? "저장 중..." : "저장"} onPress={handleSave} disabled={isUpdatingTodo} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'white',
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    borderRadius: 5,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
});

export default TodoEditScreen; 