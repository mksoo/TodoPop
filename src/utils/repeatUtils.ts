import { Todo, RepeatSettings, RepeatFrequency } from '../types/todo.types';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import dayjs from 'dayjs'; // dayjs 임포트
import customParseFormat from 'dayjs/plugin/customParseFormat'; // 필요한 플러그인 임포트 (선택적)
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'; // isSameOrBefore 플러그인 임포트
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore); // isSameOrBefore 플러그인 사용 설정

// calculateNextOccurrence 함수를 위한 타입 정의
interface CalculableTodo {
  repeatSettings?: RepeatSettings;
  nextOccurrence?: FirebaseFirestoreTypes.Timestamp | null;
  lastCompleted?: FirebaseFirestoreTypes.Timestamp; // Todo 타입에 lastCompleted가 정의되어 있어야 함
}

interface CalculableTodoForNext {
  repeatSettings: RepeatSettings; // 이 함수 호출 시 repeatSettings는 필수라고 가정
  nextOccurrence?: FirebaseFirestoreTypes.Timestamp | null; 
  lastCompleted?: FirebaseFirestoreTypes.Timestamp;
  // 새로운 반복의 첫 발생일을 찾기 위한 기준 날짜 (옵셔널)
  // 이 값이 없으면, lastCompleted나 nextOccurrence를 사용하고, 둘 다 없으면 오늘을 기준으로 함.
  referenceDate?: FirebaseFirestoreTypes.Timestamp | Date | string;
}

export const calculateNextOccurrence = (
  args: CalculableTodoForNext
): FirebaseFirestoreTypes.Timestamp | null => {
  const { repeatSettings, nextOccurrence, lastCompleted, referenceDate } = args;

  if (!repeatSettings) return null; // 방어 코드

  const { frequency, interval = 1, daysOfWeek, daysOfMonth, endDate } = repeatSettings;

  let baseDateDayjs: dayjs.Dayjs;

  if (referenceDate) {
    baseDateDayjs = dayjs(referenceDate instanceof FirebaseFirestoreTypes.Timestamp ? referenceDate.toDate() : referenceDate);
  } else if (lastCompleted) {
    baseDateDayjs = dayjs(lastCompleted.toDate());
  } else if (nextOccurrence) {
    // nextOccurrence는 이미 다음 예정일이므로, 이를 기준으로 다음 것을 찾으려면 interval만큼 빼야 함.
    // 또는, 이 nextOccurrence가 "시작점"으로 간주되어야 한다면 그대로 사용.
    // 여기서는 lastCompleted가 없을 때 nextOccurrence를 '현재 주기 완료일'처럼 간주하여 다음을 찾도록 함.
    baseDateDayjs = dayjs(nextOccurrence.toDate()).subtract(interval > 0 ? interval : 1, frequency === 'weekly' ? 'week' : frequency === 'monthly' ? 'month' : 'day');
  } else {
    baseDateDayjs = dayjs(); // 오늘
  }

  if (!baseDateDayjs.isValid()) return null; // 유효하지 않은 날짜면 null 반환

  let nextDateDayjs = baseDateDayjs.clone(); // 불변성을 위해 clone 사용

  switch (frequency) {
    case 'daily':
      nextDateDayjs = nextDateDayjs.add(interval, 'day');
      break;
    case 'weekly':
      if (daysOfWeek && daysOfWeek.length > 0) {
        // daysOfWeek는 0(일요일) ~ 6(토요일)
        let tempDate = baseDateDayjs.clone();
        // 현재 주 또는 다음 interval 주에서 가장 빠른 요일 찾기
        // 기준일이 이미 해당 요일인 경우 다음 반복으로 넘어가도록 +1일 해서 시작
        if(!referenceDate) tempDate = tempDate.add(1, 'day'); 

        outerLoop: while (true) {
          for (const day of daysOfWeek.sort((a, b) => a - b)) {
            if (tempDate.day() <= day) {
              nextDateDayjs = tempDate.day(day);
              if (nextDateDayjs.isAfter(baseDateDayjs) || nextDateDayjs.isSame(baseDateDayjs, 'day')) {
                 // nextDateDayjs가 baseDateDayjs보다 이후인지 확인하여 무한루프 방지 및 정확한 다음 날짜 선택
                if(referenceDate && nextDateDayjs.isBefore(baseDateDayjs, 'day')){
                    // referenceDate가 있고, 계산된 날짜가 referenceDate보다 이전이면 다음 주로 넘김
                } else {
                    break outerLoop;
                }
              }
            }
          }
          tempDate = tempDate.add(1, 'week').startOf('week'); // 다음 주로 이동하여 해당 주의 첫날부터 다시 탐색
        }
         // interval 적용 (이미 첫번째 주기는 위에서 찾았으므로 interval-1 만큼만 더함, 단 interval>1 일때)
        if(interval > 1 && !(referenceDate && nextDateDayjs.isSame(baseDateDayjs,'week'))){
            nextDateDayjs = nextDateDayjs.add((interval -1) * 7, 'day');
        } else if (interval > 1 && referenceDate && nextDateDayjs.isSame(baseDateDayjs,'week') && !daysOfWeek.includes(baseDateDayjs.day())) {
            // referenceDate가 있는 주에 다음 반복 요일이 없을 경우, 다음 interval 주기 계산
            nextDateDayjs = nextDateDayjs.add(interval * 7, 'day');
        } else if (interval > 1 && referenceDate && nextDateDayjs.isSame(baseDateDayjs,'week') && daysOfWeek.includes(baseDateDayjs.day()) && nextDateDayjs.isSame(baseDateDayjs, 'day')){
            // referenceDate 자체가 반복 요일인 경우, 다음 interval 주기로 바로 점프
            nextDateDayjs = nextDateDayjs.add(interval * 7, 'day');
        }

      } else {
        nextDateDayjs = nextDateDayjs.add(interval * 7, 'day'); // daysOfWeek 없으면 단순 주간 반복
      }
      break;
    case 'monthly':
      // 월간 반복 로직 (dayjs 사용)
      if (daysOfMonth && daysOfMonth.length > 0) {
        let tempDate = baseDateDayjs.clone();
        if(!referenceDate) tempDate = tempDate.add(1, 'day'); // 기준일 포함하지 않기 위해

        outerLoopMonthly: while(true){
            for(const day of daysOfMonth.sort((a,b) => a-b)){
                if(tempDate.date() <= day){
                    nextDateDayjs = tempDate.date(day);
                     if (nextDateDayjs.isAfter(baseDateDayjs) || nextDateDayjs.isSame(baseDateDayjs, 'day')) {
                        if(referenceDate && nextDateDayjs.isBefore(baseDateDayjs, 'day')){
                           // continue; // referenceDate보다 이전이면 다음 반복일 찾기
                        } else {
                            break outerLoopMonthly;
                        }
                    }
                }
            }
            tempDate = tempDate.add(1, 'month').startOf('month');
        }
        if(interval > 1 && !(referenceDate && nextDateDayjs.isSame(baseDateDayjs,'month')) ){
             nextDateDayjs = nextDateDayjs.add(interval -1, 'month');
        } else if (interval > 1 && referenceDate && nextDateDayjs.isSame(baseDateDayjs,'month') && !daysOfMonth.includes(baseDateDayjs.date())  ){
            nextDateDayjs = nextDateDayjs.add(interval, 'month');
        } else if (interval > 1 && referenceDate && nextDateDayjs.isSame(baseDateDayjs,'month') && daysOfMonth.includes(baseDateDayjs.date()) && nextDateDayjs.isSame(baseDateDayjs, 'day')){
            nextDateDayjs = nextDateDayjs.add(interval, 'month');
        }

      } else {
        nextDateDayjs = nextDateDayjs.add(interval, 'month');
      }
      break;
    case 'custom':
      return null; // 사용자 정의 로직은 아직 미구현
  }

  if (endDate && nextDateDayjs.isAfter(dayjs(endDate.toDate()))) {
    return null;
  }

  return firestore.Timestamp.fromDate(nextDateDayjs.toDate());
};

// shouldShowTodo 함수를 위한 타입 정의
interface ShowableTodo {
  repeatSettings?: RepeatSettings; // Todo 타입과 일치하도록 옵셔널 유지
  nextOccurrence?: FirebaseFirestoreTypes.Timestamp | null; // null 허용 추가
  status: 'ONGOING' | 'COMPLETED' | 'FAILED';
}

export const shouldShowTodo = (todo: ShowableTodo): boolean => {
  // 반복되지 않는 할 일 (repeatSettings가 없는 경우)은 항상 표시
  if (!todo.repeatSettings) return true;
  // 완료된 반복 할 일은 다음 발생일이 없으면 숨김
  if (todo.status === 'COMPLETED' && !todo.nextOccurrence) return false; 
  const now = dayjs(); // 현재 시간 (dayjs 사용)
  const nextOccurrenceDate = todo.nextOccurrence ? dayjs(todo.nextOccurrence.toDate()) : null;
  if (!nextOccurrenceDate) return true; 
  return nextOccurrenceDate.startOf('day').isSameOrBefore(now.startOf('day')); // 날짜 단위로 비교
}; 