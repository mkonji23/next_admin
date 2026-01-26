'use client';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { useEffect, useState } from 'react';
import { useHttp } from '@/util/axiosInstance';

interface User {
    userId: string;
    userName: string;
    email: string;
    auth: string;
}

const UserListPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const http = useHttp();
    const fetchUsers = async () => {
        try {
            const response = await http.get('/choiMath/user/getUserList');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        // fetchUsers();
    }, []);

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold">출석부</span>
            <div className="flex gap-2">
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
            >
                <Column field="userId" header="ID"></Column>
                <Column field="userName" header="이름"></Column>
                <Column field="email" header="이메일"></Column>
                <Column field="auth" header="권한"></Column>
            </DataTable>
        </div>
    );
};

export default UserListPage;
