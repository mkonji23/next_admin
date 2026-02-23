/**
 * 출석부 관련 상수
 */

/**
 * 출석 상태 옵션
 */
export const ATTENDANCE_STATUS_OPTIONS = [
    { label: '없음', value: 'none' },
    { label: '지각', value: 'late' },
    { label: '수업출석', value: 'class_present' },
    { label: '수업결석', value: 'class_absent' },
    { label: '보강출석', value: 'makeup_present' },
    { label: '보강결석', value: 'makeup_absent' },
    { label: '클리닉출석', value: 'clinic_present' },
    { label: '클리닉결석', value: 'clinic_absent' },
    { label: '기타', value: 'etc' }
] as const;

export type AttendanceStatusValue = (typeof ATTENDANCE_STATUS_OPTIONS)[number]['value'];

/**
 * 숙제 진행률 옵션
 */
export const HOMEWORK_PROGRESS_OPTIONS = [
    { label: '100%', value: 100 },
    { label: '75%', value: 75 },
    { label: '50%', value: 50 },
    { label: '25%', value: 25 },
    { label: '0%', value: 0 }
] as const;

/**
 * 지각 시간 옵션 (분 단위로 저장)
 */
export const LATE_TIME_OPTIONS = [
    { label: '15분', value: 15 },
    { label: '30분', value: 30 },
    { label: '1시간', value: 60 },
    { label: '2시간', value: 120 },
    { label: '3시간', value: 180 }
] as const;

/**
 * 요일 이름 배열
 */
export const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

/**
 * 공휴일 목록 (YYYY-MM-DD 형식)
 */
export const HOLIDAYS = ['2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18'] as const;

/**
 * 출석 상태에 따른 Tag 색상 반환
 */
export const getAttendanceSeverity = (
    status: string
): 'success' | 'danger' | 'info' | 'warning' | 'primary' | 'secondary' => {
    switch (status) {
        case 'class_present':
            return 'success';
        case 'class_absent':
            return 'danger';
        case 'makeup_present':
            return 'info';
        case 'makeup_absent':
            return 'warning';
        case 'clinic_present':
            return 'primary';
        case 'clinic_absent':
            return 'danger';
        case 'late':
            return 'warning';
        case 'etc':
            return 'danger';
        default:
            return 'secondary';
    }
};

/**
 * 숙제 진행률에 따른 Tag 색상 반환
 */
export const getHomeworkSeverity = (
    progress: number
): 'success' | 'danger' | 'info' | 'warning' | 'primary' | 'secondary' => {
    if (progress >= 100) {
        return 'success';
    } else if (progress >= 75) {
        return 'info';
    } else if (progress >= 50) {
        return 'warning';
    } else if (progress >= 25) {
        return 'warning';
    } else {
        return 'danger';
    }
};
