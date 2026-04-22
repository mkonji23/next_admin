'use client';

import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import dayjs from 'dayjs';
import Lightbox from 'yet-another-react-lightbox';
import Download from 'yet-another-react-lightbox/plugins/download';
import 'yet-another-react-lightbox/styles.css';
import { ShareItem } from '@/app/(main)/kakao-share/types';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import { CustomEditor } from '@/components/editor/CustomEditor';
import { useLightboxHistory } from '@/hooks/useLightboxHistory';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { useContext } from 'react';

interface KakaoShareViewContentProps {
    shareData: ShareItem;
    images: any[];
    downloadImageFn: (url: string, index: number) => Promise<void>;
    pageType?: string;
}

const KakaoShareViewContent: React.FC<KakaoShareViewContentProps> = ({
    shareData,
    images,
    downloadImageFn,
    pageType
}) => {
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);
    const { handleClose } = useLightboxHistory(open, setOpen);
    const { layoutConfig } = useContext(LayoutContext);
    const isDark = layoutConfig.colorScheme === 'dark';

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return dayjs(dateStr).format('YYYY-MM-DD HH:mm');
    };

    const slides = images.map((img) => ({
        src: img.itemImageSrc,
        downloadUrl: img.itemImageSrc
    }));

    return (
        <div className="layout-content p-3 md:p-5 flex justify-content-center min-h-screen surface-ground">
            <div className="w-full" style={{ maxWidth: '800px' }}>
                <Card title={shareData.actualTitle} className="shadow-4 mb-4">
                    <div className="flex justify-content-between align-items-center mb-4 text-sm text-color-secondary flex-wrap gap-2">
                        <div className="flex align-items-center gap-2">
                            {pageType && (
                                <Tag
                                    value={pageType === 'parent' ? '학부모용' : '학생용'}
                                    severity={pageType === 'parent' ? 'success' : 'info'}
                                />
                            )}
                            <span>등록일: {formatDate(shareData.createdDate)}</span>
                        </div>
                        {shareData?.className && (
                            <span>
                                클래스 이름: <span className="text-color font-bold">{shareData.className}</span>
                            </span>
                        )}
                        {shareData?.studentName && (
                            <span>
                                학생 이름: <span className="text-color font-bold">{shareData.studentName}</span>
                            </span>
                        )}
                    </div>

                    <div className="mb-6 surface-section p-3 border-round">
                        <CustomEditor
                            value={shareData.actualContent || ''}
                            delta={shareData.delta}
                            readOnly={true}
                            style={{ height: 'auto' }}
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
                                                <div
                                                    className="flex align-items-center justify-content-center cursor-pointer hover:shadow-4 transition-duration-200"
                                                    onClick={() => {
                                                        setIndex(idx);
                                                        setOpen(true);
                                                    }}
                                                >
                                                    <img
                                                        src={img.thumbnailImageSrc}
                                                        alt={`share-img-${idx}`}
                                                        style={{ width: '100%', display: 'block' }}
                                                    />
                                                </div>
                                                <Button
                                                    icon="pi pi-download"
                                                    className="p-button-rounded p-button-secondary p-button-text p-button-sm absolute top-0 left-0 m-2"
                                                    style={{
                                                        background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)',
                                                        color: isDark ? '#fff' : '#333',
                                                        width: '1.75rem',
                                                        height: '1.75rem',
                                                        zIndex: 1
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        downloadImageFn(img.itemImageSrc, idx);
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
                    <div className="text-color-secondary text-xs">
                        &copy; {new Date().getFullYear()} chochoMath. All rights reserved.
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
                plugins={[Download, Zoom]}
            />
        </div>
    );
};

export default KakaoShareViewContent;
