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
import { Tooltip } from 'primereact/tooltip';

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

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            // 만약 현재 lightbox가 열려있는 상태라면 useLightboxHistory가 처리하도록 둠
            // lightbox 상태가 pop되면서 detailView 상태로 돌아오는 것인지 확인
            if (!event.state || !event.state.detailView) {
                onBack();
            }
        };

        // 상세 뷰 진입 시 히스토리 상태 추가
        window.history.pushState({ detailView: true }, '');
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [onBack]);

    const handleBackClick = () => {
        onBack();
    };

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

    const shareCount = selectedShare.shareCount || 0;
    const openCount = selectedShare.kakaoOpenCount || 0;
    const totalVisitCount = selectedShare.totalOpenCount || 0;

    const getOpenStatus = () => {
        if (shareCount > 0) {
            if (openCount >= shareCount) return { label: '열람', severity: 'success' };
            if (openCount > 0) return { label: '부분 열람', severity: 'warning' };
            return { label: '미열람', severity: 'danger' };
        }
        if (openCount > 0) return { label: '열람', severity: 'success' };
        return { label: '미열람', severity: 'danger' };
    };

    const openStatus = getOpenStatus();
    const isToday = dayjs(selectedShare.createdDate).isSame(dayjs(), 'day');
    const isAuto = selectedShare.isAuto === true;

    return (
        <>
            <Card>
                <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 gap-3">
                    <div className="flex align-items-center">
                        <Button icon="pi pi-arrow-left" className="p-button-text mr-2" onClick={handleBackClick} />
                        <h5 className="m-0">상세 정보</h5>
                    </div>
                    <div className="flex flex-column sm:flex-row gap-2 w-full md:w-auto">
                        <Button
                            label="카카오톡 공유"
                            icon="pi pi-share-alt"
                            className="p-button-primary flex-1 min-w-150  white-space-nowrap"
                            onClick={() => onShare(selectedShare)}
                        />
                        <Button
                            label="복사"
                            icon="pi pi-clone"
                            className="p-button-outlined p-button-secondary flex-1 white-space-nowrap"
                            onClick={() => onCopyToNew(selectedShare)}
                        />
                        <Button
                            label="수정"
                            icon="pi pi-pencil"
                            className="p-button-outlined p-button-info flex-1 white-space-nowrap"
                            onClick={() => onEdit(selectedShare)}
                        />
                        <Button
                            label="삭제"
                            icon="pi pi-trash"
                            className="p-button-outlined p-button-danger flex-1 white-space-nowrap"
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
                                <div className="flex flex-column gap-3 mb-3">
                                    <div className="flex align-items-center flex-wrap gap-2">
                                        {/* N, A 뱃지 추가 */}
                                        <div className="flex gap-1 mr-1">
                                            {isToday && (
                                                <>
                                                    <div
                                                        id="detail-new-tag"
                                                        className="flex align-items-center justify-content-center border-circle bg-blue-500 text-white font-bold"
                                                        style={{
                                                            width: '22px',
                                                            height: '22px',
                                                            fontSize: '12px',
                                                            cursor: 'help'
                                                        }}
                                                    >
                                                        N
                                                    </div>
                                                    <Tooltip
                                                        target="#detail-new-tag"
                                                        content="오늘 등록된 새 게시글"
                                                        position="top"
                                                    />
                                                </>
                                            )}
                                            {isAuto && (
                                                <>
                                                    <div
                                                        id="detail-auto-tag"
                                                        className="flex align-items-center justify-content-center border-circle bg-orange-500 text-white font-bold"
                                                        style={{
                                                            width: '22px',
                                                            height: '22px',
                                                            fontSize: '12px',
                                                            cursor: 'help'
                                                        }}
                                                    >
                                                        A
                                                    </div>
                                                    <Tooltip
                                                        target="#detail-auto-tag"
                                                        content="자동 생성 데이터"
                                                        position="top"
                                                    />
                                                </>
                                            )}
                                        </div>

                                        <Tooltip target="#tooltipShare" />
                                        <Tag
                                            id="tooltipShare"
                                            style={{ minWidth: '80px' }}
                                            icon="pi pi-share-alt"
                                            value={shareCount > 0 ? `공유완료(${shareCount})` : '미공유'}
                                            severity={shareCount > 0 ? 'success' : null}
                                            data-pr-tooltip={`${shareCount} 회 공유되었습니다.`}
                                            data-pr-position="top"
                                        />
                                        {openCount > 0 && (
                                            <>
                                                <Tooltip target="#tooltipOpen" />
                                                <Tag
                                                    id="tooltipOpen"
                                                    icon="pi pi-eye"
                                                    value={`${openStatus.label}(${openCount}/${shareCount})`}
                                                    data-pr-tooltip={`공유된 링크 중 ${openCount} 개가 열람되었습니다.`}
                                                    data-pr-position="top"
                                                    severity={openStatus.severity as any}
                                                />
                                            </>
                                        )}

                                        <Tooltip target="#tooltipIsRead" />
                                        <Tag
                                            id="tooltipIsRead"
                                            icon={selectedShare.isRead ? 'pi pi-check-circle' : 'pi pi-times-circle'}
                                            value={selectedShare.isRead ? '본인확인' : '미확인'}
                                            severity={selectedShare.isRead ? 'success' : 'danger'}
                                            data-pr-tooltip="학생칭찬현황에서 확인했는지 여부"
                                            data-pr-position="top"
                                            style={{ minWidth: '90px' }}
                                        />

                                        <Tooltip target="#tooltipVisit" />
                                        <Tag
                                            id="tooltipVisit"
                                            icon="pi pi-eye"
                                            value={totalVisitCount}
                                            data-pr-tooltip={`총 ${totalVisitCount} 회 방문(페이지 로드)되었습니다.`}
                                            data-pr-position="top"
                                            style={{ background: '#607D8B', color: '#ffffff' }}
                                        />
                                    </div>

                                    <h4 className="m-0 font-bold text-2xl">{selectedShare.actualTitle}</h4>
                                </div>

                                <div className="flex flex-wrap gap-4 mb-3 p-3 surface-100 border-round text-sm">
                                    <div>
                                        <span className="text-500 mr-2">리포트 기간:</span>
                                        <span className="text-900 font-bold">
                                            {selectedShare.autoYear ? `${selectedShare.autoYear}년 ` : ''}
                                            {selectedShare.autoMonth ? `${selectedShare.autoMonth}월 ` : ''}
                                            {selectedShare.autoWeek ? `${selectedShare.autoWeek}주차` : ''}
                                        </span>
                                    </div>
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

                                <div className="p-3 surface-50 border-round overflow-hidden">
                                    <CustomEditor
                                        value={selectedShare?.actualContent}
                                        delta={selectedShare.delta}
                                        readOnly={true}
                                        style={{ height: 'auto', minHeight: 'unset' }}
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
                                <div className="flex flex-column sm:flex-row gap-2">
                                    <Button
                                        icon="pi pi-copy"
                                        label="링크 복사(학생용)"
                                        className="p-button-warning flex-1 min-w-180 white-space-normal"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyLink('student');
                                        }}
                                    />
                                    <Button
                                        icon="pi pi-copy"
                                        label="링크 복사(학부모용)"
                                        className="p-button-success flex-1 min-w-180 white-space-normal"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyLink('parent');
                                        }}
                                    />
                                    <Button
                                        label="카카오톡 공유"
                                        icon="pi pi-share-alt"
                                        className="p-button-primary flex-1 min-w-150 white-space-nowrap"
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
            </Card>

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
