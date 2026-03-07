'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { useHttp } from '@/util/axiosInstance';
import useKakaoShare from '@/hooks/useKakaoShare';

import { ShareItem } from './types';
import ListView from './components/ListView';
import DetailView from './components/DetailView';
import WriteView from './components/WriteView';

const KakaoSharePage = () => {
    const [view, setView] = useState<'LIST' | 'DETAIL' | 'WRITE'>('LIST');
    const [shares, setShares] = useState<ShareItem[]>([]);
    const [selectedShare, setSelectedShare] = useState<ShareItem | null>(null);
    
    const { showToast } = useToast();
    const http = useHttp();
    const { shareDefault } = useKakaoShare();

    // 1. 목록 조회 (일반 함수로 변경)
    const fetchShares = async () => {
        try {
            const res = await http.get('/choiMath/share/list');
            setShares(res.data || []);
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    // 초기화 시 빈 배열 사용
    useEffect(() => {
        fetchShares();
    }, []);

    // 2. 상세 조회
    const fetchDetail = async (id: string) => {
        try {
            const res = await http.get(`/choiMath/share/detail/${id}`);
            setSelectedShare(res.data);
            setView('DETAIL');
        } catch (error) {
            console.error('Detail error:', error);
        }
    };

    // 3. 게시글 저장
    const handleSave = async (formData: any, files: File[]) => {
        const multipartData = new FormData();
        multipartData.append('shareTitle', formData.shareTitle);
        multipartData.append('shareContent', formData.shareContent);
        multipartData.append('actualTitle', formData.actualTitle);
        multipartData.append('actualContent', formData.actualContent);
        
        files.forEach((file) => {
            multipartData.append('files', file);
        });

        try {
            await http.post('/choiMath/share/create', multipartData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast({ severity: 'success', summary: '저장 완료', detail: '게시글이 성공적으로 등록되었습니다.' });
            setView('LIST');
            fetchShares();
        } catch (error) {
            console.error('Save error:', error);
        }
    };

    const handleShare = (item: ShareItem) => {
        shareDefault({
            title: item.shareTitle,
            description: item.shareContent,
            imageUrl: item.shareImageUrls?.[0] || '',
            buttonText: '자세히 보기',
            linkUrl: `${window.location.origin}/kakao-share/view/${item.id}`
        });
    };

    return (
        <div className="kakao-share-page">
            {view === 'LIST' && (
                <ListView 
                    shares={shares} 
                    onRowSelect={fetchDetail} 
                    onNewPost={() => setView('WRITE')} 
                    onShare={handleShare} 
                />
            )}
            {view === 'DETAIL' && (
                <DetailView 
                    selectedShare={selectedShare} 
                    onBack={() => setView('LIST')} 
                    onShare={handleShare} 
                />
            )}
            {view === 'WRITE' && (
                <WriteView 
                    onBack={() => setView('LIST')} 
                    onSave={handleSave} 
                />
            )}
        </div>
    );
};

export default KakaoSharePage;
