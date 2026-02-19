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
