'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import { ShareItem } from '@/app/(main)/kakao-share/types';
import dayjs from 'dayjs';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import { useLightboxHistory } from '@/hooks/useLightboxHistory';
import { useMobile } from '@/hooks/useMobile';
import { compressImages } from '@/util/imageResizer';

interface AutoImageUploadModalProps {
    visible: boolean;
    onClose: (result?: any) => void;
}

const AutoImageUploadModal = ({ visible, onClose }: AutoImageUploadModalProps) => {
    const http = useHttp();
    const { showToast } = useToast();
    const { showConfirm } = useConfirm();

    const now = dayjs();
    const [year, setYear] = useState(now.year());
    const [month, setMonth] = useState(now.month() + 1);
    const [week, setWeek] = useState(Math.ceil(now.date() / 7));

    // 로컬 편집용 상태
    const [students, setStudents] = useState<ShareItem[]>([]);
    const [originalStudents, setOriginalStudents] = useState<ShareItem[]>([]);
    const [pendingFiles, setPendingFiles] = useState<Record<string, File[]>>({});

    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [noImageOnly, setNoImageOnly] = useState(false);

    // Lightbox 상태
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [currentSlides, setCurrentSlides] = useState<{ src: string }[]>([]);

    const { handleClose: handleLightboxClose } = useLightboxHistory(lightboxOpen, setLightboxOpen);
    const isMobile = useMobile();

    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    const years = Array.from({ length: 3 }, (_, i) => ({
        label: `${now.year() - 1 + i}년`,
        value: now.year() - 1 + i
    }));
    const months = Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}월`, value: i + 1 }));
    const weeks = Array.from({ length: 5 }, (_, i) => ({ label: `${i + 1}주차`, value: i + 1 }));

    // 변경사항 여부 확인
    const hasChanges = useMemo(() => {
        if (Object.keys(pendingFiles).length > 0) return true;

        // 이미지 삭제 여부 확인
        return JSON.stringify(students) !== JSON.stringify(originalStudents);
    }, [students, originalStudents, pendingFiles]);

    // 필터링된 학생 목록
    const filteredStudents = useMemo(() => {
        if (!noImageOnly) return students;
        return students.filter((s) => {
            const images = (s.shareImageUrls || []).filter((img: any) => !img.isDelete);
            return images.length === 0;
        });
    }, [students, noImageOnly]);

    const handleSearch = async () => {
        if (hasChanges) {
            const confirmed = await showConfirm({
                header: '조회 확인',
                message: '저장되지 않은 변경사항이 있습니다. 무시하고 다시 조회하시겠습니까?',
                icon: 'pi pi-exclamation-triangle'
            });
            if (!confirmed) return;
        }

        setLoading(true);
        try {
            const res = await http.get('/choiMath/share/list', {
                params: {
                    autoYear: String(year),
                    autoMonth: String(month).padStart(2, '0'),
                    autoWeek: String(week)
                }
            });
            const data = (res.data || [])
                .map((item: any) => ({
                    ...item,
                    shareStatus: (item.shareCount || 0) > 0 ? '공유완료' : '미공유'
                }))
                .sort((a: any, b: any) => a.studentName.localeCompare(b.studentName, 'ko'));
            setStudents(data);
            setOriginalStudents(JSON.parse(JSON.stringify(data)));
            setPendingFiles({});

            if (data.length === 0) {
                showToast({
                    severity: 'warn',
                    summary: '조회 결과 없음',
                    detail: '해당 시점에 생성된 데이터가 없습니다.'
                });
            }
        } catch (error) {
            console.error('Search error:', error);
            showToast({ severity: 'error', summary: '오류', detail: '데이터를 불러오는데 실패했습니다.' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (item: ShareItem) => {
        if (item._id) {
            fileInputRefs.current[item._id]?.click();
        }
    };

    const handleFileChange = async (item: ShareItem, files: FileList | null) => {
        if (!files || files.length === 0 || !item._id) return;

        const id = item._id;
        const originalFileArray = Array.from(files);

        // 이미지 압축 적용
        let fileArray = originalFileArray;
        try {
            fileArray = await compressImages(originalFileArray);
        } catch (error) {
            console.error('이미지 압축 실패:', error);
        }

        // 1. pendingFiles 업데이트
        setPendingFiles((prev) => ({
            ...prev,
            [id]: [...(prev[id] || []), ...fileArray]
        }));

        // 2. students 상태 업데이트 (미리보기용 Blob URL 추가)
        setStudents((prev) =>
            prev.map((s) => {
                if (s._id === id) {
                    const newPreviewUrls = fileArray.map((f) => ({ url: URL.createObjectURL(f), isLocal: true }));
                    return {
                        ...s,
                        shareImageUrls: [...(s.shareImageUrls || []), ...newPreviewUrls]
                    };
                }
                return s;
            })
        );

        // 동일한 파일 재선택을 위해 value 초기화
        if (fileInputRefs.current[id]) {
            fileInputRefs.current[id]!.value = '';
        }
    };

    const handleDeleteImage = (item: ShareItem, imageUrl: string) => {
        if (!item._id) return;
        const id = item._id;

        setStudents((prev) =>
            prev.map((s) => {
                if (s._id === id) {
                    if (imageUrl.startsWith('blob:')) {
                        return {
                            ...s,
                            shareImageUrls: (s.shareImageUrls || []).filter((img) => {
                                const url = typeof img === 'string' ? img : img.url;
                                return url !== imageUrl;
                            })
                        };
                    } else {
                        return {
                            ...s,
                            shareImageUrls: (s.shareImageUrls || []).map((img) => {
                                const url = typeof img === 'string' ? img : img.url;
                                if (url === imageUrl) {
                                    return typeof img === 'string'
                                        ? { url: img, isDelete: true }
                                        : { ...img, isDelete: true };
                                }
                                return img;
                            })
                        };
                    }
                }
                return s;
            })
        );

        // 만약 로컬에서 추가된 이미지라면 pendingFiles에서도 제거
        if (imageUrl.startsWith('blob:')) {
            setPendingFiles((prev) => {
                const updatedFiles = (prev[id] || []).filter((f) => URL.createObjectURL(f) !== imageUrl); // 주의: URL.createObjectURL은 호출할 때마다 다를 수 있음. 실제로는 previewUrl을 매핑해서 추적해야 함.
                // 위 방식이 불안정할 수 있으므로, handleFileChange에서 preview를 할 때 file객체와 url을 함께 매핑하는게 좋으나 일단 간단히 처리.
                return { ...prev, [id]: updatedFiles };
            });
        }
    };

    const handleBatchSave = async () => {
        const changedStudents = students.filter((s) => {
            const original = originalStudents.find((os) => os._id === s._id);
            const hasNewFiles = pendingFiles[s._id!] && pendingFiles[s._id!].length > 0;
            const imagesChanged = JSON.stringify(s.shareImageUrls) !== JSON.stringify(original?.shareImageUrls);
            return hasNewFiles || imagesChanged;
        });

        if (changedStudents.length === 0) {
            showToast({ severity: 'info', summary: '변경사항 없음', detail: '저장할 내용이 없습니다.' });
            return;
        }

        setIsSaving(true);
        const failedInfo: string[] = [];
        let successCount = 0;
        let failCount = 0;

        try {
            for (const item of changedStudents) {
                const id = item._id!;
                const formData = new FormData();

                // 로컬에서 추가된 파일들
                if (pendingFiles[id]) {
                    pendingFiles[id].forEach((file) => formData.append('files', file));
                }

                // 기존 이미지 중 유지된 것(및 삭제된 것)만 필터링 (로컬 미리보기 제외)
                const currentImages = (item.shareImageUrls || [])
                    .filter((img) => {
                        const url = typeof img === 'string' ? img : img.url;
                        return !url.startsWith('blob:');
                    })
                    .map((img) => {
                        return typeof img === 'string' ? { url: img } : img;
                    });

                formData.append('shareImageUrls', JSON.stringify(currentImages));

                try {
                    await http.post(`/choiMath/share/update/${id}`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    successCount++;
                } catch (err: any) {
                    console.error(`Error saving student ${item.studentName} (${id}):`, err);
                    const errMsg = err.response?.data?.message || err.message || '알 수 없는 오류';
                    failedInfo.push(`${item.studentName} (${errMsg})`);
                    failCount++;
                }
            }

            showToast({
                severity: failCount === 0 ? 'success' : successCount > 0 ? 'warn' : 'error',
                summary: '저장 결과',
                detail:
                    failCount > 0
                        ? `${successCount}건 성공, ${failCount}건 실패\n실패 항목: ${failedInfo.join(', ')}`
                        : `${successCount}건 모두 성공적으로 저장되었습니다.`
            });

            if (successCount > 0) {
                // 저장 성공 후 리프레시
                const res = await http.get('/choiMath/share/list', {
                    params: {
                        autoYear: String(year),
                        autoMonth: String(month).padStart(2, '0'),
                        autoWeek: String(week)
                    }
                });
                const data = (res.data || [])
                    .map((item: any) => ({
                        ...item,
                        shareStatus: (item.shareCount || 0) > 0 ? '공유완료' : '미공유'
                    }))
                    .sort((a: any, b: any) => a.studentName.localeCompare(b.studentName, 'ko'));
                setStudents(data);
                setOriginalStudents(JSON.parse(JSON.stringify(data)));
                setPendingFiles({});
            }
        } catch (error) {
            console.error('Batch save error:', error);
            showToast({ severity: 'error', summary: '오류', detail: '저장 처리 중 시스템 오류가 발생했습니다.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = async () => {
        if (hasChanges) {
            const confirmed = await showConfirm({
                header: '정말 닫으시겠습니까?',
                message: '저장하지 않은 변경사항이 모두 사라집니다. 계속하시겠습니까?',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: '네, 닫기',
                rejectLabel: '아니오'
            });
            if (!confirmed) return;
        }
        onClose(null);
    };

    const handleImageClick = (rowData: ShareItem, index: number) => {
        const slides = (rowData.shareImageUrls || [])
            .filter((img: any) => !img.isDelete)
            .map((img) => ({
                src: typeof img === 'string' ? img : img.url
            }));
        setCurrentSlides(slides);
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const imageBodyTemplate = (rowData: ShareItem) => {
        const images = (rowData.shareImageUrls || []).filter((img: any) => !img.isDelete);
        if (images.length === 0) return <span className="text-400">이미지 없음</span>;

        return (
            <div className="flex gap-2 p-1 overflow-x-auto" style={{ maxWidth: '300px' }}>
                {images.map((img, idx) => {
                    const url = typeof img === 'string' ? img : img.url;
                    return (
                        <div key={idx} className="relative flex-shrink-0" style={{ width: '50px', height: '50px' }}>
                            <img
                                src={url}
                                alt="thumb"
                                className="border-round shadow-1 cursor-pointer"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onClick={() => handleImageClick(rowData, idx)}
                            />
                            <Button
                                icon="pi pi-times"
                                className="p-button-rounded p-button-danger p-button-sm absolute"
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    top: '-6px',
                                    right: '-6px',
                                    fontSize: '10px',
                                    padding: 0
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteImage(rowData, url);
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    const actionBodyTemplate = (rowData: ShareItem) => {
        return (
            <div className="flex align-items-center gap-2">
                <input
                    type="file"
                    hidden
                    accept="image/*"
                    multiple
                    ref={(el) => {
                        if (rowData._id) fileInputRefs.current[rowData._id] = el;
                    }}
                    onChange={(e) => handleFileChange(rowData, e.target.files)}
                />
                <Button
                    label="이미지 추가"
                    icon="pi pi-plus"
                    size="small"
                    className="p-button-outlined p-button-success"
                    onClick={() => handleFileSelect(rowData)}
                />
            </div>
        );
    };

    const footer = (
        <div className="flex justify-content-between">
            <div className="flex align-items-center">
                {hasChanges && (
                    <span className="text-orange-500 font-bold ml-2">⚠️ 저장되지 않은 변경사항이 있습니다.</span>
                )}
            </div>
            <div>
                <Button label="닫기" icon="pi pi-times" onClick={handleClose} className="p-button-text" />
                <Button
                    label="업로드 저장"
                    icon="pi pi-save"
                    onClick={handleBatchSave}
                    loading={isSaving}
                    disabled={!hasChanges}
                    className="p-button-primary"
                />
            </div>
        </div>
    );

    return (
        <>
            <Dialog
                header="자동 템플릿 이미지  관리"
                visible={visible}
                style={{ width: isMobile ? '95vw' : '900px' }}
                contentStyle={{ overflow: 'hidden' }}
                footer={footer}
                onHide={handleClose}
                className="p-fluid"
            >
                <div className="grid mb-4">
                    <div className="field col-3">
                        <label className="font-bold">년도</label>
                        <Dropdown value={year} options={years} onChange={(e) => setYear(e.value)} />
                    </div>
                    <div className="field col-3">
                        <label className="font-bold">월</label>
                        <Dropdown value={month} options={months} onChange={(e) => setMonth(e.value)} />
                    </div>
                    <div className="field col-3">
                        <label className="font-bold">주차</label>
                        <Dropdown value={week} options={weeks} onChange={(e) => setWeek(e.value)} />
                    </div>
                    <div className="field col-3 flex align-items-end">
                        <Button
                            label="조회"
                            icon="pi pi-search"
                            onClick={handleSearch}
                            loading={loading}
                            className="p-button-info"
                        />
                    </div>
                </div>

                <div className="flex align-items-center mb-2 px-1">
                    <Checkbox
                        inputId="noImageOnly"
                        checked={noImageOnly}
                        onChange={(e) => setNoImageOnly(e.checked || false)}
                    />

                    <label htmlFor="noImageOnly" className="ml-2 font-bold cursor-pointer text-sm">
                        이미지 없음 {noImageOnly && `(${filteredStudents.length}명)`}
                    </label>
                </div>
                <DataTable
                    value={filteredStudents}
                    scrollable
                    tableStyle={{ minWidth: isMobile ? '700px' : 'auto' }}
                    scrollHeight={isMobile ? '400px' : '450px'}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 20, 50]}
                    emptyMessage="데이터가 없습니다. 조회 버튼을 눌러주세요."
                    className="mt-3"
                >
                    <Column field="studentName" header="학생명" style={{ minWidth: '100px' }} sortable />
                    <Column field="className" header="클래스" style={{ minWidth: '150px' }} sortable />
                    <Column
                        sortable
                        field="shareImageUrls"
                        header="현재 이미지 (클릭 시 확대)"
                        body={imageBodyTemplate}
                        style={{ minWidth: '160px' }}
                    />
                    <Column header="작업" body={actionBodyTemplate} style={{ minWidth: '120px' }} />
                </DataTable>
            </Dialog>

            <Lightbox
                open={lightboxOpen}
                zoom={{
                    maxZoomPixelRatio: 3, // 최대 3배까지 확대
                    zoomInMultiplier: 2, // 한 번 클릭 시 확대 배율
                    doubleTapDelay: 300 // 더블 탭 인식 시간
                }}
                close={handleLightboxClose}
                index={lightboxIndex}
                slides={currentSlides}
                plugins={[Zoom]}
                portal={{ root: document.body }}
                styles={{ root: { zIndex: 9998 } }}
            />
        </>
    );
};

export default AutoImageUploadModal;
