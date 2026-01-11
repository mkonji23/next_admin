'use client';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useEffect, useState } from 'react';
import { useHttp } from '@/util/axiosInstance';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

const UserListPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
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
        fetchUsers();
    }, []);

    return (
        <div className="card">
            <h1>사용자 목록</h1>
            <DataTable value={users} loading={loading} paginator rows={10} emptyMessage="사용자를 찾을 수 없습니다.">
                <Column field="userId" header="ID"></Column>
                <Column field="userName" header="이름"></Column>
                <Column field="email" header="이메일"></Column>
                <Column field="auth" header="권한"></Column>
            </DataTable>
        </div>
    );
};

export default UserListPage;
