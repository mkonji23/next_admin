'use client';

import React from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Image } from 'primereact/image';
import { ShareItem } from '../types';

interface DetailViewProps {
    selectedShare: ShareItem | null;
    onBack: () => void;
    onShare: (item: ShareItem) => void;
}

const DetailView = ({ selectedShare, onBack, onShare }: DetailViewProps) => {
    if (!selectedShare) return null;

    return (
        <div className="card">
            <div className="flex align-items-center mb-4">
                <Button icon="pi pi-arrow-left" className="p-button-text mr-2" onClick={onBack} />
                <h5>{selectedShare.actualTitle}</h5>
            </div>
            <div className="grid">
                <div className="col-12 md:col-8">
                    <Card title="게시글 내용">
                        <p className="m-0" style={{ whiteSpace: 'pre-wrap' }}>{selectedShare.actualContent}</p>
                        <hr className="my-4" />
                        <h6>공유 정보 (카카오톡 미리보기)</h6>
                        <p><strong>제목:</strong> {selectedShare.shareTitle}</p>
                        <p><strong>설명:</strong> {selectedShare.shareContent}</p>
                        <Button 
                            label="이 포스트 공유하기" 
                            icon="pi pi-share-alt" 
                            className="p-button-warning mt-2" 
                            onClick={() => onShare(selectedShare)} 
                        />
                    </Card>
                </div>
                <div className="col-12 md:col-4">
                    <Card title="첨부 이미지">
                        <div className="flex flex-wrap gap-2">
                            {selectedShare.shareImageUrls?.map((url, idx) => (
                                <Image key={idx} src={url} alt={`img-${idx}`} width="100%" preview />
                            ))}
                            {(!selectedShare.shareImageUrls || selectedShare.shareImageUrls.length === 0) && <p>이미지가 없습니다.</p>}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DetailView;
