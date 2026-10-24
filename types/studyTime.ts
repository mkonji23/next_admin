export type StudyEndReason =
    | 'manual_pause'
    | 'background_leave'
    | 'window_blur'
    | 'page_closed'
    | 'auto_closed_on_new_start';

export interface StudySession {
    sessionId: string;
    startedAt: string | Date;
    endedAt: string | Date | null;
    durationSeconds: number;
    endReason?: StudyEndReason | null;
    currentTicket?: string | null;
}

export interface TodayStudyTimeData {
    studentId: string;
    date: string;
    totalSeconds: number;
    overallTotalSeconds?: number;
    goalSeconds: number;
    firstStartedAt: string | Date | null;
    lastEndedAt: string | Date | null;
    sessionsCount: number;
    sessions: StudySession[];
    activeSession: StudySession | null;
}

export interface MonthlyStudyDailyItem {
    date: string;
    totalSeconds: number;
    goalSeconds: number;
    sessionsCount: number;
    firstStartedAt: string | Date | null;
    lastEndedAt: string | Date | null;
}

export interface MonthlyStudyTimeData {
    studentId: string;
    month: string;
    monthlyTotalSeconds: number;
    dailyList: MonthlyStudyDailyItem[];
}

export interface StudyRankingItem {
    rank: number;
    studentId: string;
    name: string;
    school?: string;
    grade?: string | number;
    profile?: string;
    totalSeconds: number;
    firstStartedAt?: string | Date | null;
    lastEndedAt?: string | Date | null;
}
