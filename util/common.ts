import { USER_AUTH_OPTIONS } from '@/constants/user';

/**
 * 권한 값(auth value)을 라벨(label)로 변환하는 함수
 * @param authValue - 권한 값 (예: 'admin', 'student', 'teacher', 'parent')
 * @returns 권한 라벨 (예: '관리자', '학생', '선생님', '학부모님'), 값이 없으면 '-', 매칭되지 않으면 원본 값 반환
 */
export const getCommonLabel = (options: { label: string; value: string }[], authValue: string | null): string => {
    if (!authValue) return '-';
    const authOption = options.find((option) => option.value === authValue);
    return authOption ? authOption.label : authValue;
};
