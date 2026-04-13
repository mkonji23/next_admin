'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/useToast';
import { useHttp } from '@/util/axiosInstance';
import useKakaoShare from '@/hooks/useKakaoShare';
import { useConfirm } from '@/hooks/useConfirm';

import { FilterMatchMode } from 'primereact/api';
import DetailView from '../components/DetailView';
import ListView from '../components/ListView';
import WriteView from '../components/WriteView';
import { ShareItem } from '../types';
import useAuthStore from '@/store/useAuthStore';
import { useRefreshStore } from '@/store/useRefreshStore';

const KakaoSharePage = ({ path }: { path?: string }) => {
    const { userInfo } = useAuthStore();
    const { refreshSignal, initRefresh } = useRefreshStore();
    const [isCopy, setIsCopy] = useState<boolean>(false);
    const [view, setView] = useState<'LIST' | 'DETAIL' | 'WRITE'>('LIST');
    const [shares, setShares] = useState<ShareItem[]>([]);
    const [selectedShare, setSelectedShare] = useState<ShareItem | null>(null);

    // List view state to be maintained
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        autoYear: { value: String(new Date().getFullYear()), matchMode: FilterMatchMode.EQUALS },
        autoMonth: { value: null, matchMode: FilterMatchMode.EQUALS },
        autoWeek: { value: null, matchMode: FilterMatchMode.EQUALS },
        shareStatus: { value: null, matchMode: FilterMatchMode.EQUALS }
    });
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [first, setFirst] = useState(0);
    const [listSelectedItems, setListSelectedItems] = useState<ShareItem[]>([]);

    const { showToast } = useToast();
    const { showConfirm } = useConfirm();
    const http = useHttp();
    const { sendDefault } = useKakaoShare();

    const fetchShares = async (first = 0) => {
        try {
            !first && setFirst(0);
            const res = await http.get('/choiMath/share/list');
            const data = (res.data || []).map((item: ShareItem) => ({
                ...item,
                shareStatus: (item.shareCount || 0) > 0 ? '공유완료' : '미공유'
            }));
            setShares(data);
        } catch (error) {
            console.error('Fetch error:', error);
            showToast({ severity: 'error', summary: '오류', detail: '목록을 불러오지 못했습니다.' });
        }
    };

    // 2. 상세 조회
    const fetchDetail = async (id: string) => {
        try {
            const res = await http.get(`/choiMath/share/detail/${id}`);
            const data = res.data || {};
            if (data._id) {
                data.shareStatus = (data.shareCount || 0) > 0 ? '공유완료' : '미공유';
            }
            setSelectedShare(data);
            setView('DETAIL');
        } catch (error) {
            console.error('Detail error:', error);
            showToast({ severity: 'error', summary: '오류', detail: '상세 정보를 불러오지 못했습니다.' });
            setView('LIST');
        }
    };

    // 3. 게시글 저장 (생성 및 수정)
    const handleSave = async (formData: any, files: File[]) => {
        try {
            let detailId = selectedShare?._id;
            if (selectedShare && selectedShare._id) {
                // [수정 모드]
                if (files.length > 0) {
                    // 1. 새 이미지가 포함된 경우: FormData 사용 (multipart/form-data)
                    const multipartData = new FormData();
                    multipartData.append('shareTitle', formData.shareTitle);
                    multipartData.append('shareContent', formData.shareContent || '');
                    multipartData.append('actualTitle', formData.actualTitle);
                    multipartData.append('actualContent', formData.actualContent || '');
                    if (formData.delta) multipartData.append('delta', JSON.stringify(formData.delta));

                    // 학생 정보 추가
                    multipartData.append('classId', formData.classId);
                    multipartData.append('studentId', formData.studentId);
                    multipartData.append('shareImageUrls', JSON.stringify(formData.shareImageUrls));
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
                        classId: formData.classId,
                        shareTitle: formData.shareTitle,
                        shareContent: formData.shareContent || '',
                        actualTitle: formData.actualTitle,
                        actualContent: formData.actualContent || '',
                        delta: formData.delta ? JSON.stringify(formData.delta) : null,
                        studentId: formData.studentId,
                        studentName: formData.studentName,
                        telNo: formData.telNo,
                        pTelNo: formData.pTelNo,
                        shareImageUrls: JSON.stringify(formData.shareImageUrls)
                    };

                    await http.post(`/choiMath/share/update/${selectedShare._id}`, updateData);
                }
                showToast({ severity: 'success', summary: '수정 완료', detail: '게시글이 성공적으로 수정되었습니다.' });
            } else {
                // [생성 모드]: 멀티파트 전송
                const multipartData = new FormData();
                multipartData.append('classId', formData.classId);
                multipartData.append('studentId', formData.studentId);
                multipartData.append('shareTitle', formData.shareTitle);
                multipartData.append('shareContent', formData.shareContent || '');
                multipartData.append('actualTitle', formData.actualTitle);
                multipartData.append('actualContent', formData.actualContent || '');
                multipartData.append('delta', JSON.stringify(formData.delta || null));

                // 학생 정보 추가
                if (formData.studentName) multipartData.append('studentName', formData.studentName);
                if (formData.telNo) multipartData.append('telNo', formData.telNo);
                if (formData.pTelNo) multipartData.append('pTelNo', formData.pTelNo);

                files.forEach((file) => {
                    multipartData.append('files', file);
                });

                const res = await http.post('/choiMath/share/create', multipartData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (res?.data?.insertedId) {
                    detailId = res?.data?.insertedId;
                }
                showToast({ severity: 'success', summary: '저장 완료', detail: '게시글이 성공적으로 등록되었습니다.' });
            }

            if (detailId) {
                // 상세 화면으로 이동
                const res = await http.get(`/choiMath/share/detail/${detailId}`);
                setSelectedShare(res.data);
                setView('DETAIL');
            } else {
                setView('LIST');
                setSelectedShare(null);
            }

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
            await http.post('/choiMath/share/delete', { ids });
            showToast({ severity: 'success', summary: '삭제 완료', detail: '선택한 게시글들이 삭제되었습니다.' });
            setListSelectedItems([]);
            fetchShares();
        } catch (error) {
            console.error('Multiple Delete error:', error);
            showToast({ severity: 'error', summary: '오류', detail: '일부 또는 전체 게시글 삭제에 실패했습니다.' });
        }
    };
    const generateSecureId = () => {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        const randomPart = array[0].toString(36);
        const ms = Date.now().toString(36);

        return `kakao_${ms}${randomPart}`;
    };

    const handleShare = (item: ShareItem) => {
        const firstImageUrl = item.shareImageUrls?.[0];
        const imageUrl = typeof firstImageUrl === 'string' ? firstImageUrl : firstImageUrl?.url;
        const baseUri =
            process.env.NEXT_PUBLIC_KAKAO_SHARED_URI || (typeof window !== 'undefined' ? window.location.origin : '');
        const kakaoId = generateSecureId();
        const shareLink = `${baseUri}/kakao-share/public-view/${item?.publicUrl}/?kakaoId=${kakaoId}&utm_custom=kakaoshare`;

        // // NOTE - 테스트용 코드
        // http.post('/choiMath/kakao/share/webhookTest', {
        //     menuType: 'kakao-share',
        //     id: item?._id,
        //     studentId: item?.studentId,
        //     studentName: item?.studentName,
        //     shareTitle: item?.shareTitle,
        //     shareContent: item?.shareTitle,
        //     userId: userInfo.userId,
        //     userName: userInfo.userName,
        //     shareLink: shareLink,
        //     kakaoId: kakaoId
        // });

        // 카카오공유하기
        sendDefault({
            title: item?.shareTitle || '',
            description: item?.shareContent || '',
            buttonText: '자세히 보기',
            linkUrl: shareLink,
            serverCallbackArgs: {
                menuType: 'kakao-share',
                id: item?._id,
                studentId: item?.studentId,
                studentName: item?.studentName,
                shareTitle: item?.shareTitle,
                shareContent: item?.shareTitle,
                userId: userInfo.userId,
                userName: userInfo.userName,
                shareLink: shareLink,
                kakaoId: kakaoId
            }
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
        setIsCopy(false);
        setView('WRITE');
    };

    const handleTemplateNew = (template: any) => {
        const newItemData: Partial<ShareItem> = {
            ...template,
            classId: '',
            studentId: '',
            studentName: '',
            actualContent: '',
            shareImageUrls: []
        };
        setSelectedShare(newItemData as ShareItem);
        setIsCopy(false);
        setView('WRITE');
    };

    const handleCopyToNew = (item: ShareItem) => {
        const { _id, createdDate, updatedDate, shareImageUrls, ...rest } = item;

        const newItemData: Partial<ShareItem> = {
            ...rest,
            classId: '',
            studentId: '',
            studentName: '',
            actualTitle: `${item.actualTitle}`,
            shareTitle: `${item.shareTitle}`
        };

        setSelectedShare(newItemData as ShareItem);
        setIsCopy(true);
        setView('WRITE');
    };

    useEffect(() => {
        if (view !== 'WRITE') setIsCopy(false);
    }, [view]);

    // 초기화 및 경로 감지
    useEffect(() => {
        if (path && path.startsWith('/kakao-share/')) {
            const id = path.split('/')[2];
            if (id) {
                fetchDetail(id);
            } else {
                fetchShares();
                setView('LIST');
            }
        } else {
            fetchShares();
            setView('LIST');
        }
    }, [path]);

    useEffect(() => {
        if (refreshSignal && view === 'LIST') fetchShares();
        if (refreshSignal && selectedShare?._id && view === 'DETAIL') fetchDetail(selectedShare._id);
    }, [refreshSignal]);

    useEffect(() => {
        // 컴포넌트 언마운트(화면 빠져나갈 때) 시 리프레시 신호 초기화
        return () => {
            console.log('initRefresh');
            initRefresh();
        };
    }, []);

    return (
        <div className="kakao-share-page">
            {view === 'LIST' && (
                <ListView
                    shares={shares}
                    onSearch={fetchShares}
                    onRowSelect={(id) => fetchDetail(id)}
                    onNewPost={handleNewPost}
                    onTemplateApply={handleTemplateNew}
                    onShare={handleShare}
                    onDelete={handleDelete}
                    onDeleteMultiple={handleDeleteMultiple}
                    onCopyToNew={handleCopyToNew}
                    filters={filters}
                    setFilters={setFilters}
                    globalFilterValue={globalFilterValue}
                    setGlobalFilterValue={setGlobalFilterValue}
                    first={first}
                    setFirst={setFirst}
                    selectedItems={listSelectedItems}
                    setSelectedItems={setListSelectedItems}
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
            {view === 'WRITE' && (
                <WriteView isCopy={isCopy} onBack={handleBack} onSave={handleSave} initialData={selectedShare!} />
            )}
        </div>
    );
};

export default KakaoSharePage;
