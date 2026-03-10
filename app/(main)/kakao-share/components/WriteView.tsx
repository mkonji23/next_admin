'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Form, Field } from 'react-final-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { FileUpload } from 'primereact/fileupload';
import { Dropdown } from 'primereact/dropdown';
import { useToast } from '@/hooks/useToast';
import { useHttp } from '@/util/axiosInstance';
import { ShareItem } from '../types';
import { Student } from '@/types/class';

interface WriteViewProps {
    onBack: () => void;
    onSave: (values: any, files: File[]) => Promise<void>;
    initialData?: ShareItem | null;
}

const WriteView = ({ onBack, onSave, initialData }: WriteViewProps) => {
    const fileUploadRef = useRef<FileUpload>(null);
    const { showToast } = useToast();
    const http = useHttp();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [students, setStudents] = useState<Student[]>([]);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await http.get('/choiMath/student/getStudentList');
                // 재원 중인 학생만 필터링
                const enrolledStudents = (response.data || []).filter((s: Student) => !s.isWithdrawn);
                setStudents(enrolledStudents);
            } catch (error) {
                console.error('Error fetching students:', error);
            }
        };
        fetchStudents();
    }, []);

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

    const onSubmit = async (values: any) => {
        const { shareTitle, shareContent, actualTitle, actualContent } = values;

        if (!shareTitle || !shareContent || !actualTitle || !actualContent) {
            showToast({ severity: 'warn', summary: '입력 확인', detail: '모든 필드를 입력해주세요.' });
            return;
        }

        await onSave(values, selectedFiles);
    };

    const validate = (values: any) => {
        const errors: any = {};
        if (!values.actualTitle) errors.actualTitle = '필수 입력 항목입니다.';
        if (!values.shareTitle) errors.shareTitle = '필수 입력 항목입니다.';
        if (!values.shareContent) errors.shareContent = '필수 입력 항목입니다.';
        if (!values.actualContent) errors.actualContent = '필수 입력 항목입니다.';
        return errors;
    };

    const onFileSelect = (e: { files: File[] }) => {
        const newFiles = e.files;
        const currentFiles = selectedFiles;

        const uniqueNewFiles = newFiles.filter(
            (nf) => !currentFiles.some((cf) => cf.name === nf.name && cf.size === nf.size)
        );

        let updatedFiles = [...currentFiles, ...uniqueNewFiles];

        if (updatedFiles.length > 5) {
            showToast({
                severity: 'warn',
                summary: '업로드 제한',
                detail: '파일은 최대 5개까지 업로드할 수 있습니다.'
            });
            updatedFiles = updatedFiles.slice(0, 5);
            fileUploadRef.current?.setFiles(updatedFiles);
        }
        setSelectedFiles(updatedFiles);
    };

    const onFileRemove = (e: { file: File }) => {
        const remainingFiles = selectedFiles.filter((f) => f.name !== e.file.name || f.size !== e.file.size);
        setSelectedFiles(remainingFiles);
    };

    const onClear = () => {
        setSelectedFiles([]);
    };

    const studentOptions = students.map((s) => ({
        label: `${s.name} (${s.grade} / ${s.school})`,
        value: s.studentId,
        student: s
    }));

    return (
        <div className="card">
            <div className="flex align-items-center mb-4">
                <Button type="button" icon="pi pi-arrow-left" className="p-button-text mr-2" onClick={onBack} />
                <h5>{initialData ? '게시글 수정' : '새 게시글 작성'}</h5>
            </div>

            <Form
                onSubmit={onSubmit}
                initialValues={
                    initialData
                        ? {
                              shareTitle: initialData.shareTitle,
                              shareContent: initialData.shareContent,
                              actualTitle: initialData.actualTitle,
                              actualContent: initialData.actualContent,
                              studentId: initialData.studentId,
                              studentName: initialData.studentName,
                              telNo: initialData.telNo,
                              pTelNo: initialData.pTelNo
                          }
                        : {}
                }
                validate={validate}
                render={({ handleSubmit, submitting, form }) => (
                    <form onSubmit={handleSubmit} className="p-fluid grid">
                        {/* 학생 선택 섹션 */}
                        <div className="field col-12">
                            <label className="font-bold text-primary">공유 대상 학생 선택</label>
                            <Dropdown
                                options={studentOptions}
                                filter
                                showClear
                                placeholder="학생을 검색하여 선택하세요"
                                onChange={(e) => {
                                    if (e.value) {
                                        const s = students.find((std) => std.studentId === e.value);
                                        if (s) {
                                            form.change('studentId', s.studentId);
                                            form.change('studentName', s.name);
                                            form.change('telNo', s.phoneNumber || '');
                                            form.change('pTelNo', s.parentPhoneNumber || '');
                                        }
                                    } else {
                                        form.change('studentId', undefined);
                                        form.change('studentName', undefined);
                                        form.change('telNo', undefined);
                                        form.change('pTelNo', undefined);
                                    }
                                }}
                                value={form.getState().values.studentId}
                            />
                        </div>

                        <div className="field col-12 md:col-3">
                            <label htmlFor="studentId" className="font-bold">
                                학생 ID
                            </label>
                            <Field name="studentId">
                                {({ input }) => (
                                    <InputText {...input} id="studentId" readOnly className="bg-gray-100" />
                                )}
                            </Field>
                        </div>
                        <div className="field col-12 md:col-3">
                            <label htmlFor="studentName" className="font-bold">
                                학생 이름
                            </label>
                            <Field name="studentName">{({ input }) => <InputText {...input} id="studentName" />}</Field>
                        </div>
                        <div className="field col-12 md:col-3">
                            <label htmlFor="telNo" className="font-bold">
                                학생 연락처
                            </label>
                            <Field name="telNo">{({ input }) => <InputText {...input} id="telNo" />}</Field>
                        </div>
                        <div className="field col-12 md:col-3">
                            <label htmlFor="pTelNo" className="font-bold">
                                학부모 연락처
                            </label>
                            <Field name="pTelNo">{({ input }) => <InputText {...input} id="pTelNo" />}</Field>
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="shareTitle" className="font-bold">
                                카카오 공유 제목
                            </label>
                            <Field name="shareTitle">
                                {({ input, meta }) => (
                                    <>
                                        <InputText
                                            {...input}
                                            id="shareTitle"
                                            placeholder="카카오톡 링크 제목"
                                            className={meta.touched && meta.error ? 'p-invalid' : ''}
                                        />
                                        {meta.touched && meta.error && <small className="p-error">{meta.error}</small>}
                                    </>
                                )}
                            </Field>
                        </div>
                        <div className="field col-12">
                            <label htmlFor="shareContent" className="font-bold">
                                카카오 공유 설명
                            </label>
                            <Field name="shareContent">
                                {({ input, meta }) => (
                                    <>
                                        <InputText
                                            {...input}
                                            id="shareContent"
                                            placeholder="카카오톡 링크 설명"
                                            className={meta.touched && meta.error ? 'p-invalid' : ''}
                                        />
                                        {meta.touched && meta.error && <small className="p-error">{meta.error}</small>}
                                    </>
                                )}
                            </Field>
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="actualTitle" className="font-bold">
                                실제 게시글 제목
                            </label>
                            <Field name="actualTitle">
                                {({ input, meta }) => (
                                    <>
                                        <InputText
                                            {...input}
                                            id="actualTitle"
                                            placeholder="앱 내에서 보여질 제목"
                                            className={meta.touched && meta.error ? 'p-invalid' : ''}
                                        />
                                        {meta.touched && meta.error && <small className="p-error">{meta.error}</small>}
                                    </>
                                )}
                            </Field>
                        </div>
                        <div className="field col-12">
                            <label htmlFor="actualContent" className="font-bold">
                                게시글 상세 내용
                            </label>
                            <Field name="actualContent">
                                {({ input, meta }) => (
                                    <>
                                        <InputTextarea
                                            {...input}
                                            id="actualContent"
                                            rows={10}
                                            placeholder="상세 내용을 입력하세요."
                                            className={meta.touched && meta.error ? 'p-invalid' : ''}
                                        />
                                        {meta.touched && meta.error && <small className="p-error">{meta.error}</small>}
                                    </>
                                )}
                            </Field>
                        </div>
                        <div className="field col-12">
                            <label className="font-bold">이미지 첨부 (최대 5개)</label>
                            {initialData && initialData.shareImageUrls?.length > 0 && (
                                <div className="mb-3 p-3 surface-100 border-round">
                                    <p className="text-sm font-medium text-700 mb-2">
                                        기존 이미지 ({initialData.shareImageUrls.length}개)
                                    </p>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {initialData.shareImageUrls.map((item, idx) => {
                                            const url = typeof item === 'string' ? item : item.url;
                                            const fileName = url.split('/').pop()?.split('?')[0] || `image-${idx}.jpg`;
                                            return (
                                                <div key={idx} className="relative group">
                                                    <img
                                                        src={url}
                                                        alt="prev"
                                                        className="border-round shadow-1"
                                                        style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        icon="pi pi-download"
                                                        className="p-button-rounded p-button-secondary p-button-sm absolute shadow-2"
                                                        style={{
                                                            top: '2px',
                                                            right: '2px',
                                                            width: '24px',
                                                            height: '24px',
                                                            opacity: 0.8
                                                        }}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleDownload(url, fileName);
                                                        }}
                                                        tooltip="다운로드"
                                                        tooltipOptions={{ position: 'bottom' }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-500 mt-2">
                                        * 새로운 파일을 선택하면 기존 이미지는 모두 대체됩니다.
                                    </p>
                                </div>
                            )}
                            <FileUpload
                                ref={fileUploadRef}
                                name="files"
                                multiple
                                accept="image/*"
                                maxFileSize={25000000}
                                onSelect={onFileSelect}
                                onClear={onClear}
                                onRemove={onFileRemove}
                                emptyTemplate={<p className="m-0 text-500">파일을 드래그하거나 선택하세요.</p>}
                                customUpload
                                auto={false}
                                uploadOptions={{ style: { display: 'none' } }}
                                cancelOptions={{ style: { display: 'none' } }}
                            />
                        </div>
                        <div className="col-12 mt-4">
                            <Button
                                type="submit"
                                label={initialData ? '수정 내용 저장' : '새 게시글 등록'}
                                icon={initialData ? 'pi pi-save' : 'pi pi-check'}
                                className={initialData ? 'p-button-info' : 'p-button-primary'}
                                disabled={submitting}
                            />
                        </div>
                    </form>
                )}
            />
        </div>
    );
};

export default WriteView;
