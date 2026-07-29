import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Editor, EditorTextChangeEvent } from 'primereact/editor';
import { Button } from 'primereact/button';
import Quill from 'quill';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { compressImage } from '@/util/imageResizer';

interface CustomEditorProps {
    value?: string;
    delta?: any;
    onChange?: (data: { textValue: string; delta: any }) => void;
    style?: React.CSSProperties;
    placeholder?: string;
    readOnly?: boolean;
}

export interface CustomEditorRef {
    insertText: (text: string) => void;
    getQuill: () => Quill | null;
    uploadPendingImages: () => Promise<{ textValue: string; delta: any; uploadedImages: any[] }>;
    deleteImagesFromImageKit: (fileIds: (string | { fileId?: string; url?: string })[]) => Promise<boolean>;
    deleteRemovedImages: (oldImages: (string | { fileId?: string; url?: string })[]) => Promise<boolean>;
}

// base64 Data URL을 File 객체로 변환하는 헬퍼
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

// eslint-disable-next-line react/display-name
export const CustomEditor = forwardRef<CustomEditorRef, CustomEditorProps>(
    ({ value, delta, onChange, style, placeholder, readOnly }, ref) => {
        const contentRef = useRef<Editor>(null);
        const editorLoad = useRef(false);
        const isProcessingRef = useRef(false);
        const http = useHttp();
        const { showToast } = useToast();

        // ImageKit 서버 일괄 업로드 헬퍼 (단 1번의 HTTP 요청으로 모든 파일 일괄 업로드)
        const uploadImagesToImageKit = async (files: File[]): Promise<any[]> => {
            if (!files || files.length === 0) return [];
            try {
                const formData = new FormData();
                files.forEach((file) => {
                    formData.append('files', file);
                });
                formData.append('folder', '/');

                const res = await http.post('/imageKit/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                if (res.data && Array.isArray(res.data)) {
                    return res.data;
                } else if (res.data && res.data.url) {
                    return [res.data];
                }
                showToast({
                    severity: 'error',
                    summary: '업로드 실패',
                    detail: '이미지 업로드 응답이 올바르지 않습니다.'
                });
                return [];
            } catch (error: any) {
                console.error('ImageKit upload error:', error);
                showToast({
                    severity: 'error',
                    summary: '업로드 실패',
                    detail: '이미지 업로드 중 오류가 발생했습니다.'
                });
                return [];
            }
        };

        // ImageKit 서버 이미지 삭제 헬퍼 (fileId, URL, 객체 배열 지원)
        const deleteImagesFromImageKit = async (
            fileIds: (string | { fileId?: string; url?: string })[]
        ): Promise<boolean> => {
            if (!fileIds || fileIds.length === 0) return true;

            const targets = fileIds
                .map((item) => {
                    if (typeof item === 'object' && item) {
                        return item.fileId || item.url || null;
                    }
                    return item;
                })
                .filter((val): val is string => Boolean(val));

            if (targets.length === 0) return true;

            try {
                await http.post('/imageKit/delete', { fileIds: targets });
                return true;
            } catch (error: any) {
                console.error('ImageKit delete error:', error);
                showToast({
                    severity: 'error',
                    summary: '삭제 실패',
                    detail: '이미지 삭제 처리 중 오류가 발생했습니다.'
                });
                return false;
            }
        };

        // 기존 이미지 목록과 비교하여 본문에서 삭제된 이미지를 ImageKit에서 자동 삭제하는 헬퍼
        const deleteRemovedImages = async (
            oldImages: (string | { fileId?: string; url?: string })[]
        ): Promise<boolean> => {
            if (!oldImages || oldImages.length === 0) return true;

            const quill = contentRef.current?.getQuill();
            if (!quill) return true;

            const contents = quill.getContents();
            const currentUrls: string[] = [];
            if (contents.ops) {
                for (const op of contents.ops) {
                    if (op.insert && typeof op.insert === 'object' && (op.insert as any).image) {
                        currentUrls.push((op.insert as any).image);
                    }
                }
            }

            const itemsToDelete: (string | { fileId?: string; url?: string })[] = [];

            for (const img of oldImages) {
                const url = typeof img === 'string' ? img : img.url;
                if (url && !currentUrls.includes(url)) {
                    itemsToDelete.push(img);
                }
            }

            if (itemsToDelete.length > 0) {
                return await deleteImagesFromImageKit(itemsToDelete);
            }
            return true;
        };

        // 저장 시점에 호출: 에디터 내의 모든 base64 이미지를 1번의 HTTP 요청으로 배치 업로드 및 URL 교체
        const uploadPendingImages = async (): Promise<{ textValue: string; delta: any; uploadedImages: any[] }> => {
            const quill = contentRef.current?.getQuill();
            if (!quill) return { textValue: '', delta: null, uploadedImages: [] };

            const contents = quill.getContents();
            if (!contents.ops) return { textValue: quill.getText(), delta: contents, uploadedImages: [] };

            // 1. base64 이미지 오퍼레이션 타겟 및 파일 수집
            const pendingTargets: { opIndex: number; rawFile: File }[] = [];

            contents.ops.forEach((op, index) => {
                if (op.insert && typeof op.insert === 'object' && (op.insert as any).image) {
                    const src = (op.insert as any).image;
                    if (typeof src === 'string' && src.startsWith('data:image/')) {
                        const rawFile = dataURLtoFile(src, `editor_image_${Date.now()}_${index}.png`);
                        pendingTargets.push({ opIndex: index, rawFile });
                    }
                }
            });

            if (pendingTargets.length === 0) {
                return { textValue: quill.getText(), delta: contents, uploadedImages: [] };
            }

            isProcessingRef.current = true;
            try {
                // 2. 모든 이미지 병렬 압축 처리 (Promise.all)
                const compressedFiles = await Promise.all(
                    pendingTargets.map((item) =>
                        compressImage(item.rawFile, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 })
                    )
                );

                // 3. 단 1회의 batch POST 요청으로 ImageKit에 일괄 업로드
                const uploadedResults = await uploadImagesToImageKit(compressedFiles);

                if (uploadedResults.length === 0) {
                    return { textValue: quill.getText(), delta: contents, uploadedImages: [] };
                }

                // 4. 업로드된 URL로 delta ops 일괄 교체
                const newOps = [...contents.ops];
                const uploadedImages: any[] = [];

                pendingTargets.forEach((target, i) => {
                    const uploadedItem = uploadedResults[i];
                    if (uploadedItem && uploadedItem.url) {
                        const originalOp = newOps[target.opIndex];
                        newOps[target.opIndex] = {
                            ...originalOp,
                            insert: { ...(originalOp.insert as any), image: uploadedItem.url }
                        };
                        uploadedImages.push(uploadedItem);
                    }
                });

                const sel = quill.getSelection();
                quill.setContents(newOps as any, 'api');
                if (sel) {
                    quill.setSelection(sel.index, sel.length, 'api');
                }

                const updatedDelta = quill.getContents();
                const updatedText = quill.getText();
                onChange && onChange({ textValue: updatedText, delta: updatedDelta });

                return {
                    textValue: updatedText,
                    delta: updatedDelta,
                    uploadedImages
                };
            } catch (err) {
                console.error('Failed to upload pending images:', err);
                return { textValue: quill.getText(), delta: contents, uploadedImages: [] };
            } finally {
                isProcessingRef.current = false;
            }
        };

        // 로컬 미리보기용 Data URL 삽입 헬퍼 (이미지 최적화/압축 적용)
        const insertLocalImagePreview = async (quill: Quill, file: File) => {
            try {
                const optimizedFile = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 });
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target?.result as string;
                    if (dataUrl) {
                        const range = quill.getSelection(true);
                        const index = range ? range.index : quill.getLength();
                        quill.insertEmbed(index, 'image', dataUrl, 'user');
                        quill.setSelection(index + 1, 0, 'user');

                        const fullDelta = quill.getContents();
                        onChange && onChange({ textValue: quill.getText(), delta: fullDelta });
                    }
                };
                reader.readAsDataURL(optimizedFile);
            } catch (err) {
                console.error('Image compression failed, using original file:', err);
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target?.result as string;
                    if (dataUrl) {
                        const range = quill.getSelection(true);
                        const index = range ? range.index : quill.getLength();
                        quill.insertEmbed(index, 'image', dataUrl, 'user');
                        quill.setSelection(index + 1, 0, 'user');

                        const fullDelta = quill.getContents();
                        onChange && onChange({ textValue: quill.getText(), delta: fullDelta });
                    }
                };
                reader.readAsDataURL(file);
            }
        };

        // 부모 컴포넌트에 메서드 노출
        useImperativeHandle(ref, () => ({
            insertText: (text: string) => {
                const quill = contentRef.current?.getQuill();
                if (quill) {
                    const range = quill.getSelection(true);
                    quill.insertText(range.index, text, 'user');
                    quill.setSelection(range.index + text.length, 0, 'user');
                }
            },
            getQuill: () => contentRef.current?.getQuill() || null,
            uploadPendingImages,
            deleteImagesFromImageKit,
            deleteRemovedImages
        }));

        // 에디터 로드 시 1회 실행
        const handleLoad = (quill: Quill) => {
            editorLoad.current = true;
            const container = quill.root;
            container.setAttribute('spellcheck', 'false');

            // 1. 툴바 이미지 버튼 클릭 시 로컬 미리보기 삽입 (업로드는 저장 시점)
            const toolbar = quill.getModule('toolbar') as any;
            if (toolbar) {
                toolbar.addHandler('image', () => {
                    const input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('accept', 'image/*');
                    input.click();

                    input.onchange = () => {
                        const file = input.files ? input.files[0] : null;
                        if (file) {
                            insertLocalImagePreview(quill, file);
                        }
                    };
                });
            }

            // 2. 드래그 앤 드롭 필수 이벤트 (dragover)
            container.addEventListener(
                'dragover',
                (event: DragEvent) => {
                    event.preventDefault();
                },
                true
            );

            // 3. 드래그 앤 드롭 이미지 로컬 미리보기 삽입 (Capture 단계)
            container.addEventListener(
                'drop',
                (event: DragEvent) => {
                    const files = event.dataTransfer?.files;
                    if (files && files.length > 0) {
                        const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
                        if (imageFiles.length > 0) {
                            event.preventDefault();
                            event.stopPropagation();

                            for (const file of imageFiles) {
                                insertLocalImagePreview(quill, file);
                            }
                        }
                    }
                },
                true
            );

            // 4. 클립보드 붙여넣기(Paste) 이미지 로컬 미리보기 삽입 (Capture 단계)
            container.addEventListener(
                'paste',
                (event: ClipboardEvent) => {
                    const items = event.clipboardData?.items;
                    if (items) {
                        const imageFiles: File[] = [];
                        for (let i = 0; i < items.length; i++) {
                            if (items[i].type.startsWith('image/')) {
                                const file = items[i].getAsFile();
                                if (file) imageFiles.push(file);
                            }
                        }

                        if (imageFiles.length > 0) {
                            event.preventDefault();
                            event.stopPropagation();

                            for (const file of imageFiles) {
                                insertLocalImagePreview(quill, file);
                            }
                        }
                    }
                },
                true
            );

            // 초기 로드 시 값이 있다면 설정
            if (delta || value) {
                let parsedDelta = delta;
                if (typeof delta === 'string') {
                    try {
                        parsedDelta = JSON.parse(delta);
                    } catch (e) {
                        console.error('Failed to parse delta', e);
                    }
                }
                const defaultData = parsedDelta?.ops ? parsedDelta.ops : [{ insert: value || '' }];
                quill.setContents(defaultData, 'api');
            }
        };

        const handleTextChanged = (e: EditorTextChangeEvent) => {
            if (e.source === 'user') {
                const quill = contentRef.current?.getQuill();
                const fullDelta = quill?.getContents();
                onChange &&
                    onChange({
                        textValue: e.textValue || '',
                        delta: fullDelta
                    });
            }
        };

        const [editorHeight, setEditorHeight] = useState<number>(420);
        const [compactImages, setCompactImages] = useState<boolean>(false);
        const isResizingRef = useRef(false);
        const startYRef = useRef(0);
        const startHeightRef = useRef(420);

        // 마우스 드래그 높이 조절 핸들러 (하단)
        const handleMouseDown = (e: React.MouseEvent) => {
            e.preventDefault();
            isResizingRef.current = true;
            startYRef.current = e.clientY;
            startHeightRef.current = editorHeight;

            const handleMouseMove = (moveEvent: MouseEvent) => {
                if (!isResizingRef.current) return;
                const deltaY = moveEvent.clientY - startYRef.current;
                const newHeight = Math.max(180, Math.min(1200, startHeightRef.current + deltaY));
                setEditorHeight(newHeight);
            };

            const handleMouseUp = () => {
                isResizingRef.current = false;
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };

            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        };

        // 마우스 드래그 높이 조절 핸들러 (상단)
        const handleMouseDownTop = (e: React.MouseEvent) => {
            e.preventDefault();
            isResizingRef.current = true;
            startYRef.current = e.clientY;
            startHeightRef.current = editorHeight;

            const handleMouseMove = (moveEvent: MouseEvent) => {
                if (!isResizingRef.current) return;
                const deltaY = startYRef.current - moveEvent.clientY; // 상단 끌기는 위로 끌 때 높이 증가
                const newHeight = Math.max(180, Math.min(1200, startHeightRef.current + deltaY));
                setEditorHeight(newHeight);
            };

            const handleMouseUp = () => {
                isResizingRef.current = false;
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };

            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        };

        const renderHeader = () => {
            return (
                <div className="flex flex-wrap align-items-center justify-content-between gap-2 border-bottom-1 surface-border p-2">
                    <span className="ql-formats flex align-items-center flex-wrap gap-1">
                        {/* 폰트 사이즈 드롭다운 */}
                        <select className="ql-size" title="글자 크기" defaultValue="">
                            <option value="small">작게</option>
                            <option value="">보통</option>
                            <option value="large">크게</option>
                            <option value="huge">더 크게</option>
                        </select>

                        {/* 기본 서식 버튼들 */}
                        <button className="ql-bold" aria-label="Bold" title="굵게"></button>
                        <button className="ql-italic" aria-label="Italic" title="기울임"></button>
                        <button className="ql-underline" aria-label="Underline" title="밑줄"></button>
                        <button className="ql-strike" aria-label="Strike" title="취소선"></button>

                        {/* 색상 설정 */}
                        <select className="ql-color" title="글자 색상"></select>
                        <select className="ql-background" title="배경 색상"></select>

                        {/* 정렬 및 리스트 */}
                        <button className="ql-list" value="ordered" title="번호 리스트"></button>
                        <button className="ql-list" value="bullet" title="불렛 리스트"></button>
                        <select className="ql-align" title="정렬"></select>

                        {/* 이미지 버튼 */}
                        <button className="ql-image" aria-label="Image" title="이미지 추가"></button>

                        {/* 서식 지우기 */}
                        <button className="ql-clean" title="서식 지우기"></button>
                    </span>

                    {/* 에디터 우측 이미지 축소 모드 컨트롤 영역 */}
                    <div className="flex align-items-center gap-2">
                        {/* 이미지 축소 보기 모드 토글 (PrimeReact 표준 icon 규격 적용) */}
                        <Button
                            type="button"
                            label={compactImages ? '이미지 원본뷰' : '이미지 축소뷰'}
                            icon={compactImages ? 'pi pi-images' : 'pi pi-image'}
                            severity={compactImages ? 'success' : 'danger'}
                            outlined={true}
                            size="small"
                            className="compact-toggle-btn p-button-sm"
                            onClick={() => setCompactImages(!compactImages)}
                            title={
                                compactImages
                                    ? '이미지 원본 크기로 렌더링'
                                    : '이미지를 썸네일 크기로 축소하여 텍스트 작성 용이'
                            }
                        />
                    </div>
                </div>
            );
        };

        const header = renderHeader();

        // 외부에서 데이터(todo 등)가 변경되었을 때 에디터 내용 동기화
        useEffect(() => {
            if (contentRef.current && editorLoad.current) {
                const quill = contentRef.current.getQuill();
                if (quill) {
                    let parsedDelta = delta;
                    if (typeof delta === 'string' && delta.trim() !== '') {
                        try {
                            parsedDelta = JSON.parse(delta);
                        } catch (e) {
                            // JSON 형식이 아니면 일반 텍스트로 처리될 것이므로 무시
                        }
                    }
                    const newOps = parsedDelta?.ops ? parsedDelta.ops : [{ insert: value || '' }];
                    const currentContents = quill.getContents();

                    // 현재 에디터 내용과 새로 들어온 내용이 다를 때만 업데이트 (무한 루프 및 커서 튐 방지)
                    if (JSON.stringify(currentContents.ops) !== JSON.stringify(newOps)) {
                        quill.setContents(newOps, 'api');
                    }
                }
            }
        }, [value, delta, editorLoad.current]);

        return (
            <div className={`custom-editor-wrapper ${compactImages ? 'compact-images' : ''}`}>
                <style jsx global>{`
                    .custom-editor-wrapper .ql-toolbar button.compact-toggle-btn,
                    .custom-editor-wrapper .compact-toggle-btn {
                        width: auto !important;
                        height: 30px !important;
                        padding: 0 10px !important;
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        white-space: nowrap !important;
                        font-size: 12px !important;
                        float: none !important;
                    }
                    .custom-editor-wrapper .compact-toggle-btn .p-button-icon,
                    .custom-editor-wrapper .compact-toggle-btn i {
                        font-size: 14px !important;
                        margin-right: 6px !important;
                        color: inherit !important;
                        display: inline-block !important;
                    }
                    .custom-editor-wrapper .ql-editor img {
                        max-width: 100%;
                        height: auto;
                        max-height: 400px;
                        object-fit: contain;
                        border-radius: 6px;
                        margin: 8px 0;
                        transition: max-height 0.2s ease-in-out;
                    }
                    .custom-editor-wrapper.compact-images .ql-editor img {
                        max-height: 150px !important;
                        object-fit: contain;
                        border: 2px dashed #3b82f6;
                        padding: 2px;
                        background: #f0fdf4;
                    }
                    .editor-resize-handle {
                        user-select: none;
                    }
                    .editor-resize-handle:hover {
                        background-color: #cbd5e1 !important;
                    }
                `}</style>
                {!readOnly && (
                    <div
                        className="editor-resize-handle top-handle flex align-items-center justify-content-center surface-200 py-1 border-top-1 border-300"
                        onMouseDown={handleMouseDownTop}
                        style={{ cursor: 'ns-resize', width: '100%', borderBottom: '1px solid #e2e8f0' }}
                        title="드래그하여 에디터 높이 조절 (상단 드래그)"
                    >
                        <div
                            style={{ width: '48px', height: '4px', borderRadius: '2px', backgroundColor: '#94a3b8' }}
                        ></div>
                    </div>
                )}
                <Editor
                    ref={contentRef}
                    style={readOnly ? style : { height: `${editorHeight}px`, ...style }}
                    className={readOnly ? 'hide-toolbar' : ''}
                    headerTemplate={header}
                    onTextChange={handleTextChanged}
                    onLoad={handleLoad}
                    placeholder={placeholder}
                    readOnly={readOnly}
                />
                {!readOnly && (
                    <div
                        className="editor-resize-handle bottom-handle flex align-items-center justify-content-center surface-200 py-1 border-bottom-1 border-300"
                        onMouseDown={handleMouseDown}
                        style={{ cursor: 'ns-resize', width: '100%', borderTop: '1px solid #e2e8f0' }}
                        title="드래그하여 에디터 높이 조절 (하단 드래그)"
                    >
                        <div
                            style={{ width: '48px', height: '4px', borderRadius: '2px', backgroundColor: '#94a3b8' }}
                        ></div>
                    </div>
                )}
            </div>
        );
    }
);
