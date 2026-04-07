'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputTextarea } from 'primereact/inputtextarea';
import { CustomEditor } from '@/components/editor/CustomEditor';
import dayjs from 'dayjs';

// Re-defining mock data here for demonstration. In a real app, this would be fetched.
interface Feedback {
    id?: number | null;
    category: string;
    title: string;
    content: string;
    author: string;
    createdAt: string;
    delta?: any;
}
const mockPosts: Feedback[] = [
    {
        id: 1,
        category: '개선',
        title: '에디터 폰트 사이즈 추가 요청',
        author: '홍길동',
        createdAt: '2024-05-01',
        content: '에디터에 더 다양한 폰트 사이즈를 추가해주시면 좋겠습니다.',
        delta: { ops: [{ insert: '에디터에 더 다양한 폰트 사이즈를 추가해주시면 좋겠습니다.
' }] }
    },
    {
        id: 2,
        category: '오류',
        title: '로그인 시 간헐적 500 에러 발생',
        author: '이순신',
        createdAt: '2024-04-30',
        content: '특정 조건에서 로그인을 시도하면 500 서버 에러가 발생합니다. 확인 부탁드립니다.',
        delta: { ops: [{ insert: '특정 조건에서 로그인을 시도하면 500 서버 에러가 발생합니다. 확인 부탁드립니다.
' }] }
    },
    {
        id: 3,
        category: '신규',
        title: '피드백 게시판 기능 제안',
        author: '유관순',
        createdAt: '2024-04-29',
        content: '개발팀과의 원활한 소통을 위해 피드백 게시판이 있으면 좋겠습니다.',
        delta: { ops: [{ insert: '개발팀과의 원활한 소통을 위해 피드백 게시판이 있으면 좋겠습니다.
' }] }
    }
];

const mockComments = [
    { id: 1, author: '관리자', content: '좋은 의견 감사합니다. 폰트 사이즈 추가 검토하겠습니다.', createdAt: '2024-05-01' },
    { id: 2, author: '개발팀', content: '로그인 오류는 현재 수정 중이며, 다음 업데이트에 반영될 예정입니다.', createdAt: '2024-05-01' }
];

const FeedbackDetailPage = () => {
    const params = useParams();
    const [post, setPost] = useState<Feedback | null>(null);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        if (params.id) {
            const postId = parseInt(params.id as string, 10);
            const foundPost = mockPosts.find((p) => p.id === postId);
            setPost(foundPost || null);
        }
    }, [params.id]);

    if (!post) {
        return <div className="card">게시물을 찾을 수 없습니다.</div>;
    }
    
    const categoryBodyTemplate = (rowData: Feedback) => {
        const severity = {
            '신규': 'info',
            '개선': 'success',
            '오류': 'danger',
            '기타': 'warning'
        }[rowData.category] || 'primary';

        return <Tag value={rowData.category} severity={severity as any} />;
    };

    return (
        <div className="card">
            {/* Post Header */}
            <div className="border-bottom-1 surface-border pb-3 mb-3">
                <div className='flex align-items-center mb-2'>
                    {categoryBodyTemplate(post)}
                    <h2 className="text-3xl font-bold ml-3 mb-0">{post.title}</h2>
                </div>
                <div className="flex align-items-center text-sm text-color-secondary">
                    <span>작성자: {post.author}</span>
                    <span className="mx-2">|</span>
                    <span>작성일: {dayjs(post.createdAt).format('YYYY-MM-DD')}</span>
                </div>
            </div>

            {/* Post Content */}
            <div className="mb-5">
                <CustomEditor delta={post.delta} readOnly={true} />
            </div>

            {/* Comments Section */}
            <div className="pt-5">
                <h3 className="mb-3">답변 댓글 ({mockComments.length})</h3>

                {/* Comment List */}
                <div className="flex flex-column gap-3 mb-4">
                    {mockComments.map((comment) => (
                        <div key={comment.id} className="surface-100 p-3 border-round">
                            <div className="flex align-items-center justify-content-between mb-2">
                                <span className="font-semibold">{comment.author}</span>
                                <span className="text-xs text-color-secondary">{dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                            </div>
                            <p className="m-0">{comment.content}</p>
                        </div>
                    ))}
                </div>

                {/* New Comment Form */}
                <div className="flex flex-column gap-2">
                    <InputTextarea
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="댓글을 입력하세요..."
                        autoResize
                    />
                    <div className="flex justify-content-end">
                        <Button label="댓글 등록" icon="pi pi-check" disabled={!newComment} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackDetailPage;
