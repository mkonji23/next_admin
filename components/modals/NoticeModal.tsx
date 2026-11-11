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
 * Quill Delta ops 및 텍스트 서식(개행, 단락, 헤더, 리스트, 볼드/색상, 이미지)을
 * 완벽하고 깨끗하게 렌더링하는 전용 뷰어
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

        // 1. Delta ops가 있는 경우: 단락(Line) 기반 완벽 서식 파싱
        if (parsedDelta && Array.isArray(parsedDelta.ops) && parsedDelta.ops.length > 0) {
            interface TextSegment {
                text: string;
                attrs: any;
            }
            interface LineBlock {
                type: 'p' | 'h1' | 'h2' | 'h3' | 'bullet' | 'ordered' | 'blockquote' | 'image';
                segments?: TextSegment[];
                imageUrl?: string;
                align?: string;
            }

            const lines: LineBlock[] = [];
            let currentSegments: TextSegment[] = [];

            for (const op of parsedDelta.ops) {
                // 이미지 삽입
                if (op.insert && typeof op.insert === 'object' && op.insert.image) {
                    if (currentSegments.length > 0) {
                        lines.push({ type: 'p', segments: currentSegments });
                        currentSegments = [];
                    }
                    lines.push({ type: 'image', imageUrl: op.insert.image });
                    continue;
                }

                // 텍스트 삽입 (줄바꿈 \n 처리)
                if (typeof op.insert === 'string') {
                    const parts = op.insert.split('\n');
                    for (let i = 0; i < parts.length; i++) {
                        const partText = parts[i];
                        if (partText) {
                            currentSegments.push({ text: partText, attrs: op.attributes || {} });
                        }
                        // 줄바꿈 \n을 만난 경우 이전 단락 마감
                        if (i < parts.length - 1) {
                            const blockAttrs = op.attributes || {};
                            let lineType: LineBlock['type'] = 'p';
                            if (blockAttrs.header === 1) lineType = 'h1';
                            else if (blockAttrs.header === 2) lineType = 'h2';
                            else if (blockAttrs.header === 3) lineType = 'h3';
                            else if (blockAttrs.list === 'bullet') lineType = 'bullet';
                            else if (blockAttrs.list === 'ordered') lineType = 'ordered';
                            else if (blockAttrs.blockquote) lineType = 'blockquote';

                            lines.push({
                                type: lineType,
                                segments: currentSegments,
                                align: blockAttrs.align || 'left'
                            });
                            currentSegments = [];
                        }
                    }
                }
            }

            if (currentSegments.length > 0) {
                lines.push({ type: 'p', segments: currentSegments });
            }

            let orderedCounter = 1;

            return lines.map((line, lineIdx) => {
                // 이미지 블록
                if (line.type === 'image' && line.imageUrl) {
                    return (
                        <div key={lineIdx} className="my-3 text-center">
                            <img
                                src={line.imageUrl}
                                alt="공지 이미지"
                                className="shadow-2 border-round-xl"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '550px',
                                    borderRadius: '8px',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                    );
                }

                // 인라인 텍스트 세그먼트 렌더링
                const inlineNodes = (line.segments || []).map((seg, segIdx) => {
                    const attrs = seg.attrs || {};
                    const style: React.CSSProperties = {};

                    if (attrs.bold) style.fontWeight = 'bold';
                    if (attrs.italic) style.fontStyle = 'italic';
                    let textDeco = '';
                    if (attrs.underline) textDeco += ' underline';
                    if (attrs.strike) textDeco += ' line-through';
                    if (textDeco) style.textDecoration = textDeco.trim();
                    if (attrs.color) style.color = attrs.color;
                    if (attrs.background) style.backgroundColor = attrs.background;

                    if (attrs.size === 'small') style.fontSize = '0.85rem';
                    else if (attrs.size === 'large') style.fontSize = '1.25rem';
                    else if (attrs.size === 'huge') style.fontSize = '1.65rem';

                    if (attrs.link) {
                        return (
                            <a
                                key={segIdx}
                                href={attrs.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={style}
                                className="text-primary underline hover:text-primary-600 font-semibold"
                            >
                                {seg.text}
                            </a>
                        );
                    }

                    return (
                        <span key={segIdx} style={style}>
                            {seg.text}
                        </span>
                    );
                });

                // 빈 줄(연속 엔터 공백) 보존
                const isEmpty = !line.segments || line.segments.length === 0;
                const textAlign = (line.align as any) || 'left';

                if (isEmpty) {
                    orderedCounter = 1;
                    return <div key={lineIdx} className="h-1rem" style={{ minHeight: '1.2rem' }}>&nbsp;</div>;
                }

                if (line.type === 'h1') {
                    orderedCounter = 1;
                    return (
                        <h2 key={lineIdx} className="text-xl md:text-2xl font-bold text-900 mt-3 mb-2" style={{ textAlign }}>
                            {inlineNodes}
                        </h2>
                    );
                }

                if (line.type === 'h2') {
                    orderedCounter = 1;
                    return (
                        <h3 key={lineIdx} className="text-lg md:text-xl font-bold text-900 mt-3 mb-2" style={{ textAlign }}>
                            {inlineNodes}
                        </h3>
                    );
                }

                if (line.type === 'h3') {
                    orderedCounter = 1;
                    return (
                        <h4 key={lineIdx} className="text-base md:text-lg font-bold text-900 mt-2 mb-1" style={{ textAlign }}>
                            {inlineNodes}
                        </h4>
                    );
                }

                if (line.type === 'bullet') {
                    orderedCounter = 1;
                    return (
                        <div key={lineIdx} className="flex align-items-start gap-2 mb-1 pl-2" style={{ textAlign }}>
                            <span className="text-primary font-bold text-sm select-none" style={{ lineHeight: '1.75' }}>•</span>
                            <div className="flex-1 line-height-3">{inlineNodes}</div>
                        </div>
                    );
                }

                if (line.type === 'ordered') {
                    const currentIndex = orderedCounter++;
                    return (
                        <div key={lineIdx} className="flex align-items-start gap-2 mb-1 pl-2" style={{ textAlign }}>
                            <span className="text-primary font-bold text-sm select-none" style={{ lineHeight: '1.75' }}>{currentIndex}.</span>
                            <div className="flex-1 line-height-3">{inlineNodes}</div>
                        </div>
                    );
                }

                if (line.type === 'blockquote') {
                    orderedCounter = 1;
                    return (
                        <div key={lineIdx} className="border-left-3 border-primary pl-3 py-1 my-2 bg-blue-50 border-round-right text-700 font-italic" style={{ textAlign }}>
                            {inlineNodes}
                        </div>
                    );
                }

                // 일반 단락 (p)
                orderedCounter = 1;
                return (
                    <p key={lineIdx} className="m-0 mb-2 line-height-3 text-900" style={{ textAlign }}>
                        {inlineNodes}
                    </p>
                );
            });
        }

        // 2. Delta가 없고 content만 있는 경우
        if (content) {
            const isHtml = /<[a-z][\s\S]*>/i.test(content);
            if (isHtml) {
                return <div className="notice-html-content line-height-3" dangerouslySetInnerHTML={{ __html: content }} />;
            }
            // 일반 텍스트의 줄바꿈(\r\n, \n)을 단락으로 분할하여 온전하게 보존
            const lines = content.split(/\r?\n/);
            return lines.map((l, idx) => {
                if (!l.trim()) {
                    return <div key={idx} className="h-1rem" style={{ minHeight: '1.2rem' }}>&nbsp;</div>;
                }
                return (
                    <p key={idx} className="m-0 mb-2 line-height-3 text-900">
                        {l}
                    </p>
                );
            });
        }

        return <div className="text-500 italic p-4 text-center">공지사항 본문 내용이 없습니다.</div>;
    }, [delta, content]);

    return (
        <div
            className="notice-body-container p-3 md:p-4 border-round-xl surface-50"
            style={{
                minHeight: '260px',
                fontSize: '1rem',
                lineHeight: '1.8',
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
                    const allNotices: any[] = res.data || [];

                    // 학생이 소속된 클래스 공지 또는 전체 공지(classIds가 비어있음)만 필터링
                    const studentClassIds = pData?.studentClassIds || [];
                    const filtered = allNotices.filter((n: any) => {
                        if (!n.classIds || n.classIds.length === 0) return true;
                        return n.classIds.some((cid: string) => studentClassIds.includes(cid));
                    });
                    notices = filtered;
                    setNoticeList(filtered);
                } catch (err) {
                    console.error('Failed to fetch notice list:', err);
                } finally {
                    setLoading(false);
                }
            } else {
                setNoticeList(notices);
            }

            // initialNoticeId가 전달된 경우 바로 상세 뷰로 진입
            if (pData?.initialNoticeId) {
                const target = (notices || []).find((n) => n.noticeId === pData.initialNoticeId);
                if (target) {
                    setSelectedNotice(target);
                    setViewMode('detail');
                    try {
                        localStorage.setItem(`notice_read_${target.noticeId}`, 'true');
                    } catch (e) {
                        // ignore
                    }
                }
            } else {
                setViewMode('list');
                setSelectedNotice(null);
            }
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
                {rowData.isNotice && (
                    <span
                        className="p-tag p-tag-success text-xs flex-shrink-0"
                        style={{
                            minWidth: '38px',
                            width: '38px',
                            display: 'inline-flex',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap',
                            textAlign: 'center'
                        }}
                    >
                        공지
                    </span>
                )}
                {!isRead && (
                    <span
                        className="p-tag p-tag-danger text-xs flex-shrink-0"
                        style={{
                            minWidth: '36px',
                            width: '36px',
                            display: 'inline-flex',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap',
                            textAlign: 'center'
                        }}
                    >
                        NEW
                    </span>
                )}
                <span className="font-semibold text-900 line-height-2" style={{ wordBreak: 'break-word' }}>
                    {rowData.title}
                </span>
            </div>
        );
    };

    const dateTemplate = (rowData: any) => {
        return (
            <span className="text-500 text-xs md:text-sm white-space-nowrap flex-shrink-0">
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
            <div className="flex flex-column gap-2 overflow-x-auto w-full">
                <DataTable
                    value={noticeList}
                    rows={10}
                    className="p-datatable-sm"
                    onRowClick={(e) => handleNoticeClick(e.data)}
                    rowClassName={() => 'cursor-pointer hover:surface-100 transition-colors transition-duration-150'}
                    emptyMessage="등록된 공지사항이 없습니다."
                    scrollable
                    tableStyle={{ minWidth: '600px' }}
                >
                    <Column
                        field="title"
                        header="제목"
                        body={titleTemplate}
                        style={{ width: '480px', minWidth: '480px' }}
                    />
                    <Column
                        field="createdDate"
                        header="등록일"
                        body={dateTemplate}
                        style={{ width: '120px', minWidth: '120px', textAlign: 'right' }}
                    />
                </DataTable>
            </div>
        );
    };

    const renderDetail = () => (
        <div className="flex flex-column gap-2 h-full flex-1">
            <div className="flex justify-content-end align-items-center border-bottom-1 surface-border pb-2">
                <span className="text-500 text-xs md:text-sm">
                    {dayjs(selectedNotice?.createdDate).format('YYYY-MM-DD HH:mm')}
                </span>
            </div>

            {/* 공지사항 본문 내용 뷰어: 전체 높이를 최대한 활용 */}
            <div className="flex-1 overflow-y-auto pt-2 line-height-3">
                <NoticeBodyViewer delta={selectedNotice?.delta} content={selectedNotice?.content} />
            </div>
        </div>
    );

    const renderHeader = () => {
        if (viewMode === 'list') {
            return <span className="font-bold text-lg md:text-xl">공지사항 목록</span>;
        }

        return (
            <div className="flex align-items-center gap-2 pr-4 w-full">
                {!pData?.initialNoticeId && (
                    <Button
                        icon="pi pi-arrow-left"
                        text
                        rounded
                        severity="secondary"
                        size="small"
                        className="p-0 flex-shrink-0"
                        style={{ width: '28px', height: '28px' }}
                        onClick={handleBackToList}
                        tooltip="목록으로"
                        tooltipOptions={{ position: 'bottom' }}
                    />
                )}
                {selectedNotice?.isNotice && (
                    <span
                        className="p-tag p-tag-success text-xs flex-shrink-0"
                        style={{
                            minWidth: '38px',
                            width: '38px',
                            display: 'inline-flex',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap',
                            textAlign: 'center'
                        }}
                    >
                        공지
                    </span>
                )}
                <span className="font-bold text-900 text-base md:text-xl line-clamp-1" title={selectedNotice?.title}>
                    {selectedNotice?.title || '공지사항'}
                </span>
            </div>
        );
    };

    return (
        <Dialog
            header={renderHeader()}
            visible={visible}
            style={{
                width: viewMode === 'list' ? '92vw' : '92vw',
                maxWidth: viewMode === 'list' ? '650px' : '850px',
                maxHeight: '92vh'
            }}
            contentStyle={{
                height: viewMode === 'detail' ? '75vh' : 'auto',
                maxHeight: '82vh',
                display: 'flex',
                flexDirection: 'column'
            }}
            onHide={handleClose}
            dismissableMask
        >
            {viewMode === 'list' ? renderList() : renderDetail()}
        </Dialog>
    );
};

export default NoticeModal;
