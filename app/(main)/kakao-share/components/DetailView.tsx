'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { ShareItem } from '../types';
import { useToast } from '@/hooks/useToast';
import dayjs from 'dayjs';
import Lightbox from 'yet-another-react-lightbox';
import Download from 'yet-another-react-lightbox/plugins/download';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import { CustomEditor } from '@/components/editor/CustomEditor';
import { useLightboxHistory } from '@/hooks/useLightboxHistory';

interface DetailViewProps {
    selectedShare: ShareItem | null;
    onBack: () => void;
    onShare: (item: ShareItem) => void;
    onEdit: (item: ShareItem) => void;
    onDelete: (id: string) => void;
    onCopyToNew: (item: ShareItem) => void;
}

const DetailView = ({ selectedShare, onBack, onShare, onEdit, onDelete, onCopyToNew }: DetailViewProps) => {
    const { showToast } = useToast();
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);
    const { handleClose } = useLightboxHistory(open, setOpen);

    if (!selectedShare) return null;

    const handleDownload = async (url: string, fileName: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download error:', error);
            alert('이미지 다운로드에 실패했습니다.');
        }
    };

    const copyLink = (type: string) => {
        const baseUri = typeof window !== 'undefined' ? window.location.origin : '';
        const shareLink = `${baseUri}/kakao-share/view/${type}/${selectedShare._id}`;

        navigator.clipboard
            .writeText(shareLink)
            .then(() => {
                showToast({
                    severity: 'success',
                    summary: '복사 완료',
                    detail: '공유 링크가 클립보드에 복사되었습니다.'
                });
            })
            .catch((err) => {
                console.error('Copy error:', err);
                showToast({ severity: 'error', summary: '오류', detail: '링크 복사에 실패했습니다.' });
            });
    };

    const slides = (selectedShare.shareImageUrls || []).map((item) => {
        const url = typeof item === 'string' ? item : item.url;
        return {
            src: url,
            download: url // 다운로드 플러그인을 위한 속성 추가
        };
    });

    return (
        <>
            <div className="card">
                <div className="flex justify-content-between align-items-center mb-4">
                    <div className="flex align-items-center">
                        <Button icon="pi pi-arrow-left" className="p-button-text mr-2" onClick={onBack} />
                        <h5>상세 정보</h5>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            label="복사"
                            icon="pi pi-clone"
                            className="p-button-outlined p-button-secondary"
                            onClick={() => onCopyToNew(selectedShare)}
                        />
                        <Button
                            label="수정"
                            icon="pi pi-pencil"
                            className="p-button-outlined p-button-info"
                            onClick={() => onEdit(selectedShare)}
                        />
                        <Button
                            label="삭제"
                            icon="pi pi-trash"
                            className="p-button-outlined p-button-danger"
                            onClick={() => {
                                if (selectedShare._id) {
                                    onDelete(selectedShare._id);
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="grid">
                    {/* 왼쪽: 게시글 본문 및 공유 설정 정보 */}
                    <div className="col-12 md:col-8">
                        <Card className="shadow-2">
                            <div className="mb-4">
                                <div className="flex align-items-center gap-2 mb-3">
                                    <Tag value="게시용" severity="info" />
                                    <h4 className="m-0 font-bold">{selectedShare.actualTitle}</h4>
                                </div>

                                <div className="flex flex-wrap gap-4 mb-3 p-3 surface-100 border-round text-sm">
                                    <div>
                                        <span className="text-500 mr-2">클래스:</span>
                                        <span className="text-900 font-bold">{selectedShare?.className || ''}</span>
                                    </div>
                                    <div>
                                        <span className="text-500 mr-2">학생 이름:</span>
                                        <span className="text-900 font-bold">{selectedShare?.studentName || ''}</span>
                                    </div>
                                    <div>
                                        <span className="text-500 mr-2">학생 연락처:</span>
                                        <span className="text-900">{selectedShare?.telNo || '등록 필요'}</span>
                                    </div>
                                    <div>
                                        <span className="text-500 mr-2">학부모 연락처:</span>
                                        <span className="text-900">{selectedShare?.pTelNo || '등록 필요'}</span>
                                    </div>
                                    <div>
                                        <span className="text-500 mr-2">등록일:</span>
                                        <span className="text-900">
                                            {dayjs(selectedShare?.createdDate).format('YYYY-MM-DD HH:mm:ss') || ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3 surface-50 border-round" style={{ minHeight: '150px' }}>
                                    <CustomEditor
                                        value={selectedShare?.actualContent}
                                        delta={selectedShare.delta}
                                        readOnly={true}
                                    />
                                </div>
                            </div>

                            <Divider align="center">
                                <span className="p-tag p-tag-warning">카카오 공유</span>
                            </Divider>

                            <div className="p-3 border-1 surface-border border-round surface-card">
                                <div className="grid">
                                    <div className="col-12 mb-2">
                                        <span className="text-500 font-medium block mb-1">제목(카카오)</span>
                                        <div className="text-900 font-bold">{selectedShare.shareTitle}</div>
                                    </div>
                                    <div className="col-12 mb-3">
                                        <span className="text-500 font-medium block mb-1">설명(카카오)</span>
                                        <div className="text-700">{selectedShare.shareContent}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        icon="pi pi-copy"
                                        label="링크 복사(학생용)"
                                        className="p-button-warning flex-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyLink('student');
                                        }}
                                    />
                                    <Button
                                        icon="pi pi-copy"
                                        label="링크 복사(학부모용)"
                                        className="p-button-success flex-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyLink('parent');
                                        }}
                                    />
                                    <Button
                                        label="카카오톡 공유"
                                        icon="pi pi-share-alt"
                                        className="p-button-primary flex-2"
                                        onClick={() => onShare(selectedShare)}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* 오른쪽: 이미지 정보 (Grid Thumbnails) */}
                    <div className="col-12 md:col-4">
                        <Card title="첨부 이미지" className="shadow-2 h-full">
                            {slides.length > 0 ? (
                                <div className="grid">
                                    {slides.map((slide, idx) => {
                                        const url = slide.src;
                                        const fileName = url.split('/').pop()?.split('?')[0] || `image-${idx}.jpg`;
                                        return (
                                            <div key={idx} className="col-6 mb-3">
                                                <div className="relative border-round overflow-hidden shadow-2 surface-card hover:shadow-4 transition-duration-200">
                                                    <div
                                                        className="cursor-pointer"
                                                        onClick={() => {
                                                            setIndex(idx);
                                                            setOpen(true);
                                                        }}
                                                    >
                                                        <img
                                                            src={url}
                                                            alt={`img-${idx}`}
                                                            style={{
                                                                width: '100%',
                                                                height: '120px',
                                                                objectFit: 'cover',
                                                                display: 'block'
                                                            }}
                                                        />
                                                    </div>
                                                    <Button
                                                        icon="pi pi-download"
                                                        className="p-button-rounded p-button-secondary p-button-text p-button-sm absolute top-0 left-0 m-1"
                                                        style={{
                                                            background: 'rgba(255,255,255,0.7)',
                                                            color: '#333',
                                                            width: '1.5rem',
                                                            height: '1.5rem',
                                                            zIndex: 1
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownload(url, fileName);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center p-4 surface-50 border-round text-500">
                                    등록된 이미지가 없습니다.
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>

            <Lightbox
                open={open}
                zoom={{
                    maxZoomPixelRatio: 3, // 최대 3배까지 확대
                    zoomInMultiplier: 2, // 한 번 클릭 시 확대 배율
                    doubleTapDelay: 300 // 더블 탭 인식 시간
                }}
                close={handleClose}
                index={index}
                slides={slides}
                carousel={{ finite: true }}
                plugins={[Download, Thumbnails, Zoom]}
            />
        </>
    );
};

export default DetailView;
