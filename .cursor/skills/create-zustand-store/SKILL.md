---
name: create-zustand-store
description: Zustand 스토어 생성 가이드
---

# Zustand 스토어 생성 가이드

이 스킬은 Zustand를 사용한 상태 관리 스토어를 생성하는 방법을 안내합니다.

## 기본 스토어 구조

```tsx
import { create } from 'zustand';

interface StoreState {
  // 상태
  data: DataType[];
  isLoading: boolean;
  error: string | null;
  
  // 액션
  setData: (data: DataType[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const useFeatureStore = create<StoreState>()((set) => ({
  // 초기 상태
  data: [],
  isLoading: false,
  error: null,
  
  // 액션 구현
  setData: (data) => set({ data }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set({ data: [], isLoading: false, error: null }),
}));

export default useFeatureStore;
```

## localStorage 연동

인증 정보 등 영구 저장이 필요한 경우:

```tsx
import { create } from 'zustand';
import Cookies from 'js-cookie';

interface User {
  userId?: string;
  userName?: string;
  email: string;
  token: string;
}

interface AuthState {
  userInfo: User;
  setInfo: (data: User) => void;
  clearInfo: () => void;
  initializeFromStorage: () => void;
}

// localStorage 헬퍼 함수
const getStoredUserInfo = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('userInfo');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to parse stored userInfo:', error);
    return null;
  }
};

const setStoredUserInfo = (data: User) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('userInfo', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to store userInfo:', error);
  }
};

const removeStoredUserInfo = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('userInfo');
  } catch (error) {
    console.error('Failed to remove stored userInfo:', error);
  }
};

const useAuthStore = create<AuthState>()((set) => ({
  userInfo: (() => {
    const stored = getStoredUserInfo();
    return stored || { email: '', token: '' };
  })(),
  
  setInfo: (data) => {
    set({ userInfo: data });
    setStoredUserInfo(data);
    Cookies.set('token', data.token, {
      expires: 1,
      secure: process.env.NEXT_PUBLIC_TYPE !== 'dev',
      sameSite: 'Strict'
    });
  },
  
  clearInfo: () => {
    set({ userInfo: { email: '', token: '' } });
    removeStoredUserInfo();
    Cookies.remove('token');
  },
  
  initializeFromStorage: () => {
    const stored = getStoredUserInfo();
    const token = Cookies.get('token');
    if (token && stored) {
      set({ userInfo: stored });
    } else if (!token) {
      removeStoredUserInfo();
      set({ userInfo: { email: '', token: '' } });
    }
  },
}));

export default useAuthStore;
```

## 컴포넌트에서 사용

```tsx
'use client';

import useAuthStore from '@/store/useAuthStore';

export default function MyComponent() {
  // 전체 스토어 사용
  const { userInfo, setInfo } = useAuthStore();
  
  // 특정 값만 선택 (성능 최적화)
  const userName = useAuthStore((state) => state.userInfo.userName);
  
  return <div>{userName}</div>;
}
```

## 초기화 패턴

컴포넌트 마운트 시 localStorage에서 복원:

```tsx
useEffect(() => {
  initializeFromStorage();
}, [initializeFromStorage]);
```

## 체크리스트

- [ ] 타입 정의 (State 인터페이스)
- [ ] 초기 상태 설정
- [ ] 액션 함수 구현
- [ ] localStorage 연동 (필요시)
- [ ] Cookie 연동 (인증 정보인 경우)
- [ ] 에러 처리 (localStorage 접근 시)
- [ ] SSR 고려 (`typeof window` 체크)
