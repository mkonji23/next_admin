'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import { Class } from '@/types/class';

interface WeekSchedule {
    studentId: string;
    studentName: string;
    grade: string;
    school: string;
    counselingStudent: string;
    counselingParent: string;
    bookFee: string;
    consultation: string;
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
    sun: string;
    class?: Class[];
    description?: string;
    [key: string]: any;
}

const WeekSchedulePage = () => {
    const [schedules, setSchedules] = useState<WeekSchedule[]>([]);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof WeekSchedule; direction: 'asc' | 'desc' } | null>(null);

    const [viewMode, setViewMode] = useState<'grid' | 'text'>('grid');

    const http = useHttp();
    const { showToast } = useToast();
    const { showConfirm } = useConfirm();

    const fetchSchedules = useCallback(async () => {
        try {
            const response = await http.get('/choiMath/weekSchedule/getWeekScheduleList');
            setSchedules(response.data || []);
        } catch (error: any) {
            console.error('Error fetching week schedules:', error);
            showToast({
                severity: 'error',
                summary: '조회 실패',
                detail: '주간 시간표를 불러오는데 실패했습니다.'
            });
        }
    }, []);

    const handleSync = async () => {
        try {
            await http.post('/choiMath/weekSchedule/syncWeekSchedule');
            showToast({
                severity: 'success',
                summary: '동기화 성공',
                detail: '학생 목록과 시간표가 동기화되었습니다.'
            });
            fetchSchedules();
        } catch (error: any) {
            console.error('Error syncing schedules:', error);
            showToast({
                severity: 'error',
                summary: '동기화 실패',
                detail: '시간표 동기화에 실패했습니다.'
            });
        }
    };

    const handleReset = async () => {
        const confirmed = await showConfirm({
            header: '시간표 초기화',
            message: '초기값으로 되돌리시겠습니까? (상담: 미완료, 나머지: 빈값. 저장 버튼을 눌러야 반영됩니다.)',
            icon: 'pi pi-exclamation-circle'
        });

        if (confirmed) {
            setSchedules((prev) =>
                prev.map((s) => ({
                    ...s,
                    counselingStudent: '미완료',
                    counselingParent: '미완료',
                    bookFee: '',
                    consultation: '',
                    mon: '',
                    tue: '',
                    wed: '',
                    thu: '',
                    fri: '',
                    sat: '',
                    sun: ''
                }))
            );
            showToast({
                severity: 'info',
                summary: '초기화 완료',
                detail: '데이터가 초기화되었습니다. 저장하려면 저장 버튼을 눌러주세요.'
            });
        }
    };

    const handleSave = async () => {
        try {
            await http.post('/choiMath/weekSchedule/updateWeekSchedule', { data: schedules });
            showToast({
                severity: 'success',
                summary: '저장 성공',
                detail: '시간표가 저장되었습니다.'
            });
        } catch (error: any) {
            console.error('Error saving schedules:', error);
            showToast({
                severity: 'error',
                summary: '저장 실패',
                detail: '시간표 저장에 실패했습니다.'
            });
        }
    };

    const handleUpdate = useCallback((studentId: string, field: string, value: string) => {
        setSchedules((prev) => prev.map((item) => (item.studentId === studentId ? { ...item, [field]: value } : item)));
    }, []);

    const toggleCounseling = (studentId: string, field: string, currentValue: string) => {
        const newValue = currentValue === '상담완료' ? '미완료' : '상담완료';
        handleUpdate(studentId, field, newValue);
    };

    const handleKeyDown = (
        e: React.KeyboardEvent,
        studentId: string,
        index: number,
        field: string,
        totalRows: number
    ) => {
        if (e.key === 'Enter') {
            if (e.altKey) {
                e.preventDefault();
                const target = e.target as HTMLTextAreaElement;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                const value = target.value;
                const newValue = value.substring(0, start) + '\n' + value.substring(end);

                handleUpdate(studentId, field, newValue);

                setTimeout(() => {
                    target.selectionStart = target.selectionEnd = start + 1;
                }, 0);
                return;
            }

            e.preventDefault();
            const nextIndex = index + 1;
            if (nextIndex < totalRows) {
                const nextInput = document.getElementById(`input-${nextIndex}-${field}`);
                if (nextInput) {
                    (nextInput as HTMLElement).focus();
                    if (nextInput instanceof HTMLTextAreaElement) {
                        nextInput.select();
                    }
                }
            }
        }
    };

    const requestSort = (key: keyof WeekSchedule) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: keyof WeekSchedule) => {
        if (!sortConfig || sortConfig.key !== key) return 'pi pi-sort-alt';
        return sortConfig.direction === 'asc' ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down';
    };

    const processedSchedules = useMemo(() => {
        let result = [...schedules];

        if (globalFilterValue) {
            const lowerValue = globalFilterValue.toLowerCase();
            result = result.filter((s) =>
                Object.entries(s).some(([key, val]) => {
                    if (key === 'studentId') return false;
                    return val && val.toString().toLowerCase().includes(lowerValue);
                })
            );
        }

        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = (a[sortConfig.key] || '').toString();
                const bValue = (b[sortConfig.key] || '').toString();
                return sortConfig.direction === 'asc'
                    ? aValue.localeCompare(bValue, 'ko')
                    : bValue.localeCompare(aValue, 'ko');
            });
        }

        return result;
    }, [schedules, globalFilterValue, sortConfig]);

    const getToolTipInfo = (studentId: string) => {
        const sInfo = processedSchedules.find((item) => item.studentId === studentId);
        const leng = sInfo?.classNames && sInfo!.classNames.length;
        const classNames = sInfo?.classNames?.join('\r\n') || '';
        return `수강클래스(${leng}개) \r\n ${classNames}`;
    };

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    return (
        <>
            <style>{`
                .schedule-table-wrapper {
                    overflow-x: auto;
                    overflow-y: auto;
                    width: 100%;
                    position: relative;
                    max-height: 800px;
                }
                
                .schedule-table {
                    display: grid;
                    grid-template-columns: 120px 80px 120px 150px 150px 100px 225px repeat(7, 150px);
                    width: max-content;
                    min-width: 100%;
                }
                
                .schedule-header-cell {
                    background: var(--surface-100);
                    padding: 12px 8px;
                    border: 1px solid var(--surface-border);
                    color: var(--text-color);
                    text-align: center;
                    font-weight: 700;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    user-select: none;
                }

                .sortable-header {
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .sortable-header:hover {
                    background: var(--surface-200);
                }
                
                .sticky-col-1 { position: sticky; left: 0; z-index: 20; background: var(--surface-100) !important; }
                .sticky-col-2 { position: sticky; left: 120px; z-index: 20; background: var(--surface-100) !important; }
                .sticky-col-3 { position: sticky; left: 200px; z-index: 20; background: var(--surface-100) !important; }
                
                .schedule-cell {
                    min-height: 48px;
                    border: 1px solid var(--surface-border);
                    background: var(--surface-card);
                    display: flex;
                    align-items: stretch;
                    justify-content: center;
                    color: var(--text-color);
                }
                
                .sticky-cell-1 { position: sticky; left: 0; z-index: 5; background: var(--surface-card) !important; font-weight: 600 !important; display: flex; align-items: center; justify-content: center; }
                .sticky-cell-2 { position: sticky; left: 120px; z-index: 5; background: var(--surface-card) !important; display: flex; align-items: center; justify-content: center; }
                .sticky-cell-3 { position: sticky; left: 200px; z-index: 5; background: var(--surface-card) !important; border-right: 2px solid var(--surface-border) !important; display: flex; align-items: center; justify-content: center; }

                .schedule-input {
                    width: 100%;
                    border: 1px solid transparent;
                    background: transparent;
                    padding: 8px 6px;
                    font-size: 0.9rem;
                    border-radius: 4px;
                    transition: all 0.2s;
                    resize: none;
                    white-space: pre-wrap;
                    font-family: inherit;
                    line-height: 1.5;
                    color: var(--text-color);
                }
                .schedule-input:hover {
                    background: var(--surface-ground);
                    border-color: var(--surface-border);
                }
                .schedule-input:focus {
                    outline: none;
                    background: var(--surface-card);
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 2px var(--primary-100);
                }

                .card-input {
                    background: var(--surface-ground);
                    border: 1px solid var(--surface-border);
                    border-radius: 4px;
                    padding: 6px 8px;
                    font-size: 0.875rem;
                    width: 100%;
                    color: var(--text-color);
                    transition: border-color 0.2s;
                }
                .card-input:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    background: var(--surface-card);
                }
                
                .day-header {
                    background: var(--primary-50) !important;
                    color: var(--primary-700);
                }
                
                .layout-theme-dark .day-header {
                    background: var(--primary-900) !important;
                    color: var(--primary-100);
                }

                .counseling-btn {
                    width: 100%;
                    padding: 0.5rem 0;
                    font-size: 0.85rem;
                    border-radius: 4px;
                }

                .text-view-card {
                    background: var(--surface-card);
                    border: 1px solid var(--surface-border);
                    border-radius: 8px;
                    padding: 1.25rem;
                    margin-bottom: 1rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.04);
                    transition: transform 0.15s, box-shadow 0.15s;
                }
                .text-view-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                }
                .day-pill {
                    background: var(--primary-50);
                    color: var(--primary-700);
                    border-radius: 4px;
                    padding: 4px 8px;
                    font-weight: bold;
                    display: inline-block;
                    min-width: 32px;
                    text-align: center;
                }
                .layout-theme-dark .day-pill {
                    background: var(--primary-900);
                    color: var(--primary-100);
                }
            `}</style>

            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <div className="flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between gap-3 mb-4">
                            <div>
                                <h5 className="m-0 flex align-items-center gap-2">
                                    주간 시간표
                                    <span className="text-sm font-normal text-500">(총 {processedSchedules.length}명)</span>
                                </h5>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {/* Mode Switcher */}
                                <Button
                                    icon={viewMode === 'grid' ? 'pi pi-th-large' : 'pi pi-table'}
                                    label={viewMode === 'grid' ? '카드 뷰 전환' : '표 편집 뷰 전환'}
                                    onClick={() => setViewMode(viewMode === 'grid' ? 'text' : 'grid')}
                                    className="p-button-outlined p-button-secondary"
                                />

                                <Button
                                    icon="pi pi-sync"
                                    label="동기화"
                                    onClick={handleSync}
                                    className="p-button-outlined p-button-secondary"
                                />
                                <Button
                                    icon="pi pi-trash"
                                    label="초기화"
                                    onClick={handleReset}
                                    className="p-button-outlined p-button-danger"
                                />
                                <Button
                                    icon="pi pi-save"
                                    label="저장"
                                    onClick={handleSave}
                                    className="p-button-success"
                                />
                                <Button
                                    icon="pi pi-search"
                                    label="조회"
                                    onClick={fetchSchedules}
                                    className="p-button-outlined"
                                />
                            </div>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="flex flex-wrap gap-3 mb-4 p-3 surface-ground border-round align-items-center justify-content-between">
                            <div className="flex flex-wrap gap-3">
                                <div className="flex flex-column gap-2">
                                    <label className="text-sm font-bold">통합 검색</label>
                                    <span className="p-input-icon-left">
                                        <i className="pi pi-search" />
                                        <InputText
                                            value={globalFilterValue}
                                            onChange={(e) => setGlobalFilterValue(e.target.value)}
                                            placeholder="이름, 학교, 학년, 내용 등 전체 검색"
                                            style={{ width: '350px' }}
                                        />
                                    </span>
                                </div>
                                <div className="flex align-items-end">
                                    <Button
                                        icon="pi pi-filter-slash"
                                        label="검색 초기화"
                                        className="p-button-text"
                                        onClick={() => {
                                            setGlobalFilterValue('');
                                        }}
                                    />
                                </div>
                            </div>
                            {viewMode === 'grid' && (
                                <div className="text-sm text-600 surface-card p-2 border-round border-1 surface-border">
                                    <i className="pi pi-info-circle mr-2"></i>
                                    <span className="mr-3">
                                        <kbd className="font-bold surface-200 px-1 border-round">Enter</kbd> 다음 행 이동(세로)
                                    </span>
                                    <span>
                                        <kbd className="font-bold surface-200 px-1 border-round">Tab</kbd> 다음 열 이동(가로)
                                    </span>
                                    <span>
                                        <kbd className="font-bold surface-200 px-1 border-round">Alt + Enter</kbd> 줄바꿈
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Container */}
                        <div>
                            {/* Grid View Mode */}
                            {viewMode === 'grid' && (
                                <div className="schedule-table-wrapper">
                                    <div className="schedule-table">
                                        {/* 헤더 */}
                                        <div
                                            className="schedule-header-cell sticky-col-1 sortable-header"
                                            onClick={() => requestSort('studentName')}
                                        >
                                            이름 <i className={getSortIcon('studentName')}></i>
                                        </div>
                                        <div
                                            className="schedule-header-cell sticky-col-2 sortable-header"
                                            onClick={() => requestSort('grade')}
                                        >
                                            학년 <i className={getSortIcon('grade')}></i>
                                        </div>
                                        <div
                                            className="schedule-header-cell sticky-col-3 sortable-header"
                                            onClick={() => requestSort('school')}
                                        >
                                            학교 <i className={getSortIcon('school')}></i>
                                        </div>
                                        <div className="schedule-header-cell">상담(학생)</div>
                                        <div className="schedule-header-cell">상담(부모님)</div>
                                        <div className="schedule-header-cell">교재비</div>
                                        <div className="schedule-header-cell">상담내용(특이사항)</div>
                                        <div className="schedule-header-cell day-header">월</div>
                                        <div className="schedule-header-cell day-header">화</div>
                                        <div className="schedule-header-cell day-header">수</div>
                                        <div className="schedule-header-cell day-header">목</div>
                                        <div className="schedule-header-cell day-header">금</div>
                                        <div className="schedule-header-cell day-header">토</div>
                                        <div className="schedule-header-cell day-header">일</div>

                                        {/* 바디 */}
                                        {processedSchedules.map((s, index) => (
                                            <React.Fragment key={s.studentId}>
                                                <div className="schedule-cell sticky-cell-1">
                                                    {s.studentName}
                                                    <Button
                                                        icon="pi pi-id-card"
                                                        rounded
                                                        text
                                                        severity="info"
                                                        tooltip={getToolTipInfo(s.studentId)}
                                                        tooltipOptions={{ position: 'top' }}
                                                        style={{ width: '20px', height: '20px', marginLeft: '4px' }}
                                                    />
                                                    {s.description && (
                                                        <Button
                                                            icon="pi pi-info-circle"
                                                            rounded
                                                            text
                                                            severity="info"
                                                            tooltip={s.description}
                                                            tooltipOptions={{ position: 'top' }}
                                                            style={{ width: '20px', height: '20px', marginLeft: '4px' }}
                                                        />
                                                    )}
                                                </div>
                                                <div className="schedule-cell sticky-cell-2 text-center">{s.grade}</div>
                                                <div className="schedule-cell sticky-cell-3">{s.school}</div>
                                                <div className="schedule-cell">
                                                    <Button
                                                        label={s.counselingStudent === '상담완료' ? '상담완료' : '미완료'}
                                                        className={`counseling-btn ${
                                                            s.counselingStudent === '상담완료'
                                                                ? 'p-button-success'
                                                                : 'p-button-secondary p-button-outlined'
                                                        }`}
                                                        onClick={() =>
                                                            toggleCounseling(
                                                                s.studentId,
                                                                'counselingStudent',
                                                                s.counselingStudent
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="schedule-cell">
                                                    <Button
                                                        label={s.counselingParent === '상담완료' ? '상담완료' : '미완료'}
                                                        className={`counseling-btn ${
                                                            s.counselingParent === '상담완료'
                                                                ? 'p-button-success'
                                                                : 'p-button-secondary p-button-outlined'
                                                        }`}
                                                        onClick={() =>
                                                            toggleCounseling(
                                                                s.studentId,
                                                                'counselingParent',
                                                                s.counselingParent
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="schedule-cell">
                                                    <textarea
                                                        id={`input-${index}-bookFee`}
                                                        className="schedule-input"
                                                        value={s.bookFee || ''}
                                                        onChange={(e) => handleUpdate(s.studentId, 'bookFee', e.target.value)}
                                                        onKeyDown={(e) =>
                                                            handleKeyDown(
                                                                e,
                                                                s.studentId,
                                                                index,
                                                                'bookFee',
                                                                processedSchedules.length
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="schedule-cell">
                                                    <textarea
                                                        id={`input-${index}-consultation`}
                                                        className="schedule-input"
                                                        value={s.consultation || ''}
                                                        onChange={(e) =>
                                                            handleUpdate(s.studentId, 'consultation', e.target.value)
                                                        }
                                                        onKeyDown={(e) =>
                                                            handleKeyDown(
                                                                e,
                                                                s.studentId,
                                                                index,
                                                                'consultation',
                                                                processedSchedules.length
                                                            )
                                                        }
                                                    />
                                                </div>
                                                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                                                    <div className="schedule-cell" key={day}>
                                                        <textarea
                                                            id={`input-${index}-${day}`}
                                                            className="schedule-input"
                                                            value={s[day] || ''}
                                                            onChange={(e) => handleUpdate(s.studentId, day, e.target.value)}
                                                            onKeyDown={(e) =>
                                                                handleKeyDown(
                                                                    e,
                                                                    s.studentId,
                                                                    index,
                                                                    day,
                                                                    processedSchedules.length
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Editable Card View Mode (전체/카드 뷰 편집 기능) */}
                            {viewMode === 'text' && (
                                <div className="grid">
                                    {processedSchedules.length === 0 ? (
                                        <div className="col-12 text-center p-5 text-500">
                                            조회된 시간표 데이터가 없습니다.
                                        </div>
                                    ) : (
                                        processedSchedules.map((s, idx) => {
                                            const daysList = [
                                                { key: 'mon', label: '월' },
                                                { key: 'tue', label: '화' },
                                                { key: 'wed', label: '수' },
                                                { key: 'thu', label: '목' },
                                                { key: 'fri', label: '금' },
                                                { key: 'sat', label: '토' },
                                                { key: 'sun', label: '일' }
                                            ];

                                            return (
                                                <div key={s.studentId} className="col-12 md:col-6 lg:col-4">
                                                    <div className="text-view-card h-full flex flex-column justify-content-between">
                                                        <div>
                                                            {/* Student Header */}
                                                            <div className="flex align-items-center justify-content-between mb-3 pb-2 border-bottom-1 surface-border">
                                                                <div className="flex align-items-center gap-2">
                                                                    <span className="font-bold text-xl">{s.studentName}</span>
                                                                    <span className="text-sm px-2 py-1 surface-200 border-round font-semibold">
                                                                        {s.grade || '학년 미지정'}
                                                                    </span>
                                                                    <span className="text-sm px-2 py-1 surface-100 border-round text-600">
                                                                        {s.school || '학교 미지정'}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-400 font-mono">#{idx + 1}</span>
                                                            </div>

                                                            {/* Counseling buttons */}
                                                            <div className="grid grid-nogutter gap-2 mb-3">
                                                                <div className="col">
                                                                    <Button
                                                                        label={`학생: ${s.counselingStudent === '상담완료' ? '상담완료' : '미완료'}`}
                                                                        className={`p-button-sm w-full ${
                                                                            s.counselingStudent === '상담완료'
                                                                                ? 'p-button-success'
                                                                                : 'p-button-secondary p-button-outlined'
                                                                        }`}
                                                                        onClick={() =>
                                                                            toggleCounseling(
                                                                                s.studentId,
                                                                                'counselingStudent',
                                                                                s.counselingStudent
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                                <div className="col">
                                                                    <Button
                                                                        label={`부모님: ${s.counselingParent === '상담완료' ? '상담완료' : '미완료'}`}
                                                                        className={`p-button-sm w-full ${
                                                                            s.counselingParent === '상담완료'
                                                                                ? 'p-button-success'
                                                                                : 'p-button-secondary p-button-outlined'
                                                                        }`}
                                                                        onClick={() =>
                                                                            toggleCounseling(
                                                                                s.studentId,
                                                                                'counselingParent',
                                                                                s.counselingParent
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Editable Book Fee */}
                                                            <div className="mb-3">
                                                                <label className="text-xs font-bold text-600 block mb-1">교재비</label>
                                                                <input
                                                                    type="text"
                                                                    className="card-input"
                                                                    value={s.bookFee || ''}
                                                                    onChange={(e) => handleUpdate(s.studentId, 'bookFee', e.target.value)}
                                                                />
                                                            </div>

                                                            {/* Editable Consultation Note */}
                                                            <div className="mb-3">
                                                                <label className="text-xs font-bold text-600 block mb-1">상담내용 (특이사항)</label>
                                                                <textarea
                                                                    className="card-input"
                                                                    rows={Math.min(5, Math.max(2, (s.consultation || '').split('\n').length))}
                                                                    value={s.consultation || ''}
                                                                    onChange={(e) => handleUpdate(s.studentId, 'consultation', e.target.value)}
                                                                    style={{ resize: 'vertical' }}
                                                                />
                                                            </div>

                                                            {/* Editable Day Schedule */}
                                                            <div className="flex flex-column gap-2 mt-2">
                                                                <div className="text-xs font-bold text-500">주간 일정 (수정 가능)</div>
                                                                {daysList.map((d) => {
                                                                    const val = s[d.key] || '';
                                                                    const dynamicRows = Math.min(5, Math.max(1, val.split('\n').length));
                                                                    return (
                                                                        <div key={d.key} className="flex align-items-start gap-2">
                                                                            <span className="day-pill mt-1">{d.label}</span>
                                                                            <textarea
                                                                                className="card-input flex-1"
                                                                                rows={dynamicRows}
                                                                                value={val}
                                                                                onChange={(e) => handleUpdate(s.studentId, d.key, e.target.value)}
                                                                                style={{ resize: 'vertical' }}
                                                                            />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default WeekSchedulePage;
