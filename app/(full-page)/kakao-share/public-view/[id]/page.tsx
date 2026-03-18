'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useHttp } from '@/util/axiosInstance';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import dayjs from 'dayjs';
import { ShareItem } from '@/app/(main)/kakao-share/types';
import { useLoading } from '@/layout/context/loadingcontext';
import { Image } from 'primereact/image';

// 공개 공유용 페이지
const PublicShareViewPage = () => {
    const params = useParams();
    const id = params.id as string;

    const http = useHttp();
    const [shareData, setShareData] = useState<ShareItem | null>(null);
    const { loading } = useLoading();
    const [images, setImages] = useState<any[]>([]);
    const [isFetched, setIsFetched] = useState(false);

    const downloadImage = async (url: string, index: number) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `share-image-${index + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download error:', error);
            window.open(url, '_blank');
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return dayjs(dateStr).format('YYYY-MM-DD HH:mm');
    };

    const loadingTemplate = (
        <div className="flex align-items-center justify-content-center min-h-screen">
            <ProgressSpinner />
        </div>
    );

    const noDataTempate = (
        <div className="flex align-items-center justify-content-center min-h-screen p-3">
            <Card title="데이터를 찾을 수 없습니다.">
                <p>만료된 링크이거나 잘못된 접근입니다.</p>
            </Card>
        </div>
    );

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await http.get(`/choiMath/share/detail/${id}`);
                const data = res.data;
                setShareData(data);
                setIsFetched(true);

                if (data.shareImageUrls && data.shareImageUrls.length > 0) {
                    const formattedImages = data.shareImageUrls.map((item: any) => {
                        const url = typeof item === 'string' ? item : item.url;
                        return {
                            itemImageSrc: url,
                            thumbnailImageSrc: url,
                            alt: '첨부 이미지'
                        };
                    });
                    setImages(formattedImages);
                }
            } catch (error) {
                console.error('Fetch detail error:', error);
            }
        };

        if (id) {
            fetchDetail();
        }
    }, [id]);

    return (
        <>
            {loading && loadingTemplate}

            {!loading && shareData && (
                <div className="layout-content p-3 md:p-5 flex justify-content-center min-h-screen bg-gray-50">
                    <div className="w-full" style={{ maxWidth: '800px' }}>
                        <Card title={shareData?.actualTitle} className="shadow-4 mb-4">
                            <div className="flex justify-content-between align-items-center mb-4 text-sm text-gray-500">
                                <div className="flex align-items-center gap-2">
                                    <span>등록일: {formatDate(shareData?.createdDate)}</span>
                                </div>
                                {shareData?.studentName && (
                                    <span>
                                        공유 대상: <span className="text-900 font-bold">{shareData.studentName}</span>
                                    </span>
                                )}
                            </div>

                            <div className="mb-6">
                                <InputTextarea
                                    value={shareData?.actualContent}
                                    rows={10}
                                    readOnly
                                    autoResize
                                    className="w-full border-none surface-50 p-3 line-height-3 text-700 font-sans"
                                    style={{ resize: 'none', background: 'transparent' }}
                                />
                            </div>

                            {images && images.length > 0 && (
                                <div className="flex flex-column gap-3">
                                    <h6 className="font-bold border-bottom-1 surface-border pb-2 mb-3">
                                        첨부 이미지 (클릭 시 확대)
                                    </h6>

                                    <div className="grid">
                                        {images.map((img, idx) => {
                                            return (
                                                <div key={idx} className="col-12 sm:col-6 lg:col-4 mb-3">
                                                    <div className="relative border-round overflow-hidden shadow-2 surface-card h-full">
                                                        <div className="flex align-items-center justify-content-center cursor-pointer hover:shadow-4 transition-duration-200">
                                                            <Image
                                                                src={img.thumbnailImageSrc}
                                                                alt={`share-img-${idx}`}
                                                                width="100%"
                                                                preview
                                                            />
                                                        </div>
                                                        <Button
                                                            icon="pi pi-download"
                                                            className="p-button-rounded p-button-secondary p-button-text p-button-sm absolute top-0 left-0 m-2"
                                                            style={{
                                                                background: 'rgba(255,255,255,0.7)',
                                                                color: '#333',
                                                                width: '1.75rem',
                                                                height: '1.75rem'
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                downloadImage(img.itemImageSrc, idx);
                                                            }}
                                                            tooltip="다운로드"
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
                                style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                                className="shadow-2"
                            />
                            <div className="text-gray-400 text-xs">
                                &copy; {new Date().getFullYear()} chochoMath. All rights reserved.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!loading && isFetched && !shareData && noDataTempate}
        </>
    );
};

export default PublicShareViewPage;
