import { TodoStatus, TodoCategory } from '@/types/todo';

export const STATUS_LABELS: Record<TodoStatus, string> = {
    PENDING: '대기',
    IN_PROGRESS: '진행',
    HOLD: '보류',
    COMPLETED: '완료'
};

export const CATEGORY_LABELS: Record<TodoCategory, string> = {
    CLINIC: '클리닉',
    CLASS: '수업',
    EDIT: '편집',
    OTHER: '기타'
};

export const STATUS_SEVERITIES: Record<TodoStatus, string> = {
    PENDING: 'warning',
    IN_PROGRESS: 'info',
    HOLD: 'danger',
    COMPLETED: 'success'
};

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
    label,
    value
}));

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    label,
    value
}));
