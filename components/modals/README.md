# Custom Modal 사용법

## 기본 사용법

```typescript
import { useCustomModal } from '@/hooks/useCustomModal';

const MyComponent = () => {
    const { openModal } = useCustomModal();

    const handleOpenUserModal = async () => {
        try {
            const result = await openModal({
                id: 'user',
                pData: {
                    mode: 'new',
                    authOptions: [
                        { label: '관리자', value: 'admin' },
                        { label: '학생', value: 'student' }
                    ],
                    onSubmit: async (user) => {
                        // 저장 로직
                        await saveUser(user);
                    }
                }
            });
            
            if (result) {
                console.log('저장된 사용자:', result);
            } else {
                console.log('취소됨');
            }
        } catch (error) {
            console.error('에러:', error);
        }
    };

    return <button onClick={handleOpenUserModal}>사용자 등록</button>;
};
```

## 수정 모달 예시

```typescript
const handleEditUser = async (user: User) => {
    const result = await openModal({
        id: 'user',
        pData: {
            mode: 'edit',
            user: user,
            authOptions: authOptions,
            onSubmit: async (updatedUser) => {
                await http.post(`/choiMath/user/updateUser/${updatedUser.userId}`, updatedUser);
            }
        }
    });
    
    if (result) {
        fetchUsers(); // 목록 새로고침
    }
};
```

## 새로운 모달 추가하기

1. `components/modals/` 폴더에 새 모달 컴포넌트 생성
2. `modalRegistry.tsx`에 모달 등록

```typescript
// components/modals/MyModal.tsx
interface MyModalProps {
    visible: boolean;
    pData?: {
        // 필요한 데이터 정의
    };
    onClose: (result?: any) => void;
}

const MyModal = ({ visible, pData, onClose }: MyModalProps) => {
    // 모달 구현
    return <Dialog visible={visible}>...</Dialog>;
};

// modalRegistry.tsx에 추가
registerModal({ id: 'myModal', component: MyModal });
```
