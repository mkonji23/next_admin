/**
 * 사용자 이름에 해당하는 태그의 배경색을 반환합니다.
 * 추후 색상 변경이나 새로운 사용자 추가 시 이 객체만 수정하면 됩니다.
 */
const userColors: { [key: string]: string } = {
    김지안: '#FB8C00', // 주황색 계열
    김은영: '#673AB7', // 파란색 계열
    multiple: '#1E88E5', // 보라색 계열 (여러 명일 때)
    // 여기에 더 많은 사용자 이름과 색상 코드를 추가할 수 있습니다.
    // 예: '박서준': '#4CAF50',

    // 기본 색상 (정의되지 않은 사용자 이름에 대한 기본값)
    default: '#1E88E5' // 분홍색 계열
};

/**
 * 사용자 이름에 따라 고유한 태그 배경색을 반환하는 함수입니다.
 * @param userName 색상을 적용할 사용자의 이름.
 * @returns 해당 사용자 이름에 매핑된 색상 코드 (HEX).
 */
export const getUserTagColor = (userName: string | undefined): string => {
    if (!userName) {
        return userColors['default']; // 이름이 없으면 기본 색상 반환
    }
    // userColors 객체에서 사용자 이름을 키로 색상 코드를 찾고, 없으면 기본 색상 반환
    return userColors[userName] || userColors['default'];
};
