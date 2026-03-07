'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useHttp } from '@/util/axiosInstance';
import { Card } from 'primereact/card';
import { Image } from 'primereact/image';
import { ProgressSpinner } from 'primereact/progressspinner';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import dayjs from 'dayjs';
import withPasswordProtection from '@/components/hoc/withPasswordProtection';
import { ShareItem } from '@/app/(main)/kakao-share/types';

// 공유용 페이지 (학생/학부모 공용)
const ShareViewPage = () => {
    const params = useParams();
    const id = params.id as string;
    const type = params.type as string; // 'student' | 'parent'
    
    const http = useHttp();
    const [shareData, setShareData] = useState<ShareItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await http.get(`/choiMath/share/detail/${id}`);
                setShareData(res.data);
            } catch (error) {
                console.error('Fetch detail error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDetail();
        }
    }, [id]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return dayjs(dateStr).format('YYYY-MM-DD HH:mm');
    };

    if (loading) {
        return (
            <div className="flex align-items-center justify-content-center min-h-screen">
                <ProgressSpinner />
            </div>
        );
    }

    if (!shareData) {
        return (
            <div className="flex align-items-center justify-content-center min-h-screen p-3">
                <Card title="데이터를 찾을 수 없습니다.">
                    <p>만료된 링크이거나 잘못된 접근입니다.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="layout-content p-3 md:p-5 flex justify-content-center min-h-screen bg-gray-50">
            <div className="w-full" style={{ maxWidth: '800px' }}>
                <Card title={shareData.actualTitle} className="shadow-4 mb-4">
                    <div className="flex justify-content-between align-items-center mb-4 text-sm text-gray-500">
                        <div className="flex align-items-center gap-2">
                            <Tag value={type === 'parent' ? '학부모용' : '학생용'} severity={type === 'parent' ? 'success' : 'info'} />
                            <span>등록일: {formatDate(shareData.createdDate)}</span>
                        </div>
                        {shareData.studentName && (
                            <span>공유 대상: <span className="text-900 font-bold">{shareData.studentName}</span></span>
                        )}
                    </div>
                    
                    <div className="mb-6">
                        <InputTextarea 
                            value={shareData.actualContent} 
                            rows={10} 
                            readOnly 
                            autoResize 
                            className="w-full border-none surface-50 p-3 line-height-3 text-700 font-sans" 
                            style={{ resize: 'none', background: 'transparent' }}
                        />
                    </div>

                    {shareData.shareImageUrls && shareData.shareImageUrls.length > 0 && (
                        <div className="flex flex-column gap-3">
                            <h6 className="font-bold border-bottom-1 surface-border pb-2 mb-3">첨부 이미지</h6>
                            <div className="grid">
                                {shareData.shareImageUrls.map((item, idx) => {
                                    const url = typeof item === 'string' ? item : item.url;
                                    return (
                                        <div key={idx} className="col-12 sm:col-6 lg:col-4 mb-3">
                                            <div className="border-round overflow-hidden shadow-2 surface-card h-full flex align-items-center justify-content-center">
                                                <Image
                                                    src={url}
                                                    alt={`share-img-${idx}`}
                                                    width="100%"
                                                    preview
                                                    className="block"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Card>

                <div className="text-center py-4 flex flex-column align-items-center gap-2">
                    <img 
                        src="/layout/images/bae.jpg" 
                        alt="Footer Logo" 
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                        className="shadow-2"
                    />
                    <div className="text-gray-400 text-xs">
                        &copy; {new Date().getFullYear()} ChoiMath. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
};

// 비밀번호 보호 HOC 적용
export default withPasswordProtection(ShareViewPage);
