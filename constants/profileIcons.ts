/**
 * @file profileIcons.ts
 * @description 프로필 아이콘 목록 및 픽셀 애니메이션 GIF, 신규 캐릭터 PNG, 기본 프로필 상수 정의
 */

import { LOADING_GIFS } from './loadingGifs';

export interface ProfileIconItem {
    name: string;
    value: string;
    isNew?: boolean;
    category?: 'base' | 'new' | 'character' | 'special' | 'gif';
}

/** 40종 애니메이션 GIF 프로필 목록 */
export const GIF_PROFILE_ICONS: ProfileIconItem[] = LOADING_GIFS.map((path, idx) => ({
    name: `GIF ${idx + 1}`,
    value: path,
    isNew: false,
    category: 'gif'
}));

/** 기본 17종 프로필 아이콘 */
export const BASE_PROFILE_ICONS: ProfileIconItem[] = [
    { name: '아이콘 1', value: '/icons/profiles/profile1.JPG', category: 'base' },
    { name: '아이콘 2', value: '/icons/profiles/profile2.JPG', category: 'base' },
    { name: '아이콘 3', value: '/icons/profiles/profile3.JPG', category: 'base' },
    { name: '아이콘 4', value: '/icons/profiles/profile4.JPG', category: 'base' },
    { name: '아이콘 5', value: '/icons/profiles/profile5.JPG', category: 'base' },
    { name: '아이콘 6', value: '/icons/profiles/profile6.JPG', category: 'base' },
    { name: '아이콘 7', value: '/icons/profiles/profile7.JPG', category: 'base' },
    { name: '아이콘 8', value: '/icons/profiles/profile8.JPG', category: 'base' },
    { name: '아이콘 9', value: '/icons/profiles/profile9.JPG', category: 'base' },
    { name: '아이콘 10', value: '/icons/profiles/profile10.JPG', category: 'base' },
    { name: '아이콘 11', value: '/icons/profiles/profile11.JPG', category: 'base' },
    { name: '아이콘 12', value: '/icons/profiles/profile12.JPG', category: 'base' },
    { name: '아이콘 13', value: '/icons/profiles/profile13.JPG', category: 'base' },
    { name: '아이콘 14', value: '/icons/profiles/profile14.JPG', category: 'base' },
    { name: '아이콘 15', value: '/icons/profiles/profile15.JPG', category: 'base' },
    { name: '아이콘 16', value: '/icons/profiles/profile16.JPG', category: 'base' },
    { name: '아이콘 17', value: '/icons/profiles/profile17.JPG', category: 'base' }
];

/** 새로 추가된 74종의 신규 PNG 프로필 목록 */
export const NEW_PNG_FILES = [
    '4r12q3_-1-.png',
    '4r12q3_-3-.png',
    '4r12q3_-4-.png',
    '4r12q3_-5-.png',
    '4r12q3_-9- (1).png',
    '4r12q3_-17-.png',
    '4r12q3_-18-.png',
    '4r12q3_-19-.png',
    '4r12q3_-20-.png',
    '4r12q3_-22-.png',
    '4r12q3_-23-.png',
    '4r12q3_-24-.png',
    'd6e8t4r_-1-.png',
    'd6e8t4r_-3-.png',
    'd6e8t4r_-4-.png',
    'd6e8t4r_-6-.png',
    'd6e8t4r_-7-.png',
    'd6e8t4r_-8-.png',
    'd6e8t4r_-9-.png',
    'd6e8t4r_-11-.png',
    'd6e8t4r_-12- (1).png',
    'd6e8t4r_-13- (1).png',
    'd6e8t4r_-14- (1).png',
    'd6e8t4r_-15- (1).png',
    'd6e8t4r_-17- (1).png',
    'd6e8t4r_-18- (1).png',
    'd6e8t4r_-19- (1).png',
    'd6e8t4r_-20-.png',
    'd6e8t4r_-21-.png',
    'd6e8t4r_-22-.png',
    'd6e8t4r_-23-.png',
    'd6e8t4r_-25-.png',
    'd6e8t4r_-26-.png',
    'd6e8t4r_-27- (1).png',
    'd6e8t4r_-28- (1).png',
    'd6e8t4r_-30- (1).png',
    'd6e8t4r_-31- (1).png',
    'd6e8t4r_-33- (1).png',
    'd6e8t4r_-34- (1).png',
    'd6e8t4r_-35- (1).png',
    'd6e8t4r_-42- (1).png',
    'd6e8t4r_-43- (1).png',
    'd6e8t4r_-44- (1).png',
    'd6e8t4r_-45- (1).png',
    'd6e8t4r_-46- (1).png',
    'd6e8t4r_-47- (1).png',
    'd6e8t4r_-48- (1).png',
    'd6e8t4r_-49- (1).png',
    'd6e8t4r_-50-.png',
    'd6e8t4r_-51-.png',
    'd6e8t4r_-52-.png',
    'd6e8t4r_-53-.png',
    'd6e8t4r_-54-.png',
    'd6e8t4r_-55-.png',
    'd6e8t4r_-56- (1).png',
    'd6e8t4r_-56-.png',
    'd6e8t4r_-57- (1).png',
    'd6e8t4r_-58- (1).png',
    'd6e8t4r_-59- (1).png',
    'd6e8t4r_-60- (1).png',
    'd6e8t4r_-61- (1).png',
    'd6e8t4r_-62- (1).png',
    'd6e8t4r_-64- (1).png',
    'd6e8t4r_-65- (1).png',
    'd6e8t4r_-66- (1).png',
    'd6e8t4r_-68- (1).png',
    'd6e8t4r_-69- (1).png',
    'd6e8t4r_-70- (1).png',
    'd6e8t4r_-71- (1).png',
    'd6e8t4r_-72- (1).png',
    'd6e8t4r_-73- (1).png',
    'd6e8t4r_-74- (1).png',
    'd6e8t4r_-75- (1).png',
    'd6e8t4r_-76- (1).png'
];

export const NEW_PNG_PROFILE_ICONS: ProfileIconItem[] = NEW_PNG_FILES.map((fileName, idx) => ({
    name: `캐릭터 ${idx + 1}`,
    value: `/icons/profiles/${fileName}`,
    isNew: false,
    category: 'character'
}));

/** 순위에 따른 스페셜 아이콘, 애니메이션 GIF, 캐릭터 아이콘이 결합된 전체 프로필 목록 생성 */
export const getFullProfileIcons = (highestRank: number = 0): ProfileIconItem[] => {
    const list: ProfileIconItem[] = [];

    // 1. 40종 애니메이션 GIF 아이콘
    list.push(...GIF_PROFILE_ICONS);

    // 2. 캐릭터 PNG 아이콘 (74종)
    list.push(...NEW_PNG_PROFILE_ICONS);

    // 3. 기본 17종 아이콘
    list.push(...BASE_PROFILE_ICONS);

    // 4. 랭커 스페셜 아이콘
    if (highestRank > 0) {
        if (highestRank <= 3) {
            list.push({ name: '스페셜(3위)', value: '/icons/profiles/profile_win.png', category: 'special' });
        }
        if (highestRank <= 2) {
            list.push({ name: '스페셜(2위)', value: '/icons/profiles/profile_win3.png', category: 'special' });
        }
        if (highestRank === 1) {
            list.push({ name: '스페셜(1위)', value: '/icons/profiles/profile_win2.png', category: 'special' });
        }
    }

    return list;
};
