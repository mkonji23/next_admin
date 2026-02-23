---
name: create-custom-hook
description: 커스텀 React 훅 생성 가이드
---

# 커스텀 React 훅 생성 가이드

이 스킬은 재사용 가능한 커스텀 훅을 생성하는 방법을 안내합니다.

## 기본 구조

```tsx
import { useState, useEffect, useCallback } from 'react';

export const useFeatureName = (param: ParamType) => {
  // 상태
  const [data, setData] = useState<DataType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 함수
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 로직
      const result = await someAsyncOperation();
      setData(result);
    } catch (err: any) {
      setError(err.message || '에러가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [dependencies]);
  
  // 이펙트
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // 반환값
  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
};
```

## Toast 훅 예시

```tsx
import { Toast, ToastMessage } from 'primereact/toast';
import { createContext, ReactNode, useContext, useRef } from 'react';

export type ToastContextType = {
  showToast: (toastProp: ToastParam) => void;
};

type ToastParam = Pick<ToastMessage, 'severity' | 'summary' | 'detail'>;

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const toastRef = useRef<Toast>(null);

  const showToast = (props: ToastParam) => {
    toastRef.current?.show({
      severity: props.severity || 'info',
      summary: props.summary || 'Confirmed',
      detail: props.detail || 'No Content',
      life: 3000
    });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Toast ref={toastRef} />
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
```

## API 호출 훅 예시

```tsx
import { useState, useEffect, useCallback } from 'react';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';

export const useFetchData = (endpoint: string, params?: Record<string, any>) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const http = useHttp();
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await http.get(endpoint, { params });
      setData(response.data || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '데이터를 불러오는데 실패했습니다.';
      setError(errorMessage);
      showToast({
        severity: 'error',
        summary: '조회 실패',
        detail: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, params, http, showToast]);

  useEffect(() => {
    if (endpoint) {
      fetchData();
    }
  }, [endpoint, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
};
```

## 파일 위치

- `hooks/useFeatureName.tsx` 형식으로 저장
- Context Provider는 별도 파일로 분리 가능

## 네이밍 규칙

- `use` 접두사 사용
- 동사 형태: `useFetch`, `useAuth`, `useToast`
- 명사 + 동사: `useDataFetch`, `useUserAuth`

## 체크리스트

- [ ] `use` 접두사 사용
- [ ] 타입 정의
- [ ] 의존성 배열 올바르게 설정
- [ ] 에러 처리
- [ ] 로딩 상태 관리
- [ ] useCallback/useMemo로 최적화 (필요시)
- [ ] 반환값 타입 명시
