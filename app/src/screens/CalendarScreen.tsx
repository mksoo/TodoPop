import { colors } from '@/styles';
import React, { useState, useMemo, useCallback, FC } from 'react';
import { View, StyleSheet, SafeAreaView, Text, FlatList, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import dayjs from 'dayjs';
import ScheduleEntryItem from '@/components/ScheduleEntryItem';
import { useScheduleEntriesQuery } from '@/hooks/useScheduleEntryQueries';
import SvgIcon from '@/components/common/SvgIcon';
import { MainStackScreenProps } from '@/navigation/navigation';

type Props = MainStackScreenProps<"Calendar">;

const CalendarScreen: FC<Props> = ({ navigation }) => {

  const today = useMemo(() => dayjs().format('YYYY-MM-DD'), []);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  
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

  const handleGoToToday = useCallback(() => {
    setSelectedDate(today);
    setSelectedMonth(dayjs().month() + 1);
    setSelectedYear(dayjs().year());
  }, [today]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.calendarWrapper}>
        <Calendar
          style={styles.calendar}
          current={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`}
          onMonthChange={month => {
            setSelectedMonth(month.month);
            setSelectedYear(month.year);
          }}
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
        {(selectedMonth !== dayjs().month() + 1 || selectedYear !== dayjs().year()) && (
          <View style={styles.todayButtonWrapper}>
            <TouchableOpacity style={styles.todayButton} onPress={handleGoToToday}>
              <Text style={styles.todayButtonText}>오늘</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {selectedDate ? (
        <View style={styles.todoListContainer}>
          <Text style={styles.selectedDateText}>
            {selectedDate}, {dayjs(selectedDate).format('dddd')}
            <Text style={styles.selectedDateLunarText}>
              {' '}음력 {dayjs(selectedDate).lunar("YYYY년 MM월 DD일")}
            </Text>
          </Text>
          {todosForSelectedDate.length > 0 ? (
            <FlatList
              data={todosForSelectedDate}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <ScheduleEntryItem item={item} />}
              contentContainerStyle={styles.listContentContainer}
            />
          ) : (
            <Text style={styles.emptyText}>이 날짜에 등록된 할 일이 없습니다.</Text>
          )}
        </View>
      ) : null}
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('ScheduleEntryAdd')}>
        <SvgIcon name="add" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grayscale[100],
  },
  calendarWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.grayscale[200],
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
    color: colors.primary,
    marginBottom: 8,
  },
  selectedDateLunarText: {
    fontSize: 12,
    color: colors.text.secondary,
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
  todayButtonWrapper: {
    alignItems: 'center',
    marginTop: 12,
  },
  todayButton: {
    backgroundColor: colors.background.primary,
    borderColor: colors.primary,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    position: 'absolute',
    bottom: 30,
  },
  todayButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
  },
});

export default CalendarScreen; 