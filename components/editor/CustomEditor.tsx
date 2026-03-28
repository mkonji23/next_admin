import React, { useEffect, useRef, useState } from 'react';
import { Editor, EditorTextChangeEvent } from 'primereact/editor';
import Quill from 'quill';

interface CustomEditorProps {
    value?: string;
    delta?: any;
    onChange?: (data: { textValue: string; delta: any }) => void;
    style?: React.CSSProperties;
    placeholder?: string;
    readOnly?: boolean;
}

export const CustomEditor = ({ value, delta, onChange, style, placeholder, readOnly }: CustomEditorProps) => {
    const contentRef = useRef<Editor>(null);
    const editorLoad = useRef(false);
    const [source, setSource] = useState('');

    // 에디터 로드 시 1회 실행
    const handleLoad = (quill: Quill) => {
        editorLoad.current = true;
        const container = quill.root;
        container.setAttribute('spellcheck', 'false');

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
            setSource(e.source);
        }
    };

    const renderHeader = () => {
        return (
            <span className="ql-formats">
                {/* 폰트 사이즈 드롭다운 (숫자로 표시됨) */}
                <select className="ql-size" title="글자 크기" defaultValue="">
                    <option value="small">작게</option>
                    {/* value가 비어있으면 Quill은 'normal(기본)'으로 인식합니다 */}
                    <option value="">보통</option>
                    <option value="large">크게</option>
                    <option value="huge">더 크게</option>
                </select>

                {/* 기본 서식 버튼들 (이미지 제외) */}
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

                {/* 지우기 */}
                <button className="ql-clean" title="서식 지우기"></button>
            </span>
        );
    };

    const header = renderHeader();

    // 외부에서 데이터(todo 등)가 변경되었을 때 에디터 내용 동기화
    useEffect(() => {
        if (contentRef.current && editorLoad.current) {
            const quill = contentRef.current.getQuill();
            if (quill && source !== 'user') {
                let parsedDelta = delta;
                if (typeof delta === 'string') {
                    try {
                        parsedDelta = JSON.parse(delta);
                    } catch (e) {
                        console.error('Failed to parse delta', e);
                    }
                }
                const ops = parsedDelta?.ops ? parsedDelta.ops : [{ insert: value || '' }];
                // 현재 에디터 내용과 새로 들어온 내용이 다를 때만 업데이트 (무한 루프 방지)
                quill.setContents(ops, 'api');
            }
        }
    }, [value, delta]);

    return (
        <Editor
            ref={contentRef}
            style={style || { height: '320px' }}
            className={readOnly ? 'hide-toolbar' : ''}
            headerTemplate={header}
            onTextChange={handleTextChanged}
            onLoad={handleLoad}
            placeholder={placeholder}
            readOnly={readOnly}
        />
    );
};
