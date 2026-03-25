/**
 * 사용자 권한 옵션 상수
 */
export const USER_AUTH_OPTIONS = [
    { label: '관리자', value: 'admin' },
    { label: '학생', value: 'student' },
    { label: '선생님', value: 'teacher' },
    { label: '학부모님', value: 'parent' }
];

export type UserAuthValue = 'admin' | 'student' | 'teacher' | 'parent';

export const USER_COLORS = [
    { bg: '#E3F2FD', text: '#1E88E5' }, // 연파랑
    { bg: '#F3E5F5', text: '#8E24AA' }, // 연보라
    { bg: '#E8F5E9', text: '#43A047' }, // 연초록
    { bg: '#FFF3E0', text: '#FB8C00' }, // 연주황
    { bg: '#FCE4EC', text: '#D81B60' }, // 연분홍
    { bg: '#E0F2F1', text: '#00897B' }, // 청록
    { bg: '#FFFDE7', text: '#FBC02D' }, // 연노랑
    { bg: '#EFEBE9', text: '#6D4C41' } // 브라운
];
