'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useHttp } from '@/util/axiosInstance';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ShareItem } from '@/app/(main)/kakao-share/types';
import { useLoading } from '@/layout/context/loadingcontext';
import KakaoShareViewContent from '@/components/kakaoShare/KakaoShareViewContent'; // Import the new component

const PublicShareViewPage: React.FC = () => {
    const params = useParams();
    const searchParams = useSearchParams();
    const publicUrl = params.id as string;
    const kakaoId = searchParams.get('kakaoId');
    const utm_custom = searchParams.get('utm_custom');
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

    // Templates defined directly in the component
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
                const res = await http.get(`/choiMath/share/detail/${publicUrl}`);
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
                setIsFetched(true); // Mark as fetched even on error
            }
        };

        if (publicUrl) {
            fetchDetail();
        } else {
            setIsFetched(true); // If no ID, it's 'fetched' in the sense that we can't fetch anything
        }
    }, [publicUrl]);

    // 공유열람 여부체크
    useEffect(() => {
        if (utm_custom && publicUrl && kakaoId) {
            http.post(`/choiMath/kakao/share/open/${publicUrl}/${kakaoId}`, { disableLoading: true });
        } else if (!utm_custom && publicUrl && !kakaoId) {
            http.post(`/choiMath/share/mark-read/${publicUrl}`, { disableLoading: true });
        }
    }, [utm_custom, publicUrl, kakaoId]);

    if (loading) {
        return loadingTemplate;
    }

    if (!shareData && isFetched) {
        // Render noDataTemplate only after fetching attempt
        return noDataTempate;
    }

    // Render the shared content component
    if (shareData) {
        return <KakaoShareViewContent shareData={shareData} images={images} downloadImageFn={downloadImage} />;
    }

    return null; // Should not reach here if logic is correct, but good for safety
};

export default PublicShareViewPage;
