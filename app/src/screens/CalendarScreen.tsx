import ScreenHeader from '@/components/ScreenHeader';
import { colors } from '@/styles';
import React, { useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView } from 'react-native';
import { Calendar } from 'react-native-calendars';

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(0);

  console.log(selectedMonth);

  return (
    <SafeAreaView style={styles.container}>
    <View style={styles.container}>
      <Calendar
        onMonthChange={month => setSelectedMonth(month.month)}
        onDayPress={day => setSelectedDate(day.dateString)}
        markedDates={
          selectedDate
          ? {
            [selectedDate]: {
              selected: true,
              selectedColor: colors.primary,
            },
          }
          : {}
        }
        theme={{
          todayTextColor: colors.primary,
          selectedDayBackgroundColor: colors.primary,
          arrowColor: colors.primary,
        }}
        />
      {/* {selectedDate ? (
        <Text style={styles.selectedDate}>선택한 날짜: {selectedDate}</Text>
      ) : null} */}
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grayscale[100],
  },
  selectedDate: {
    marginTop: 24,
    fontSize: 18,
    color: colors.grayscale[800],
    alignSelf: 'center',
  },
});

export default CalendarScreen; 