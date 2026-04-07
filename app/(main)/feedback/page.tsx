'use client';

import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import dayjs from 'dayjs';
import Link from 'next/link';
import FeedbackDialogContent from './components/FeedbackDialogContent';

interface Feedback {
    id?: number | null;
    category: string;
    title: string;
    content: string;
    author: string;
    createdAt: string;
    delta?: any;
}

const emptyPost: Feedback = {
    id: null,
    category: '신규',
    title: '',
    content: '',
    author: '테스트유저', // In a real app, this would come from auth state
    createdAt: '',
    delta: null
};

// Mock Data
const mockPosts: Feedback[] = [
    {
        id: 1,
        category: '개선',
        title: '에디터 폰트 사이즈 추가 요청',
        author: '홍길동',
        createdAt: '2024-05-01',
        content: '에디터에 더 다양한 폰트 사이즈를 추가해주시면 좋겠습니다.',
        delta: { ops: [{ insert: '에디터에 더 다양한 폰트 사이즈를 추가해주시면 좋겠습니다.\n' }] }
    },
    {
        id: 2,
        category: '오류',
        title: '로그인 시 간헐적 500 에러 발생',
        author: '이순신',
        createdAt: '2024-04-30',
        content: '특정 조건에서 로그인을 시도하면 500 서버 에러가 발생합니다. 확인 부탁드립니다.',
        delta: { ops: [{ insert: '특정 조건에서 로그인을 시도하면 500 서버 에러가 발생합니다. 확인 부탁드립니다.\n' }] }
    },
    {
        id: 3,
        category: '신규',
        title: '피드백 게시판 기능 제안',
        author: '유관순',
        createdAt: '2024-04-29',
        content: '개발팀과의 원활한 소통을 위해 피드백 게시판이 있으면 좋겠습니다.',
        delta: { ops: [{ insert: '개발팀과의 원활한 소통을 위해 피드백 게시판이 있으면 좋겠습니다.\n' }] }
    }
];

const FeedbackPage = () => {
    const [posts, setPosts] = useState(mockPosts);
    const [post, setPost] = useState<Feedback>(emptyPost);
    const [displayDialog, setDisplayDialog] = useState(false);

    const openNew = () => {
        setPost(emptyPost);
        setDisplayDialog(true);
    };

    const hideDialog = () => {
        setDisplayDialog(false);
    };

    const handleSave = () => {
        const newPost: Feedback = {
            ...post,
            id: Math.floor(Math.random() * 1000) + 1000, // mock id
            createdAt: dayjs().format('YYYY-MM-DD')
        };
        setPosts([newPost, ...posts]);
        hideDialog();
    };

    const handlePostChange = (field: keyof Feedback, value: any) => {
        setPost((prev) => ({ ...prev, [field]: value }));
    };

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <h5 className="m-0">피드백 목록</h5>
            <Button label="새 글 작성" icon="pi pi-plus" onClick={openNew} />
        </div>
    );

    const dialogFooter = (
        <div>
            <Button label="취소" icon="pi pi-times" onClick={hideDialog} className="p-button-text" />
            <Button label="저장" icon="pi pi-check" onClick={handleSave} />
        </div>
    );

    const categoryBodyTemplate = (rowData: Feedback) => {
        const severity = {
            '신규': 'info',
            '개선': 'success',
            '오류': 'danger',
            '기타': 'warning'
        }[rowData.category] || 'primary';

        return <Tag value={rowData.category} severity={severity as any} />;
    };

    const dateBodyTemplate = (rowData: Feedback) => {
        return dayjs(rowData.createdAt).format('YYYY-MM-DD');
    };

    return (
        <div className="card">
            <DataTable value={posts} header={header} paginator rows={10} emptyMessage="피드백이 없습니다.">
                <Column field="id" header="번호" sortable style={{ width: '10%' }}></Column>
                <Column
                    field="category"
                    header="구분"
                    sortable
                    body={categoryBodyTemplate}
                    style={{ width: '15%' }}
                ></Column>
                <Column
                    field="title"
                    header="제목"
                    sortable
                    body={(rowData: Feedback) => (
                        <Link href={`/feedback/${rowData.id}`} className="text-primary hover:underline font-semibold">
                            {rowData.title}
                        </Link>
                    )}
                    style={{ width: '50%' }}
                ></Column>
                <Column field="author" header="작성자" sortable style={{ width: '15%' }}></Column>
                <Column
                    field="createdAt"
                    header="작성일"
                    sortable
                    body={dateBodyTemplate}
                    style={{ width: '10%' }}
                ></Column>
            </DataTable>

            <Dialog
                header="새 피드백 작성"
                visible={displayDialog}
                style={{ width: '750px' }}
                modal
                footer={dialogFooter}
                onHide={hideDialog}
            >
                <FeedbackDialogContent post={post} onPostChange={handlePostChange} />
            </Dialog>
        </div>
    );
};

export default FeedbackPage;
