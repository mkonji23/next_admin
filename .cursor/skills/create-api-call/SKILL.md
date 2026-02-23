---
name: create-api-call
description: API 호출 코드 생성 가이드
---

# API 호출 코드 생성 가이드

이 스킬은 Next.js 프로젝트에서 Axios를 사용한 API 호출 코드를 생성하는 방법을 안내합니다.

## 기본 패턴

### 1. useHttp 훅 사용

```tsx
import { useHttp } from '@/util/axiosInstance';

const http = useHttp();
```

### 2. GET 요청

```tsx
const fetchData = async () => {
  try {
    const response = await http.get('/choiMath/resource/', {
      params: {
        id: resourceId,
        year: year,
        month: month
      }
    });
    setData(response.data);
  } catch (error: any) {
    console.error('Error fetching data:', error);
    showToast({
      severity: 'error',
      summary: '조회 실패',
      detail: error.response?.data?.message || '데이터를 불러오는데 실패했습니다.'
    });
  }
};
```

### 3. POST 요청

```tsx
const saveData = async (data: FormData) => {
  try {
    await http.post('/choiMath/resource/', data);
    showToast({
      severity: 'success',
      summary: '저장 성공',
      detail: '데이터가 저장되었습니다.'
    });
  } catch (error: any) {
    console.error('Error saving data:', error);
    const errorMessage = 
      error.response?.data?.message || 
      error.message || 
      '저장에 실패했습니다.';
    showToast({
      severity: 'error',
      summary: '저장 실패',
      detail: errorMessage
    });
  }
};
```

### 4. 수정 요청 (POST 사용)

```tsx
const updateData = async (id: number, data: FormData) => {
  try {
    await http.post('/choiMath/resource/updateResource', {
      id: id,
      ...data
    });
    showToast({
      severity: 'success',
      summary: '수정 성공',
      detail: '데이터가 수정되었습니다.'
    });
  } catch (error: any) {
    console.error('Error updating data:', error);
    const errorMessage = 
      error.response?.data?.message || 
      error.message || 
      '수정에 실패했습니다.';
    showToast({
      severity: 'error',
      summary: '수정 실패',
      detail: errorMessage
    });
  }
};
```

### 5. 삭제 요청 (POST 사용)

```tsx
const deleteData = async (id: number) => {
  try {
    await http.post('/choiMath/resource/deleteResource', {
      id: id
    });
    showToast({
      severity: 'success',
      summary: '삭제 성공',
      detail: '데이터가 삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('Error deleting data:', error);
    const errorMessage = 
      error.response?.data?.message || 
      error.message || 
      '삭제에 실패했습니다.';
    showToast({
      severity: 'error',
      summary: '삭제 실패',
      detail: errorMessage
    });
  }
};
```

## 데이터 포맷팅

API 요청 전 데이터를 적절히 포맷팅합니다.

```tsx
const formatData = () => {
  return {
    classId: selectedClass,
    year: year.toString(),
    month: String(month).padStart(2, '0'),
    students: users.map((user) => ({
      studentId: user.studentId || '',
      name: user.name,
      grade: user.grade || '',
      school: user.school || '',
      attendance: formatAttendance(user)
    }))
  };
};
```

## useEffect에서 호출

```tsx
useEffect(() => {
  if (!selectedClass || !date) {
    return;
  }
  fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedClass, date]);
```

## 체크리스트

- [ ] `useHttp` 훅 사용
- [ ] try-catch로 에러 처리
- [ ] 에러 메시지를 사용자에게 표시 (showToast)
- [ ] 데이터 포맷팅 함수 분리
- [ ] 로딩 상태 관리 (필요시)
- [ ] 의존성 배열 올바르게 설정
