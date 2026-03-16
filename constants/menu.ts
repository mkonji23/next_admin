import { AppMenuItem } from '@/types';

export const AppMenuModel: AppMenuItem[] = [
    {
        label: 'Statistics',
        items: [
            { label: '출석 현황 통계', icon: 'pi pi-fw pi-chart-bar', to: '/attendanceList', badge: 'NEW' },
            { label: '학생별 출석현황 통계', icon: 'pi pi-fw pi-user', to: '/studentAttendanceStatistics' },
            { label: '칭찬 현황 통계', icon: 'pi pi-fw pi-heart', to: '/praise' }
        ]
    },
    {
        label: 'Attendance',
        items: [
            { label: '출석부', icon: 'pi pi-fw pi-check-square', to: '/attendance' },
            { label: '학생별 주간스케줄', icon: 'pi pi-fw pi-calendar', to: '/weekSchedule' },
            { label: '조교쌤 일자별 업무', icon: 'pi pi-fw pi-list', to: '/assistantTodo' }
        ]
    },
    {
        label: 'Share',
        items: [
            { label: '카카오 공유 게시판', icon: 'pi pi-fw pi-share-alt', to: '/kakao-share' },
            { label: '토큰 발급(X)', icon: 'pi pi-fw pi-key', to: '/settings/kakao' }
        ]
    },
    {
        label: 'Settings',
        items: [
            { label: '학생 목록', icon: 'pi pi-fw pi-user', to: '/studentList' },
            { label: '클래스 목록', icon: 'pi pi-fw pi-book', to: '/classList' },
            { label: '사용자 목록', icon: 'pi pi-fw pi-users', to: '/userList' }
        ]
    },
    {
        label: 'HELP',
        items: [
            { label: '사용 매뉴얼', icon: 'pi pi-fw pi-book', to: '/manual' },
            { label: 'example', icon: 'pi pi-fw pi-home', to: '/dash' }
        ]
    }
];
