export interface StatisticsSummary {
    totalClasses?: number;
    totalStudents?: number;
    totalDays: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate?: number;
    averageAttendanceRate: number;
    averageAbsentRate?: number;
    averageLateRate?: number;
    averageHomeworkRate: number;
}

export interface StudentStatistics {
    studentId: string;
    name: string;
    grade?: string;
    school?: string;
    statistics: {
        present: number;
        absent: number;
        late?: number;
        totalDays: number;
        attendanceRate: number;
        absentRate?: number;
        lateRate?: number;
        homeworkRate: number;
        homeworkCount: number;
    };
}

export interface ClassStatistics {
    classId: string;
    className: string;
    year: string;
    month: string;
    statistics: {
        totalStudents: number;
        totalDays: number;
        present: number;
        absent: number;
        late?: number;
        attendanceRate: number;
        absentRate?: number;
        lateRate?: number;
        homeworkRate: number;
    };
    students: StudentStatistics[];
}

export interface StudentDetailStatistics {
    classId: string;
    className: string;
    year: string;
    month: string;
    studentId: string;
    name: string;
    grade?: string;
    school?: string;
    statistics: {
        present: number;
        absent: number;
        late?: number;
        totalDays: number;
        attendanceRate: number;
        absentRate?: number;
        lateRate?: number;
        homeworkRate: number;
        homeworkCount: number;
    };
}

export interface StatisticsResponse {
    summary: StatisticsSummary;
    classes?: ClassStatistics[];
    student?: StudentDetailStatistics[];
}

export interface StudentStatisticsSummary {
    studentId: string;
    studentName?: string;
    studentGrade?: string;
    studentSchool?: string;
    totalClasses: number;
    totalDays: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate?: number;
    averageAttendanceRate: number;
    averageAbsentRate?: number;
    averageLateRate?: number;
    averageHomeworkRate: number;
}

export interface AttendanceDetail {
    status: string;
    homework: number;
    note: string;
    reinforce?: string;
    statusTime: string;
    date: string;
}

export interface PraiseDetail {
    date: string;
    praise: boolean;
    status?: string;
    homework?: number;
}

export interface PraiseClass {
    classId: string;
    className: string;
    attendance?: PraiseDetail[];
    totalPraiseCnt?: number;
    isClosed?: boolean;
    status?: string;
}

export interface PraiseBonusItem {
    studentId?: string;
    studentName?: string;
    targetMonth?: string;
    settledPeriodKey?: string;
    periodType?: string;
    weekNumber?: number;
    praiseCount: number;
    rank?: number;
    totalSeconds?: number;
    reason?: string;
    grantedBy?: string;
    createdAt?: string | Date;
}

export interface PraiseStatistics {
    studentId: string;
    name: string;
    grade?: string;
    school?: string;
    totalPraiseCnt: number;
    attendancePraiseCnt?: number;
    bonusPraiseCnt?: number;
    bonusList?: PraiseBonusItem[];
    classes: PraiseClass[];
    uniqueKey?: string;
}

export interface StudentClassStatistics {
    id: string;
    classId: string;
    className: string;
    year: string;
    month: string;
    statistics: {
        totalDays: number;
        present: number;
        absent: number;
        late?: number;
        attendanceRate: number;
        absentRate?: number;
        lateRate?: number;
        homeworkRate: number;
        homeworkCount: number;
    };
    attendance?: AttendanceDetail[];
}

export interface StudentAttendanceStatisticsResponse {
    summary: StudentStatisticsSummary;
    classes: StudentClassStatistics[];
}
