export interface Todo {
    id: string;
    date: Date | string; // 날짜
    assignees: TodoUser[]; // 담당자 이름 목록
    delta?: any;
    source?: string;
    content: string; // 업무 내용
    workingHours?: string; // 근무 시간 (예: 14:00 ~ 18:00)
    isCompleted: boolean; // 완료 여부
    createdAt?: Date | string; // 생성일
}

export interface TodoUser {
    userId: string;
    userName: string;
}
