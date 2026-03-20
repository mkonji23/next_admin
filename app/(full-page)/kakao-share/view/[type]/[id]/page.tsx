'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useHttp } from '@/util/axiosInstance';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import withPasswordProtection from '@/components/hoc/withPasswordProtection';
import { ShareItem } from '@/app/(main)/kakao-share/types';
import { useLoading } from '@/layout/context/loadingcontext';
import KakaoShareViewContent from '@/components/kakaoShare/KakaoShareViewContent'; // Import the new component

const ShareViewPage: React.FC = () => {
    const params = useParams();
    const id = params.id as string;
    const type = params.type as string; // 'student' | 'parent'

    const http = useHttp();
    const [shareData, setShareData] = useState<ShareItem | null>(null);
    const { loading } = useLoading();
    const [images, setImages] = useState<any[]>([]);

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

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await http.get(`/choiMath/share/detail/${id}`);
                const data = res.data;
                setShareData(data);

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

    // Render the shared content component
    return (
        <KakaoShareViewContent
            shareData={shareData}
            images={images}
            downloadImageFn={downloadImage}
            pageType={type} // Pass the type for the tag
        />
    );
};

// Apply the HOC
export default withPasswordProtection(ShareViewPage);
