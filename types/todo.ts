export type TodoStatus = 'PENDING' | 'IN_PROGRESS' | 'HOLD' | 'COMPLETED';
export type TodoCategory = 'CLINIC' | 'CLASS' | 'EDIT' | 'OTHER';

export interface Todo {
    id: string;
    title: string; // 업무 제목
    category: TodoCategory; // 업무 구분
    startDate: Date | string; // 시작 일자
    endDate: Date | string; // 종료 일자
    status: TodoStatus; // 상태
    delayedReason?: string; // 지연 사유
    date?: Date | string; // 날짜 (기존 호환용)
    assignees: TodoUser[]; // 담당자 이름 목록
    delta?: any;
    source?: string;
    content: string; // 업무 내용
    isCompleted: boolean; // 완료 여부
}

export interface TodoUser {
    userId: string;
    userName: string;
}
