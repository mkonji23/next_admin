import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

export interface MonthWeekInfo {
    weekNumber: number;
    weekLabel: string;
    fullLabel: string;
    startDate: string;
    endDate: string;
    periodLabel: string;
    totalSeconds?: number;
    studyDaysCount?: number;
    averageSecondsPerDay?: number;
}

/**
 * 특정 월(YYYY-MM)의 주차 목록을 계산합니다.
 * (한 주는 월요일 시작 ~ 일요일 종료 기준으로 7일씩 무조건 온전하게 끊어서 계산합니다.)
 */
export function getMonthWeeks(yearMonth: string | Dayjs | Date): MonthWeekInfo[] {
    const startOfMonth = dayjs(yearMonth).startOf('month');
    const endOfMonth = startOfMonth.endOf('month');
    const monthNum = startOfMonth.format('M');

    const weeks: MonthWeekInfo[] = [];

    // 1일이 속한 주의 월요일부터 시작
    let currentMonday = startOfMonth.startOf('isoWeek');
    // 말일이 속한 주의 일요일까지 반복
    const lastSunday = endOfMonth.endOf('isoWeek');
    let weekIndex = 1;

    while (currentMonday.isBefore(lastSunday) || currentMonday.isSame(lastSunday, 'day')) {
        const currentSunday = currentMonday.endOf('isoWeek'); // 월요일 + 6일 = 일요일 (무조건 7일)

        const weekStartStr = currentMonday.format('YYYY-MM-DD');
        const weekEndStr = currentSunday.format('YYYY-MM-DD');

        weeks.push({
            weekNumber: weekIndex,
            weekLabel: `${weekIndex}주차`,
            fullLabel: `${monthNum}월 ${weekIndex}주차`,
            startDate: weekStartStr,
            endDate: weekEndStr,
            periodLabel: `${currentMonday.format('M.D')} ~ ${currentSunday.format('M.D')}`
        });

        weekIndex++;
        currentMonday = currentMonday.add(1, 'week').startOf('isoWeek');
    }

    return weeks;
}

/**
 * 주어진 날짜(기본값: 오늘)가 속한 월의 주차 정보(월요일~일요일 7일)를 반환합니다.
 */
export function getCurrentWeekInfo(date: string | Dayjs | Date = dayjs()): MonthWeekInfo {
    const target = dayjs(date);
    const monday = target.startOf('isoWeek');
    const sunday = target.endOf('isoWeek');

    const yearMonth = target.format('YYYY-MM');
    const targetDateStr = target.format('YYYY-MM-DD');
    const weeks = getMonthWeeks(yearMonth);

    const found = weeks.find((w) => w.startDate <= targetDateStr && targetDateStr <= w.endDate);
    if (found) return found;

    return {
        weekNumber: 1,
        weekLabel: '이번 주',
        fullLabel: `${target.format('M')}월 이번 주`,
        startDate: monday.format('YYYY-MM-DD'),
        endDate: sunday.format('YYYY-MM-DD'),
        periodLabel: `${monday.format('M.D')} ~ ${sunday.format('M.D')}`
    };
}
