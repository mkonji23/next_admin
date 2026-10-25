'use client';

import { useEffect } from 'react';
import PrimeReact, { addLocale } from 'primereact/api';

export const PrimeReactLocaleSetup = () => {
    useEffect(() => {
        // 순공모드 전체화면 등 고 z-index 레이어 위로 모달/팝업/토스트가 항상 뜨도록 전역 zIndex 설정
        PrimeReact.zIndex = {
            modal: 11000,
            overlay: 10000,
            menu: 10000,
            tooltip: 12000,
            toast: 13000
        };

        addLocale('ko', {
            firstDayOfWeek: 0,
            dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
            dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
            dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'],
            monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
            monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
            today: '오늘',
            clear: '초기화'
        });
    }, []);

    return null;
};
