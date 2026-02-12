'use client';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { useEffect, useState } from 'react';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { User } from '@/components/modals/UserModal';
import { useCustomModal } from '@/hooks/useCustomModal';

const UserListPage = () => {
    const { openModal } = useCustomModal();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const http = useHttp();
    const { showToast } = useToast();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await http.get('/choiMath/user/getUserList');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            showToast({ severity: 'error', summary: '조회 실패', detail: '사용자 목록을 불러오는데 실패했습니다.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // fetchUsers();
    }, []);

    const openEditDialog = async (user: User) => {
        const result = await openModal({
            id: 'user',
            pData: {
                mode: 'edit',
                user: user
            }
        });
        if (result) {
            fetchUsers();
        }
    };

    const openNewUserDialog = async () => {
        const result = await openModal({
            id: 'user',
            pData: {
                mode: 'new'
            }
        });

    };

    const handleDeleteUsers = async () => {
        if (selectedUsers.length === 0) {
            showToast({ severity: 'warn', summary: '선택 오류', detail: '삭제할 사용자를 선택해주세요.' });
            return;
        }

        try {
            const userIds = selectedUsers.map(user => user.userId);
            await http.post('/choiMath/user/deleteUsers', { data: { userIds } });
            showToast({ severity: 'success', summary: '삭제 성공', detail: `${selectedUsers.length}명의 사용자가 삭제되었습니다.` });
            setSelectedUsers([]);
            fetchUsers();
        } catch (error: any) {
            console.error('Error deleting users:', error);
            const errorMessage = error.response?.data?.message || error.message || '사용자 삭제에 실패했습니다.';
            showToast({ severity: 'error', summary: '삭제 실패', detail: errorMessage });
        }
    };

    const actionBodyTemplate = (rowData: User) => {
        return (
            <Button
                icon="pi pi-pencil"
                rounded
                outlined
                severity="warning"
                onClick={() => openEditDialog(rowData)}
                tooltip="수정"
                tooltipOptions={{ position: 'top' }}
            />
        );
    };


    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold">출석부</span>
            <div className="flex gap-2">
                <Button
                    icon="pi pi-plus"
                    rounded
                    raised
                    label="신규"
                    onClick={openNewUserDialog}
                    className="p-button-info"
                />
                <Button
                    icon="pi pi-trash"
                    rounded
                    raised
                    label="삭제"
                    onClick={handleDeleteUsers}
                    className="p-button-danger"
                    disabled={selectedUsers.length === 0}
                />
                <Button
                    icon="pi pi-search"
                    rounded
                    raised
                    label="조회"
                    onClick={fetchUsers}
                    className="p-button-success"
                />
            </div>
        </div>
    );

    return (
        <div className="card">
            <h1>사용자 목록</h1>
            <DataTable
                value={users}
                header={header}
                loading={loading}
                paginator
                rows={10}
                emptyMessage="사용자를 찾을 수 없습니다."
                selection={selectedUsers}
                onSelectionChange={(e) => setSelectedUsers(e.value as User[])}
                dataKey="userId"
                selectionMode="checkbox"
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                <Column field="userId" header="ID"></Column>
                <Column field="userName" header="이름"></Column>
                <Column field="email" header="이메일"></Column>
                <Column field="auth" header="권한"></Column>
                <Column body={actionBodyTemplate} header="작업" headerStyle={{ minWidth: '4rem' }}></Column>
            </DataTable>
        </div>
    );
};

export default UserListPage;
