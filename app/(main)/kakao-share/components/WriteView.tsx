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
import { Class, Student } from '@/types/class';
import { compressImages } from '@/util/imageResizer';
import StudentDropDown from '../../../../components/select/StudentDropDown';
import Lightbox from 'yet-another-react-lightbox';
import Download from 'yet-another-react-lightbox/plugins/download';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import { CustomEditor } from '@/components/editor/CustomEditor';
import { useLightboxHistory } from '@/hooks/useLightboxHistory';

interface WriteViewProps {
    onBack: () => void;
    onSave: (values: any, files: File[]) => Promise<void>;
    initialData?: ShareItem;
    isCopy?: Boolean;
}
const WriteView = ({ onBack, onSave, initialData, isCopy = false }: WriteViewProps) => {
    const [editData, setEditData] = useState<ShareItem>();
    const fileUploadRef = useRef<FileUpload>(null);
    const { showToast } = useToast();
    const http = useHttp();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [classes, setClasses] = useState<Class[]>([]);

    // Lightbox state
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const { handleClose: handleLightboxClose } = useLightboxHistory(lightboxOpen, setLightboxOpen);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const response = await http.get('/choiMath/class/');
                const data = response.data || [];
                setClasses(data);
            } catch (error) {
                console.error('Error fetching classes:', error);
                showToast({
                    severity: 'error',
                    summary: '조회 실패',
                    detail: '클래스 목록을 불러오는데 실패했습니다.'
                });
            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        initialData && setEditData(initialData);
    }, [initialData]);

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
        setIsOptimizing(true);
        try {
            const newValues = {
                ...values,
                ...(editData?.shareImageUrls && {
                    shareImageUrls: editData.shareImageUrls.map((item) => ({
                        ...item,
                        versionInfo: ''
                    }))
                })
            };
            if (selectedFiles) {
                // 이미지 최적화
                const optimizedFiles = await compressImages(selectedFiles, {
                    maxWidth: 1200,
                    maxHeight: 1200,
                    quality: 0.7,
                    maxTotalSize: 4 * 1024 * 1024 // 4MB 제한
                });

                setIsOptimizing(false);
                await onSave(newValues, optimizedFiles);
            } else {
                setIsOptimizing(false);
                await onSave(newValues, []);
            }
        } catch (error) {
            console.error('Optimization error:', error);
            showToast({ severity: 'error', summary: '오류', detail: '이미지 최적화 중 오류가 발생했습니다.' });
        } finally {
            setIsOptimizing(false);
        }
    };

    const validate = (values: any) => {
        const errors: any = {};
        if (!values.studentId) errors.studentId = '필수 입력 항목입니다.';
        if (!values.actualTitle) errors.actualTitle = '필수 입력 항목입니다.';
        if (!values.shareTitle) errors.shareTitle = '필수 입력 항목입니다.';
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

    const handleFinalSubmit = async (e, handleSubmit, errors) => {
        const result = await handleSubmit(e);
        if (!result && Object.keys(errors).length > 0) {
            showToast({ severity: 'error', summary: '입력실패', detail: '입력 항목을 확인해주세요.' });
            return;
        }
    };

    const existingImages = editData?.shareImageUrls?.filter((item) => !item.isDelete);

    const slides = existingImages?.map((item) => ({
        src: typeof item === 'string' ? item : item.url
    }));

    // 이미지 삭제
    const deleteImages = (url) => {
        const delShareImageUrls = editData?.shareImageUrls?.map((item) => {
            if (item.url === url) {
                return {
                    ...item,
                    isDelete: true
                };
            }
            return item;
        });
        editData && setEditData((prev) => ({ ...prev, shareImageUrls: delShareImageUrls }));
    };

    return (
        <div className="card">
            <div className="flex align-items-center mb-4">
                <Button type="button" icon="pi pi-arrow-left" className="p-button-text mr-2" onClick={onBack} />
                <h5>{editData && !isCopy ? '게시글 수정' : '새 게시글 작성'}</h5>
            </div>
            <Form
                onSubmit={onSubmit}
                initialValues={
                    editData
                        ? {
                              classId: !isCopy ? editData.classId : '',
                              shareTitle: editData.shareTitle,
                              shareContent: editData.shareContent,
                              actualTitle: editData.actualTitle,
                              actualContent: editData.actualContent,
                              delta: editData.delta,
                              studentId: !isCopy ? editData.studentId : '',
                              studentName: !isCopy ? editData.studentName : '',
                              telNo: !isCopy ? editData.telNo : '',
                              pTelNo: !isCopy ? editData.pTelNo : ''
                          }
                        : {}
                }
                validate={validate}
                render={({ handleSubmit, submitting, form, errors }) => (
                    <form onSubmit={(e) => handleFinalSubmit(e, handleSubmit, errors)} className="p-fluid grid">
                        <div className="field col-12">
                            <label className="font-bold text-primary">
                                클래스 선택 <span className="text-red-500">*</span>
                            </label>
                            <Field name="classId">
                                {({ input, meta }) => (
                                    <>
                                        <Dropdown
                                            {...input}
                                            className={meta.touched && meta.error ? 'p-invalid' : ''}
                                            options={classes}
                                            optionLabel="className"
                                            optionValue="classId"
                                            dataKey="classId"
                                            showClear
                                            placeholder="클래스를 선택하세요"
                                            onChange={(e) => {
                                                const selectedId = e.value;
                                                const selectedObj = classes.find((c) => c.classId === selectedId);
                                                form.change('classId', selectedId);
                                                setStudents(selectedObj?.students || []);
                                            }}
                                            value={form.getState().values.classId}
                                            disabled={editData && !isCopy ? true : false}
                                        />
                                        {meta.touched && meta.error && <small className="p-error">{meta.error}</small>}
                                    </>
                                )}
                            </Field>
                        </div>

                        <div className="field col-12">
                            <label className="font-bold text-primary">
                                학생 선택 <span className="text-red-500">*</span>
                            </label>
                            <Field name="studentId">
                                {({ input, meta }) => (
                                    <>
                                        <StudentDropDown
                                            {...input}
                                            className={meta.touched && meta.error ? 'p-invalid' : ''}
                                            options={students}
                                            placeholder={
                                                students.length > 0
                                                    ? '학생을 검색하여 선택하세요'
                                                    : '클래스를 먼저 선택하거나 학생을 등록해주세요'
                                            }
                                            onChange={(selectedStudent) => {
                                                if (selectedStudent) {
                                                    console.log('selectedStudent', selectedStudent);
                                                    form.change('studentId', selectedStudent.studentId);
                                                    form.change('studentName', selectedStudent.name);
                                                    form.change('telNo', selectedStudent.phoneNumber || '');
                                                    form.change('pTelNo', selectedStudent.parentPhoneNumber || '');
                                                } else {
                                                    form.change('studentId', undefined);
                                                    form.change('studentName', undefined);
                                                    form.change('telNo', undefined);
                                                    form.change('pTelNo', undefined);
                                                }
                                            }}
                                            value={form.getState().values.studentId}
                                            disabled={students.length === 0 || editData?.classId ? true : false}
                                        />
                                        {meta.touched && meta.error && <small className="p-error">{meta.error}</small>}
                                    </>
                                )}
                            </Field>
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

                        <div className="field col-12 ">
                            <label htmlFor="shareTitle" className="font-bold">
                                카카오 공유 제목
                            </label>
                            <span className="text-red-500">*</span>
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
                                실제 게시글 제목 <span className="text-red-500">*</span>
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
                                        <CustomEditor
                                            value={input.value}
                                            delta={form.getState().values.delta}
                                            onChange={(data) => {
                                                input.onChange(data.textValue);
                                                form.change('delta', data.delta);
                                            }}
                                            placeholder="상세 내용을 입력하세요."
                                        />
                                        {meta.touched && meta.error && <small className="p-error">{meta.error}</small>}
                                    </>
                                )}
                            </Field>
                        </div>
                        <div className="field col-12">
                            <label className="font-bold">이미지 첨부 (최대 5개)</label>
                            {editData && existingImages && existingImages?.length > 0 && (
                                <div className="mb-3 p-3 surface-100 border-round">
                                    <p className="text-sm font-medium text-700 mb-2">
                                        기존 이미지 ({existingImages?.length}개)
                                    </p>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {existingImages?.map((item, idx) => {
                                            const url = typeof item === 'string' ? item : item.url;
                                            const fileName = url.split('/').pop()?.split('?')[0] || `image-${idx}.jpg`;
                                            return (
                                                <div key={idx} className="relative group">
                                                    <img
                                                        src={url}
                                                        alt="prev"
                                                        className="border-round shadow-1 cursor-pointer"
                                                        style={{
                                                            width: '80px',
                                                            height: '80px',
                                                            objectFit: 'cover'
                                                        }}
                                                        onClick={() => {
                                                            setLightboxIndex(idx);
                                                            setLightboxOpen(true);
                                                        }}
                                                    />
                                                    <div
                                                        className="absolute flex gap-1"
                                                        style={{ top: '2px', right: '2px', zIndex: 10 }}
                                                    >
                                                        <Button
                                                            type="button"
                                                            icon="pi pi-download"
                                                            className="p-button-rounded p-button-secondary p-button-sm shadow-2"
                                                            style={{
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
                                                        <Button
                                                            type="button"
                                                            icon="pi pi-times"
                                                            className="p-button-rounded p-button-danger p-button-sm shadow-2"
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                opacity: 0.8
                                                            }}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                deleteImages(url);
                                                            }}
                                                            tooltip="삭제"
                                                            tooltipOptions={{ position: 'bottom' }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-500 mt-2">
                                        * 새로운 파일을 선택하면 기존 이미지에서 추가됩니다.
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
                                label={editData && !isCopy ? '수정 내용 저장' : '새 게시글 등록'}
                                icon={editData && !isCopy ? 'pi pi-save' : 'pi pi-check'}
                                className={editData && !isCopy ? 'p-button-info' : 'p-button-primary'}
                                disabled={submitting || isOptimizing}
                                loading={isOptimizing}
                            />
                        </div>
                    </form>
                )}
            />
            <Lightbox
                open={lightboxOpen}
                zoom={{
                    maxZoomPixelRatio: 3, // 최대 3배까지 확대
                    zoomInMultiplier: 2, // 한 번 클릭 시 확대 배율
                    doubleTapDelay: 300 // 더블 탭 인식 시간
                }}
                close={handleLightboxClose}
                index={lightboxIndex}
                slides={slides}
                plugins={[Download, Zoom]}
            />
        </div>
    );
};

export default WriteView;
