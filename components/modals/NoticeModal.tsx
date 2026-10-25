'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useHttp } from '@/util/axiosInstance';
import dayjs from 'dayjs';

interface NoticeModalProps {
    visible: boolean;
    onClose: (result?: any) => void;
    pData?: {
        notices?: any[];
        initialNoticeId?: string;
        studentClassIds?: string[];
    };
}

/**
 * Quill Delta ops를 안전하고 깨끗하게 렌더링하는 전용 뷰어
 */
const NoticeBodyViewer = ({ delta, content }: { delta: any; content?: string }) => {
    const renderedNodes = useMemo(() => {
        let parsedDelta = delta;
        if (typeof delta === 'string' && delta.trim() !== '') {
            try {
                parsedDelta = JSON.parse(delta);
            } catch (e) {
                parsedDelta = null;
            }
        }

        if (parsedDelta && Array.isArray(parsedDelta.ops) && parsedDelta.ops.length > 0) {
            return parsedDelta.ops.map((op: any, index: number) => {
                // 이미지 op
                if (op.insert && typeof op.insert === 'object' && op.insert.image) {
                    return (
                        <div key={index} className="my-3 text-center">
                            <img
                                src={op.insert.image}
                                alt="공지 이미지"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '500px',
                                    borderRadius: '8px',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                    );
                }

                // 텍스트 op
                if (typeof op.insert === 'string') {
                    const text = op.insert;
                    const attrs = op.attributes || {};

                    const style: React.CSSProperties = {};
                    if (attrs.bold) style.fontWeight = 'bold';
                    if (attrs.italic) style.fontStyle = 'italic';
                    let textDecoration = '';
                    if (attrs.underline) textDecoration += ' underline';
                    if (attrs.strike) textDecoration += ' line-through';
                    if (textDecoration) style.textDecoration = textDecoration.trim();
                    if (attrs.color) style.color = attrs.color;
                    if (attrs.background) style.backgroundColor = attrs.background;

                    let fontSize = 'inherit';
                    if (attrs.size === 'small') fontSize = '0.85rem';
                    if (attrs.size === 'large') fontSize = '1.25rem';
                    if (attrs.size === 'huge') fontSize = '1.75rem';
                    style.fontSize = fontSize;

                    // 줄바꿈 보존
                    return (
                        <span key={index} style={style} className="white-space-pre-wrap">
                            {text}
                        </span>
                    );
                }

                return null;
            });
        }

        // Delta가 없을 경우 content 표시
        if (content) {
            // HTML 포함 여부 감지
            const isHtml = /<[a-z][\s\S]*>/i.test(content);
            if (isHtml) {
                return <div dangerouslySetInnerHTML={{ __html: content }} />;
            }
            return <div className="white-space-pre-wrap line-height-3">{content}</div>;
        }

        return <div className="text-500 italic p-4 text-center">공지사항 본문 내용이 없습니다.</div>;
    }, [delta, content]);

    return (
        <div
            className="notice-body-container ql-editor p-3 border-round surface-50"
            style={{
                minHeight: '260px',
                maxHeight: '60vh',
                overflowY: 'auto',
                fontSize: '1rem',
                lineHeight: '1.7',
                wordBreak: 'break-word',
                border: '1px solid var(--surface-border)'
            }}
        >
            {renderedNodes}
        </div>
    );
};

const NoticeModal = ({ visible, onClose, pData }: NoticeModalProps) => {
    const http = useHttp();
    const [noticeList, setNoticeList] = useState<any[]>(pData?.notices || []);
    const [selectedNotice, setSelectedNotice] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [loading, setLoading] = useState<boolean>(false);

    // 모달이 열리거나 pData가 바뀔 때 초기화 및 데이터 로드
    useEffect(() => {
        if (!visible) return;

        const initNotices = async () => {
            let notices = pData?.notices;

            // 전달된 공지사항 목록이 없거나 비어있는 경우 API를 직접 호출하여 가져옴
            if (!notices || notices.length === 0) {
                setLoading(true);
                try {
                    const res = await http.get('/choiMath/notice/list', {
                        params: { isNotice: true },
                        disableLoading: true
                    });
                    const allNotices = res.data || [];
                    const studentClassIds = pData?.studentClassIds;

                    // 학생 클래스 필터링 (정보가 있으면 필터링, 없으면 전체 목록)
                    if (studentClassIds && studentClassIds.length > 0) {
                        notices = allNotices.filter((n: any) => {
                            if (!n.classIds || n.classIds.length === 0) return true;
                            return n.classIds.some((cid: string) => studentClassIds.includes(cid));
                        });
                    } else {
                        notices = allNotices;
                    }
                } catch (error) {
                    console.error('Failed to fallback fetch notices:', error);
                    notices = [];
                } finally {
                    setLoading(false);
                }
            }

            setNoticeList(notices || []);

            // initialNoticeId가 지정되어 있는 경우 바로 상세 화면 오픈
            if (pData?.initialNoticeId && notices && notices.length > 0) {
                const notice = notices.find((n: any) => n.noticeId === pData.initialNoticeId);
                if (notice) {
                    setSelectedNotice(notice);
                    setViewMode('detail');
                    try {
                        localStorage.setItem(`notice_read_${notice.noticeId}`, 'true');
                    } catch (e) {
                        // ignore localStorage error
                    }
                    return;
                }
            }

            setViewMode('list');
            setSelectedNotice(null);
        };

        initNotices();
    }, [visible, pData]);

    const handleNoticeClick = (notice: any) => {
        setSelectedNotice(notice);
        setViewMode('detail');
        try {
            localStorage.setItem(`notice_read_${notice.noticeId}`, 'true');
        } catch (e) {
            // ignore
        }
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedNotice(null);
    };

    const handleClose = () => {
        if (viewMode === 'detail' && selectedNotice?.noticeId) {
            try {
                localStorage.setItem(`notice_read_${selectedNotice.noticeId}`, 'true');
            } catch (e) {
                // ignore
            }
        }
        onClose();
    };

    const titleTemplate = (rowData: any) => {
        const isRead = typeof window !== 'undefined' && localStorage.getItem(`notice_read_${rowData.noticeId}`);
        return (
            <div className="flex align-items-center gap-2">
                {rowData.isNotice && <span className="p-tag p-tag-success text-xs">공지</span>}
                {!isRead && <span className="p-tag p-tag-danger text-xs">NEW</span>}
                <span className="font-semibold text-900">{rowData.title}</span>
            </div>
        );
    };

    const dateTemplate = (rowData: any) => {
        return (
            <span className="text-500 text-xs md:text-sm">
                {dayjs(rowData.createdDate).format('YYYY-MM-DD')}
            </span>
        );
    };

    const renderList = () => {
        if (loading) {
            return (
                <div className="flex justify-content-center align-items-center py-6">
                    <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="4" />
                </div>
            );
        }

        return (
            <div className="flex flex-column gap-2">
                <DataTable
                    value={noticeList}
                    rows={10}
                    className="p-datatable-sm"
                    onRowClick={(e) => handleNoticeClick(e.data)}
                    rowClassName={() => 'cursor-pointer hover:surface-100 transition-colors transition-duration-150'}
                    emptyMessage="등록된 공지사항이 없습니다."
                    responsiveLayout="scroll"
                >
                    <Column field="title" header="제목" body={titleTemplate} style={{ minWidth: '60%' }} />
                    <Column field="createdDate" header="등록일" body={dateTemplate} style={{ width: '110px', textAlign: 'right' }} />
                </DataTable>
            </div>
        );
    };

    const renderDetail = () => (
        <div className="flex flex-column gap-3">
            <div className="flex justify-content-between align-items-center border-bottom-1 surface-border pb-2 flex-wrap gap-2">
                <div className="flex align-items-center gap-2">
                    {selectedNotice?.isNotice && <span className="p-tag p-tag-success text-xs">공지</span>}
                    <h4 className="m-0 text-900 font-bold">{selectedNotice?.title}</h4>
                </div>
                <span className="text-500 text-xs md:text-sm">
                    {dayjs(selectedNotice?.createdDate).format('YYYY-MM-DD HH:mm')}
                </span>
            </div>

            {/* 공지사항 본문 내용 뷰어 */}
            <NoticeBodyViewer delta={selectedNotice?.delta} content={selectedNotice?.content} />

            <div className="flex justify-content-between align-items-center mt-2 pt-2 border-top-1 surface-border">
                {!pData?.initialNoticeId ? (
                    <Button
                        label="목록으로"
                        icon="pi pi-arrow-left"
                        className="p-button-text p-button-sm"
                        onClick={handleBackToList}
                    />
                ) : (
                    <div />
                )}
                <Button
                    label="닫기"
                    icon="pi pi-times"
                    className="p-button-outlined p-button-secondary p-button-sm"
                    onClick={handleClose}
                />
            </div>
        </div>
    );

    return (
        <Dialog
            header={viewMode === 'list' ? '공지사항 목록' : '공지사항 상세'}
            visible={visible}
            style={{
                width: viewMode === 'list' ? '92vw' : '92vw',
                maxWidth: viewMode === 'list' ? '650px' : '850px'
            }}
            onHide={handleClose}
            dismissableMask
        >
            {viewMode === 'list' ? renderList() : renderDetail()}
        </Dialog>
    );
};

export default NoticeModal;
