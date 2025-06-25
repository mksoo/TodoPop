import { Timestamp } from '@react-native-firebase/firestore';
import dayjs from 'dayjs';

/**
 * 할 일의 다음 반복 발생일을 계산합니다.
 *
 * @param args 계산에 필요한 인자 객체. src/types/todo.types.ts의 CalculableTodoForNext 타입을 따릅니다.
 * @param args.repeatSettings 필수: 할 일의 반복 설정 객체.
 * @param args.nextOccurrence 옵셔널: 현재 설정된 다음 발생일. `referenceDate`나 `lastCompleted`가 없을 때 기준일 계산에 사용됩니다.
 * @param args.referenceDate 옵셔널: 새로운 반복 주기의 시작점을 명시적으로 지정할 때 사용 (예: 할 일 수정 시 마감일 변경).
 *                              이 값이 있으면 `lastCompleted` (repeatSettings 내)나 `nextOccurrence`보다 우선하여 기준 날짜로 사용됩니다.
 * @returns 계산된 다음 발생일의 Timestamp 객체. 반복이 종료되었거나 계산할 수 없으면 null을 반환합니다.
 */
export const calculateNextOccurrence = (
  args: {
    repeatSettings: RepeatSettings;
    nextOccurrence: Timestamp | null;
    referenceDate: Timestamp | null;
  }
): Timestamp | null => {
  console.log('Timestamp in calculateNextOccurrence:', Timestamp);
  const { repeatSettings, nextOccurrence, referenceDate } = args;

  console.log('[Debug] raw referenceDate:', referenceDate); // referenceDate 원시 값 로깅
  if (referenceDate) {
    console.log('[Debug] typeof referenceDate:', typeof referenceDate);
    console.log('[Debug] referenceDate instanceof Timestamp:', referenceDate instanceof Timestamp);
    if (typeof referenceDate.toDate === 'function') {
      console.log('[Debug] referenceDate.toDate exists');
    } else {
      console.log('[Debug] referenceDate.toDate DOES NOT exist or not a function');
    }
  }

  if (!repeatSettings) return null; // 반복 설정이 없으면 계산 불가

  const {
    frequency,
    interval = 1, // 기본 간격은 1
    daysOfWeek,
    daysOfMonth,
    endDate,
    lastCompleted // repeatSettings에서 lastCompleted 가져옴
  } = repeatSettings;

  let baseDateDayjs: dayjs.Dayjs;

  // 기준 날짜(baseDateDayjs) 결정 로직:
  // 1. referenceDate가 있으면 최우선으로 사용합니다.
  // 2. referenceDate가 없고 lastCompleted가 있으면 그것을 기준으로 합니다.
  // 3. 둘 다 없고 nextOccurrence가 있으면, 해당 날짜를 이전 주기의 완료일처럼 간주하여 다음을 계산합니다.
  //    (정확히는 nextOccurrence에서 interval만큼 이전 시점으로 돌아가 기준일을 설정합니다.)
  // 4. 모두 없으면 오늘을 기준으로 계산합니다 (주로 새로운 반복 항목의 첫 발생일 계산 시).
  if (referenceDate) {
    let dateInputForDayjs: Date | string | number | undefined | null; // dayjs가 받을 수 있는 타입으로 명시
    if (referenceDate instanceof Timestamp) {
      console.log('[Debug] referenceDate is instanceof Timestamp. Calling toDate().');
      dateInputForDayjs = referenceDate.toDate();
    } else {
      console.log('[Debug] referenceDate is NOT instanceof Timestamp. Using as is (hoping it is Date, string, or number).');
      // Firestore Timestamp가 아닌 경우, JS Date, 문자열, 숫자, 또는 null/undefined일 수 있다고 가정합니다.
      // CalculableTodoForNext 타입 정의에서 referenceDate는 Timestamp 타입이므로, 이 else 블록은 이론상 도달하지 않아야 합니다.
      // 하지만 방어적으로 코드를 작성한다면, 여기서 referenceDate의 타입을 더 구체적으로 확인하고 변환해야 합니다.
      // 현재 CalculableTodoForNext.referenceDate는 Timestamp 타입이므로 이 else는 실행되지 않을 것입니다.
      // 만약 다른 타입이 올 수 있도록 CalculableTodoForNext가 변경된다면 이 부분을 수정해야 합니다.
      dateInputForDayjs = referenceDate as any; // 일단 any로 두어 기존 로직 유지, 실제로는 타입 체크 필요
    }
    console.log('[Debug] dateInputForDayjs:', dateInputForDayjs);
    baseDateDayjs = dayjs(dateInputForDayjs);
    console.log('[Debug] baseDateDayjs (after dayjs conversion):', baseDateDayjs);
  } else if (lastCompleted) {
    // lastCompleted 로깅 추가 고려 (필요시)
    baseDateDayjs = dayjs(lastCompleted.toDate());
  } else if (nextOccurrence) {
    let baseInterval = interval > 0 ? interval : 1;
    let unit: 'day' | 'week' | 'month' = 'day';
    if (frequency === 'weekly') unit = 'week';
    else if (frequency === 'monthly') unit = 'month';
    baseDateDayjs = dayjs(nextOccurrence.toDate()).subtract(baseInterval, unit);
  } else {
    baseDateDayjs = dayjs(); // 오늘
  }

  if (!baseDateDayjs.isValid()) return null; // 유효하지 않은 기준 날짜면 계산 불가

  let nextDateDayjs = baseDateDayjs.clone(); // 원본 변경 방지를 위해 복제하여 사용

  // 반복 빈도(frequency)에 따라 다음 날짜(nextDateDayjs) 계산
  switch (frequency) {
    case 'daily':
      nextDateDayjs = nextDateDayjs.add(interval, 'day');
      break;
    case 'weekly':
      if (daysOfWeek && daysOfWeek.length > 0) {
        // 특정 요일(daysOfWeek)이 지정된 주간 반복
        let tempDate = baseDateDayjs.clone();
        // referenceDate가 없을 때 (lastCompleted나 오늘 기준)는 기준일 다음날부터 탐색하여 현재일이 반복 요일이라도 다음 주기로 넘어가도록 함.
        if (!referenceDate) tempDate = tempDate.add(1, 'day');

        outerLoopWeekly: while (true) {
          // 요일 오름차순 정렬 (0=일요일, ..., 6=토요일)
          for (const day of [...daysOfWeek].sort((a, b) => a - b)) {
            if (tempDate.day() <= day) {
              nextDateDayjs = tempDate.day(day);
              // 계산된 날짜가 기준일(baseDateDayjs 또는 referenceDate) 이후인지 확인
              if (nextDateDayjs.isAfter(baseDateDayjs) ||
                 (referenceDate && nextDateDayjs.isSame(baseDateDayjs, 'day')) ||
                 (!referenceDate && nextDateDayjs.isSameOrAfter(baseDateDayjs, 'day'))) {
                if (referenceDate && nextDateDayjs.isBefore(baseDateDayjs, 'day')) {
                  // 이 경우는 거의 발생하지 않아야 함 (tempDate.day(day) 로직 때문)
                } else {
                  break outerLoopWeekly; // 적절한 다음 날짜 찾음
                }
              }
            }
          }
          // 현재 주에서 적절한 요일을 찾지 못했으면, 다음 주의 첫날로 이동하여 다시 탐색
          tempDate = tempDate.add(1, 'week').startOf('week');
        }

        // 주간 반복 간격(interval) 적용 (interval > 1 경우)
        // 이 부분은 다음 발생 요일을 찾은 후, 해당 발생이 (interval-1) 주기만큼 뒤로 가야 함을 의미.
        // 단, referenceDate가 다음 발생일과 동일한 날짜이고 해당 요일이 반복 요일이면 interval 만큼 더해야 함.
        if (interval > 1) {
          const initialNextDate = nextDateDayjs.clone();
          if (referenceDate && initialNextDate.isSame(baseDateDayjs, 'day') && daysOfWeek.includes(baseDateDayjs.day())) {
            nextDateDayjs = initialNextDate.add(interval * 7, 'day');
          } else {
            nextDateDayjs = initialNextDate.add(Math.max(0, interval - 1) * 7, 'day');
          }
        }
      } else {
        // 특정 요일 지정 없이, 단순 N주마다 반복
        nextDateDayjs = nextDateDayjs.add(interval * 7, 'day');
      }
      break;
    case 'monthly':
      if (daysOfMonth && daysOfMonth.length > 0) {
        // 특정 날짜(daysOfMonth)가 지정된 월간 반복
        let tempDate = baseDateDayjs.clone();
        if (!referenceDate) tempDate = tempDate.add(1, 'day'); // 기준일 다음날부터 탐색

        outerLoopMonthly: while(true){
          for(const day of [...daysOfMonth].sort((a,b) => a-b)){
            // 현재 달에 해당 날짜가 유효한지 확인 (예: 2월 30일은 없음)
            if (tempDate.date() <= day && day <= tempDate.daysInMonth()) {
              nextDateDayjs = tempDate.date(day);
              if (nextDateDayjs.isAfter(baseDateDayjs) ||
                 (referenceDate && nextDateDayjs.isSame(baseDateDayjs, 'day')) ||
                 (!referenceDate && nextDateDayjs.isSameOrAfter(baseDateDayjs, 'day'))) {
                if(referenceDate && nextDateDayjs.isBefore(baseDateDayjs, 'day')){
                  // continue;
                } else {
                  break outerLoopMonthly;
                }
              }
            }
          }
          tempDate = tempDate.add(1, 'month').startOf('month');
        }

        // 월간 반복 간격(interval) 적용 (주간과 유사한 로직)
        if (interval > 1) {
            const initialNextDate = nextDateDayjs.clone();
            if (referenceDate && initialNextDate.isSame(baseDateDayjs, 'day') && daysOfMonth.includes(baseDateDayjs.date())) {
                nextDateDayjs = initialNextDate.add(interval, 'month');
            } else {
                nextDateDayjs = initialNextDate.add(Math.max(0, interval - 1), 'month');
            }
        }
      } else {
        // 특정 날짜 지정 없이, 단순 N개월마다 반복 (기준일의 날짜(day)를 유지하며 N개월 추가)
        nextDateDayjs = nextDateDayjs.add(interval, 'month');
      }
      break;
    case 'custom': // 'custom' 빈도는 현재 미지원
      // 향후 X일마다 등의 custom frequency를 지원할 경우 여기서 처리합니다.
      return null;
  }

  // 계산된 다음 발생일(nextDateDayjs)이 반복 종료일(endDate) 이후인지 확인
  if (endDate && nextDateDayjs.isAfter(dayjs(endDate.toDate()))) {
    return null; // 종료일 이후면 더 이상 반복 없음
  }

  // 최종 계산된 Dayjs 객체를 Firestore Timestamp로 변환하여 반환
  return Timestamp.fromDate(nextDateDayjs.toDate());
};
