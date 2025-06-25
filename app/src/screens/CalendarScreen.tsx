import ScreenHeader from '@/components/ScreenHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useGetTodos } from '@/hooks/useTodosQueries';
import { colors } from '@/styles';
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, Text, FlatList } from 'react-native';
import { Calendar } from 'react-native-calendars';
import dayjs from 'dayjs';
import TodoItem from '@/components/TodoItem';

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(0);

  const { currentUser } = useAuth();
  const { data: todos } = useGetTodos({ uid: currentUser?.uid ?? '' });

  // 날짜별로 dot 표시
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    if (todos && Array.isArray(todos)) {
      todos.forEach(todo => {
        if (todo.createdAt && typeof todo.createdAt.toDate === 'function') {
          const dateStr = dayjs(todo.createdAt.toDate()).format('YYYY-MM-DD');
          marks[dateStr] = marks[dateStr] || { dots: [], marked: true };
          marks[dateStr].dots = [
            { key: 'todo', color: colors.primary, selectedDotColor: colors.primary },
          ];
        }
      });
    }
    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: colors.primary,
      };
    }
    return marks;
  }, [todos, selectedDate]);

  // 선택한 날짜의 todo만 필터링
  const todosForSelectedDate = useMemo(() => {
    if (!selectedDate || !todos) return [];
    return todos.filter(todo => {
      if (!todo.createdAt || typeof todo.createdAt.toDate !== 'function') return false;
      return dayjs(todo.createdAt.toDate()).format('YYYY-MM-DD') === selectedDate;
    });
  }, [todos, selectedDate]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.calendarWrapper}>
        <Calendar
          style={styles.calendar}
          onMonthChange={month => setSelectedMonth(month.month)}
          onDayPress={day => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          markingType="multi-dot"
          theme={{
            todayTextColor: colors.primary,
            selectedDayBackgroundColor: colors.primary,
            arrowColor: colors.primary,
            stylesheet: {
              calendar: {
                header: {
                  backgroundColor: colors.grayscale[100],
                },
                main: {
                  backgroundColor: colors.grayscale[900],
                },
              },
            },
          }}
        />
      </View>
      {selectedDate ? (
        <View style={styles.todoListContainer}>
          <Text style={styles.selectedDateText}>{selectedDate}의 할 일</Text>
          {todosForSelectedDate.length > 0 ? (
            <FlatList
              data={todosForSelectedDate}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <TodoItem item={item} />}
              contentContainerStyle={styles.listContentContainer}
            />
          ) : (
            <Text style={styles.emptyText}>이 날짜에 등록된 할 일이 없습니다.</Text>
          )}
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grayscale[100],
  },
  calendarWrapper: {
    flex: 1,
  },
  calendar: {
    width: '100%',
  },
  todoListContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  listContentContainer: {
    paddingBottom: 16,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
  },
});

export default CalendarScreen; 