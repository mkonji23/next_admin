'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { useHttp } from '@/util/axiosInstance';
import useKakaoShare from '@/hooks/useKakaoShare';
import { useConfirm } from '@/hooks/useConfirm';

import { ShareItem } from './types';
import ListView from './components/ListView';
import DetailView from './components/DetailView';
import WriteView from './components/WriteView';

const KakaoSharePage = () => {
    const [view, setView] = useState<'LIST' | 'DETAIL' | 'WRITE'>('LIST');
    const [shares, setShares] = useState<ShareItem[]>([]);
    const [selectedShare, setSelectedShare] = useState<ShareItem | null>(null);

    const { showToast } = useToast();
    const { showConfirm } = useConfirm();
    const http = useHttp();
    const { shareDefault } = useKakaoShare();

    const fetchShares = async () => {
        try {
            const res = await http.get('/choiMath/share/list');
            setShares(res.data || []);
        } catch (error) {
            console.error('Fetch error:', error);
            showToast({ severity: 'error', summary: '오류', detail: '목록을 불러오지 못했습니다.' });
        }
    };

    // 초기화
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
            showToast({ severity: 'error', summary: '오류', detail: '상세 정보를 불러오지 못했습니다.' });
        }
    };

    // 3. 게시글 저장 (생성 및 수정)
    const handleSave = async (formData: any, files: File[]) => {
        try {
            if (selectedShare && selectedShare._id) {
                // [수정 모드]
                if (files.length > 0) {
                    // 1. 새 이미지가 포함된 경우: FormData 사용 (multipart/form-data)
                    const multipartData = new FormData();
                    multipartData.append('shareTitle', formData.shareTitle);
                    multipartData.append('shareContent', formData.shareContent);
                    multipartData.append('actualTitle', formData.actualTitle);
                    multipartData.append('actualContent', formData.actualContent);

                    // 학생 정보 추가
                    if (formData.studentId) multipartData.append('studentId', formData.studentId);
                    if (formData.studentName) multipartData.append('studentName', formData.studentName);
                    if (formData.telNo) multipartData.append('telNo', formData.telNo);
                    if (formData.pTelNo) multipartData.append('pTelNo', formData.pTelNo);

                    files.forEach((file) => {
                        multipartData.append('files', file);
                    });

                    await http.post(`/choiMath/share/update/${selectedShare._id}`, multipartData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                } else {
                    // 2. 이미지가 없는 경우: 일반 JSON 사용 (req.body로 전송)
                    const updateData = {
                        shareTitle: formData.shareTitle,
                        shareContent: formData.shareContent,
                        actualTitle: formData.actualTitle,
                        actualContent: formData.actualContent,
                        studentId: formData.studentId,
                        studentName: formData.studentName,
                        telNo: formData.telNo,
                        pTelNo: formData.pTelNo
                    };

                    await http.post(`/choiMath/share/update/${selectedShare._id}`, updateData);
                }
                showToast({ severity: 'success', summary: '수정 완료', detail: '게시글이 성공적으로 수정되었습니다.' });
            } else {
                // [생성 모드]: 멀티파트 전송
                const multipartData = new FormData();
                multipartData.append('shareTitle', formData.shareTitle);
                multipartData.append('shareContent', formData.shareContent);
                multipartData.append('actualTitle', formData.actualTitle);
                multipartData.append('actualContent', formData.actualContent);

                // 학생 정보 추가
                if (formData.studentId) multipartData.append('studentId', formData.studentId);
                if (formData.studentName) multipartData.append('studentName', formData.studentName);
                if (formData.telNo) multipartData.append('telNo', formData.telNo);
                if (formData.pTelNo) multipartData.append('pTelNo', formData.pTelNo);

                files.forEach((file) => {
                    multipartData.append('files', file);
                });

                await http.post('/choiMath/share/create', multipartData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showToast({ severity: 'success', summary: '저장 완료', detail: '게시글이 성공적으로 등록되었습니다.' });
            }

            setView('LIST');
            setSelectedShare(null);
            fetchShares();
        } catch (error) {
            console.error('Save error:', error);
            showToast({ severity: 'error', summary: '오류', detail: '저장에 실패했습니다.' });
        }
    };

    // 4. 게시글 삭제
    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm({
            header: '삭제 확인',
            message: '정말로 이 게시글을 삭제하시겠습니까? 이미지도 함께 삭제됩니다.',
            icon: 'pi pi-exclamation-triangle'
        });

        if (!confirmed) return;

        try {
            // 다건 삭제 API 사용 (POST /choiMath/share/delete)
            await http.post('/choiMath/share/delete', { ids: [id] });
            showToast({ severity: 'success', summary: '삭제 완료', detail: '게시글이 삭제되었습니다.' });
            setView('LIST');
            setSelectedShare(null);
            fetchShares();
        } catch (error) {
            console.error('Delete error:', error);
            showToast({ severity: 'error', summary: '오류', detail: '삭제에 실패했습니다.' });
        }
    };

    // 5. 다중 삭제
    const handleDeleteMultiple = async (selectedItems: ShareItem[]) => {
        const confirmed = await showConfirm({
            header: '다중 삭제 확인',
            message: `선택한 ${selectedItems.length}개의 게시글을 모두 삭제하시겠습니까? 이미지도 함께 삭제됩니다.`,
            icon: 'pi pi-exclamation-triangle'
        });

        if (!confirmed) return;

        try {
            const ids = selectedItems.map((item) => item._id);
            // 다건 삭제 API 사용 (POST /choiMath/share/delete)
            await http.post('/choiMath/share/delete', { ids });
            showToast({ severity: 'success', summary: '삭제 완료', detail: '선택한 게시글들이 삭제되었습니다.' });
            fetchShares();
        } catch (error) {
            console.error('Multiple Delete error:', error);
            showToast({ severity: 'error', summary: '오류', detail: '일부 또는 전체 게시글 삭제에 실패했습니다.' });
        }
    };

    const handleShare = (item: ShareItem) => {
        const firstImageUrl = item.shareImageUrls?.[0];
        const imageUrl = typeof firstImageUrl === 'string' ? firstImageUrl : firstImageUrl?.url;
        // 도메인 주소 결정 (환경변수 우선, 없으면 현재 호스트 사용)
        const baseUri =
            process.env.NEXT_PUBLIC_KAKAO_SHARED_URI || (typeof window !== 'undefined' ? window.location.origin : '');

        const shareLink = `${baseUri}/kakao-share/public-view/${item?.publicUrl}`;

        shareDefault({
            title: item?.shareTitle,
            description: item?.shareContent,
            // imageUrl: imageUrl,
            buttonText: '자세히 보기',
            linkUrl: shareLink
        });
    };

    const handleEdit = (item: ShareItem) => {
        setSelectedShare(item);
        setView('WRITE');
    };

    const handleBack = () => {
        setView('LIST');
        setSelectedShare(null);
    };

    const handleNewPost = () => {
        setSelectedShare(null);
        setView('WRITE');
    };

    const handleCopyToNew = (item: ShareItem) => {
        const { _id, createdDate, updatedDate, shareImageUrls, ...rest } = item;

        const newItemData: Partial<ShareItem> = {
            ...rest,
            actualTitle: `${item.actualTitle}`,
            shareTitle: `${item.shareTitle}`
            // studentId, studentName, telNo, pTelNo are kept as they are part of 'rest'
            // If they should be reset, they need to be explicitly set to undefined here.
            // For now, assuming they should be copied.
        };

        setSelectedShare(newItemData as ShareItem);
        setView('WRITE');
    };

    return (
        <div className="kakao-share-page">
            {view === 'LIST' && (
                <ListView
                    shares={shares}
                    onSearch={fetchShares}
                    onRowSelect={fetchDetail}
                    onNewPost={handleNewPost}
                    onShare={handleShare}
                    onDelete={handleDelete}
                    onDeleteMultiple={handleDeleteMultiple}
                    onCopyToNew={handleCopyToNew}
                />
            )}
            {view === 'DETAIL' && (
                <DetailView
                    selectedShare={selectedShare}
                    onBack={handleBack}
                    onShare={handleShare}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onCopyToNew={handleCopyToNew}
                />
            )}
            {view === 'WRITE' && <WriteView onBack={handleBack} onSave={handleSave} initialData={selectedShare} />}
        </div>
    );
};

export default KakaoSharePage;
