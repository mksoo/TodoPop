import ScreenHeader from '@/components/ScreenHeader';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles';
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, Text, FlatList } from 'react-native';
import { Calendar } from 'react-native-calendars';
import dayjs from 'dayjs';
import TodoItem from '@/components/TodoItem';
import { useScheduleEntriesQuery } from '@/hooks/useScheduleEntryQueries';

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(0);

  const { currentUser } = useAuth();
  const { data: scheduleEntries } = useScheduleEntriesQuery();

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    if (scheduleEntries && Array.isArray(scheduleEntries)) {
      const dateCount: Record<string, number> = {};

      scheduleEntries.forEach(entry => {
        if (entry.startAt && typeof entry.startAt.toDate === 'function') {
          const dateStr = dayjs(entry.startAt.toDate()).format('YYYY-MM-DD');
          dateCount[dateStr] = (dateCount[dateStr] || 0) + 1;
        }
      });

      Object.entries(dateCount).forEach(([dateStr, count]) => {
        marks[dateStr] = marks[dateStr] || { dots: [], marked: true };
        // dot 개수만큼 서로 다른 key로 dot 객체 생성
        // 최대 5개만 표시
        marks[dateStr].dots = Array.from({ length: Math.min(count, 5) }).map((_, idx) => ({
          key: `scheduleEntry${idx}`,
          color: colors.grayscale[500],
          selectedDotColor: colors.grayscale[100],
        }));
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
  }, [scheduleEntries, selectedDate]);

  // 선택한 날짜의 todo만 필터링
  const todosForSelectedDate = useMemo(() => {
    if (!selectedDate || !scheduleEntries) return [];
    return scheduleEntries.filter(todo => {
      if (!todo.startAt || typeof todo.startAt.toDate !== 'function') return false;
      return dayjs(todo.startAt.toDate()).format('YYYY-MM-DD') === selectedDate;
    });
  }, [scheduleEntries, selectedDate]);

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