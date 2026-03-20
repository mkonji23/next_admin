'use client';

import React from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Image } from 'primereact/image';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { ShareItem } from '../types';
import { useToast } from '@/hooks/useToast';
import dayjs from 'dayjs';

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

    return (
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
                        onClick={() => onDelete(selectedShare._id)}
                    />
                </div>
            </div>

            <div className="grid">
                {/* 왼쪽: 게시글 본문 및 공유 설정 정보 */}
                <div className="col-12 md:col-8">
                    <Card className="shadow-2">
                        {/* 게시용 정보 섹션 */}
                        <div className="mb-4">
                            <div className="flex align-items-center gap-2 mb-3">
                                <Tag value="게시용" severity="info" />
                                <h4 className="m-0 font-bold">{selectedShare.actualTitle}</h4>
                            </div>

                            {/* 학생 정보 요약 */}
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
                                        {dayjs(selectedShare?.createdDate).format('YYYY-MM-DD hh:mm:ss') || ''}
                                    </span>
                                </div>
                                {selectedShare?.updatedDate && (
                                    <div>
                                        <span className="text-500 mr-2">수정일:</span>
                                        <span className="text-900">
                                            {dayjs(selectedShare?.updatedDate).format('YYYY-MM-DD hh:mm:ss') || ''}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div
                                className="p-3 surface-50 border-round text-700 line-height-3"
                                style={{ whiteSpace: 'pre-wrap', minHeight: '150px' }}
                            >
                                {selectedShare.actualContent}
                            </div>
                        </div>

                        <Divider align="center">
                            <span className="p-tag p-tag-warning">카카오 공유</span>
                        </Divider>

                        {/* 공유용 정보 섹션 */}
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
                                    tooltip="링크 복사"
                                    tooltipOptions={{ position: 'bottom' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        copyLink('student');
                                    }}
                                />
                                <Button
                                    icon="pi pi-copy"
                                    label="링크 복사(학부모용)"
                                    className="p-button-success flex-2"
                                    tooltip="링크 복사"
                                    tooltipOptions={{ position: 'bottom' }}
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

                {/* 오른쪽: 이미지 정보 */}
                <div className="col-12 md:col-4">
                    <Card title="첨부 이미지" className="shadow-2">
                        <div className="flex flex-column gap-3">
                            {selectedShare.shareImageUrls?.map((item, idx) => {
                                const url = typeof item === 'string' ? item : item.url;
                                const fileName = url.split('/').pop()?.split('?')[0] || `image-${idx}.jpg`;
                                return (
                                    <div
                                        key={idx}
                                        className="border-1 surface-border border-round overflow-hidden relative"
                                    >
                                        <Image src={url} alt={`img-${idx}`} width="100%" preview />
                                        <div className="p-2 surface-card border-top-1 surface-border flex justify-content-between align-items-center">
                                            <Button
                                                icon="pi pi-download"
                                                className="p-button-text p-button-sm p-button-secondary"
                                                tooltip="다운로드"
                                                onClick={() => handleDownload(url, fileName)}
                                            />
                                            <span className="text-xs text-500 truncate mr-2">{fileName}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            {(!selectedShare.shareImageUrls || selectedShare.shareImageUrls.length === 0) && (
                                <div className="text-center p-4 surface-50 border-round text-500">
                                    등록된 이미지가 없습니다.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DetailView;
