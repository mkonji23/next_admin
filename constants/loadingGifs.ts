/**
 * @file loadingGifs.ts
 * @description 새로 추가된 40종의 픽셀 아트 애니메이션 GIF 목록 및 랜덤 로딩 유틸
 */

export const LOADING_GIFS = [
    '/layout/images/6e45w3q4_-1-.gif',
    '/layout/images/6e45w3q4_-2-.gif',
    '/layout/images/6e45w3q4_-3-.gif',
    '/layout/images/6e45w3q4_-4-.gif',
    '/layout/images/6e45w3q4_-5-.gif',
    '/layout/images/6e45w3q4_-6-.gif',
    '/layout/images/6e45w3q4_-7-.gif',
    '/layout/images/6e45w3q4_-8-.gif',
    '/layout/images/6e45w3q4_-9-.gif',
    '/layout/images/6e45w3q4_-10-.gif',
    '/layout/images/6e45w3q4_-11-.gif',
    '/layout/images/6e45w3q4_-12-.gif',
    '/layout/images/6e45w3q4_-13-.gif',
    '/layout/images/6e45w3q4_-14-.gif',
    '/layout/images/6e45w3q4_-15-.gif',
    '/layout/images/6e45w3q4_-16-.gif',
    '/layout/images/6e45w3q4_-18-.gif',
    '/layout/images/6e45w3q4_-19-.gif',
    '/layout/images/6e45w3q4_-20-.gif',
    '/layout/images/6e45w3q4_-21-.gif',
    '/layout/images/6e45w3q4_-22-.gif',
    '/layout/images/6e45w3q4_-23-.gif',
    '/layout/images/6e45w3q4_-24-.gif',
    '/layout/images/6e45w3q4_-25-.gif',
    '/layout/images/6e45w3q4_-26-.gif',
    '/layout/images/6e45w3q4_-27-.gif',
    '/layout/images/6e45w3q4_-28-.gif',
    '/layout/images/6e45w3q4_-29-.gif',
    '/layout/images/6e45w3q4_-30-.gif',
    '/layout/images/6e45w3q4_-31-.gif',
    '/layout/images/6e45w3q4_-32-.gif',
    '/layout/images/6e45w3q4_-33-.gif',
    '/layout/images/6e45w3q4_-34-.gif',
    '/layout/images/6e45w3q4_-35-.gif',
    '/layout/images/6e45w3q4_-36-.gif',
    '/layout/images/6e45w3q4_-37-.gif',
    '/layout/images/6e45w3q4_-38-.gif',
    '/layout/images/6e45w3q4_-39-.gif',
    '/layout/images/6e45w3q4_-40-.gif',
    '/layout/images/6e45w3q4_-41-.gif'
];

/**
 * 40종의 GIF 중 랜덤으로 1개를 반환합니다.
 */
export const getRandomLoadingGif = (): string => {
    const randomIndex = Math.floor(Math.random() * LOADING_GIFS.length);
    return LOADING_GIFS[randomIndex] || LOADING_GIFS[0];
};
