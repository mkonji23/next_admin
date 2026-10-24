'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { FilterMatchMode } from 'primereact/api';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { StudentScoreRow } from '@/types/score';
import * as XLSX from 'xlsx';

// 고3 제외 (고1, 고2, 전체만)
const GRADE_TABS = [
    { label: '고1 전체', value: '1' },
    { label: '고2 전체', value: '2' },
    { label: '전체 학생', value: 'all' }
];

const yearOptions = [
    { label: '2026년', value: 2026 },
    { label: '2025년', value: 2025 },
    { label: '2024년', value: 2024 },
    { label: '2023년', value: 2023 }
];

const TRACK_OPTIONS = [
    { label: '문과', value: '문과' },
    { label: '이과', value: '이과' }
];

// 🚀 [초고속 60fps 렌더링 최적화 & 다크모드 완벽 대응 셀 컴포넌트]
interface ScoreCellInputProps {
    initialValue: string | number | undefined;
    studentId: string;
    termKey: string;
    subjectKey: string;
    onCellChange: (studentId: string, termKey: string, subjectKey: string, val: string) => void;
}

const ScoreCellInput = React.memo(({
    initialValue,
    studentId,
    termKey,
    subjectKey,
    onCellChange
}: ScoreCellInputProps) => {
    const [val, setVal] = useState<string>(
        initialValue !== null && initialValue !== undefined ? String(initialValue) : ''
    );
    const isFocusedRef = useRef<boolean>(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 외부에서 scoreData가 리셋되거나 바뀔 때 동기화 (단, 타이핑 포커스 중일 때는 사용자 입력 보호)
    useEffect(() => {
        if (!isFocusedRef.current) {
            setVal(initialValue !== null && initialValue !== undefined ? String(initialValue) : '');
        }
    }, [initialValue]);

    // 언마운트 시 지연 타이머 정리
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // ⚡ 1. 키 입력 즉시 로컬 state 갱신 (지연 시간 0ms, 60fps 유지)
    // ⚡ 2. 300ms 디바운스로 부모 state 전파하여 900+개 전체 셀의 불필요한 연쇄 리렌더링 차단
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nextVal = e.target.value;
        setVal(nextVal);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            onCellChange(studentId, termKey, subjectKey, nextVal);
        }, 300);
    };

    // ⚡ 3. 포커스 해제(Blur) 시 지연 타이머 즉시 취소 후 부모 state에 즉각 커밋
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        isFocusedRef.current = false;
        e.target.style.boxShadow = 'none';

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }

        const currentInitialStr = initialValue !== null && initialValue !== undefined ? String(initialValue) : '';
        if (val !== currentInitialStr) {
            onCellChange(studentId, termKey, subjectKey, val);
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        isFocusedRef.current = true;
        e.target.style.boxShadow = '0 0 0 2px var(--primary-200, rgba(99, 102, 241, 0.35))';
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    const isFilled = val !== '';

    return (
        <div className="p-1 w-full flex justify-content-center">
            <input
                type="text"
                value={val}
                className="p-inputtext p-inputtext-sm text-center w-full font-semibold"
                style={{
                    height: '32px',
                    fontSize: '13px',
                    padding: '4px',
                    borderRadius: '4px',
                    // 다크 모드 / 라이트 모드 CSS 변수 완벽 연동
                    backgroundColor: isFilled ? 'var(--highlight-bg, rgba(99, 102, 241, 0.12))' : 'var(--surface-card, #ffffff)',
                    color: 'var(--text-color, #1f2937)',
                    border: isFilled ? '1.5px solid var(--primary-color, #6366F1)' : '1px solid var(--surface-border, #ced4da)',
                    outline: 'none',
                    transition: 'background-color 0.15s, border-color 0.15s, box-shadow 0.15s'
                }}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
            />
        </div>
    );
});

ScoreCellInput.displayName = 'ScoreCellInput';

const ScoreListPage = () => {
    const http = useHttp();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 기본 연도 2026년으로 설정
    const [selectedYear, setSelectedYear] = useState<number>(2026);
    const [selectedGradeTab, setSelectedGradeTab] = useState<string>('1');
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [scoreData, setScoreData] = useState<StudentScoreRow[]>([]);
    const [filters, setFilters] = useState<any>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');

    // 데이터 조회 (연도, 학년 변경 시 학생 목록 및 성적 로드)
    const fetchScores = async (year = selectedYear, grade = selectedGradeTab) => {
        setLoading(true);
        try {
            const params: any = { year };
            if (grade !== 'all') {
                params.grade = grade;
            }
            const response = await http.get('/choiMath/score/getScoreList', { params });
            const list = (response.data || []).map((item: any) => ({
                ...item,
                scores: item.scores && typeof item.scores === 'object' ? item.scores : {},
                isModified: false
            }));
            setScoreData(list);
        } catch (error: any) {
            console.error('Error fetching score list:', error);
            showToast({
                severity: 'error',
                summary: '조회 실패',
                detail: error.response?.data?.message || '성적 목록을 불러오지 못했습니다.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScores(selectedYear, selectedGradeTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear, selectedGradeTab]);

    // 변경된 건수 카운트
    const modifiedCount = useMemo(() => {
        return scoreData.filter((row) => row.isModified).length;
    }, [scoreData]);

    // 글로벌 검색
    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const _filters = { ...filters };
        _filters['global'].value = val;
        setFilters(_filters);
        setGlobalFilterValue(val);
    };

    // 🚀 [핵심] 성적란 텍스트/숫자 자유 입력 핸들러 (scores: {} 상태여도 즉시 자동 생성)
    const handleScoreInputChange = useCallback((
        studentId: string,
        termKey: string,
        subjectKey: string,
        inputValue: string
    ) => {
        setScoreData((prev) => {
            const idx = prev.findIndex((r) => r.studentId === studentId);
            if (idx === -1) return prev;

            const row = prev[idx];
            const prevScores = (row.scores && typeof row.scores === 'object') ? { ...row.scores } : {};
            const prevTerm = (prevScores[termKey] && typeof prevScores[termKey] === 'object') ? { ...prevScores[termKey] } : {};

            if (prevTerm[subjectKey] === inputValue) {
                return prev;
            }

            prevTerm[subjectKey] = inputValue;
            prevScores[termKey] = prevTerm;

            const next = [...prev];
            next[idx] = {
                ...row,
                scores: prevScores,
                isModified: true
            };
            return next;
        });
    }, []);

    // 계열(track) 변경 핸들러
    const handleTrackChange = (studentId: string, val: string) => {
        setScoreData((prev) =>
            prev.map((row) => {
                if (row.studentId !== studentId) return row;
                return {
                    ...row,
                    track: val,
                    isModified: true
                };
            })
        );
    };

    // 일괄 저장
    const handleSaveBatch = async () => {
        const modifiedRows = scoreData.filter((r) => r.isModified);
        if (modifiedRows.length === 0) {
            showToast({ severity: 'info', summary: '저장할 내용 없음', detail: '수정된 성적 정보가 없습니다.' });
            return;
        }

        setSaving(true);
        try {
            const payload = modifiedRows.map((r) => {
                const cleanedScores: any = {};
                const sourceScores = r.scores && typeof r.scores === 'object' ? r.scores : {};

                Object.keys(sourceScores).forEach((term) => {
                    const termObj = sourceScores[term];
                    if (termObj && typeof termObj === 'object') {
                        cleanedScores[term] = {};
                        Object.keys(termObj).forEach((sub) => {
                            const rawVal = termObj[sub];
                            if (rawVal === '' || rawVal === undefined || rawVal === null) {
                                cleanedScores[term][sub] = '';
                            } else if (!isNaN(Number(rawVal)) && typeof rawVal !== 'boolean') {
                                cleanedScores[term][sub] = Number(rawVal);
                            } else {
                                cleanedScores[term][sub] = rawVal;
                            }
                        });
                    }
                });

                return {
                    studentId: r.studentId,
                    name: r.name,
                    school: r.school,
                    grade: r.grade,
                    year: r.year || selectedYear,
                    track: r.track || '일반',
                    scores: cleanedScores,
                    memo: r.memo || ''
                };
            });

            await http.post('/choiMath/score/saveBatchScores', {
                scoreList: payload,
                year: selectedYear
            });

            showToast({
                severity: 'success',
                summary: '저장 완료',
                detail: `${modifiedRows.length}명의 학생 성적이 성공적으로 저장되었습니다.`
            });

            setScoreData((prev) => prev.map((r) => ({ ...r, isModified: false })));
        } catch (error: any) {
            console.error('Error saving batch scores:', error);
            showToast({
                severity: 'error',
                summary: '저장 실패',
                detail: error.response?.data?.message || '성적 저장 도중 오류가 발생했습니다.'
            });
        } finally {
            setSaving(false);
        }
    };

    // 엑셀 내보내기 (1-2 기말, 2-2 중간, 2-2 기말 포함)
    const exportToExcel = () => {
        if (scoreData.length === 0) {
            showToast({ severity: 'warn', summary: '내보내기 불가', detail: '내보낼 데이터가 없습니다.' });
            return;
        }

        const isGrade1 = selectedGradeTab === '1';

        const excelRows = scoreData.map((row) => {
            const baseInfo: any = {
                '학생ID': row.studentId,
                '학교': row.school,
                '이름': row.name,
                '학년': row.grade,
                '계열': row.track || '일반'
            };

            if (isGrade1) {
                // 1-1 중간
                baseInfo['1-1중간_수학'] = row.scores?.['1-1-mid']?.math ?? '';
                baseInfo['1-1중간_국어'] = row.scores?.['1-1-mid']?.korean ?? '';
                baseInfo['1-1중간_영어'] = row.scores?.['1-1-mid']?.english ?? '';
                baseInfo['1-1중간_사회'] = row.scores?.['1-1-mid']?.society ?? '';
                baseInfo['1-1중간_한국사'] = row.scores?.['1-1-mid']?.history ?? '';
                baseInfo['1-1중간_과학'] = row.scores?.['1-1-mid']?.science ?? '';

                // 1-1 기말
                baseInfo['1-1기말_수학'] = row.scores?.['1-1-final']?.math ?? '';
                baseInfo['1-1기말_국어'] = row.scores?.['1-1-final']?.korean ?? '';
                baseInfo['1-1기말_영어'] = row.scores?.['1-1-final']?.english ?? '';
                baseInfo['1-1기말_사회'] = row.scores?.['1-1-final']?.society ?? '';
                baseInfo['1-1기말_한국사'] = row.scores?.['1-1-final']?.history ?? '';
                baseInfo['1-1기말_과학'] = row.scores?.['1-1-final']?.science ?? '';

                // 1학기 종합등급
                baseInfo['1학기종합_수학등급'] = row.scores?.['1-1-overall']?.math ?? '';
                baseInfo['1학기종합_국어등급'] = row.scores?.['1-1-overall']?.korean ?? '';
                baseInfo['1학기종합_영어등급'] = row.scores?.['1-1-overall']?.english ?? '';
                baseInfo['1학기종합_사회등급'] = row.scores?.['1-1-overall']?.society ?? '';
                baseInfo['1학기종합_과학등급'] = row.scores?.['1-1-overall']?.science ?? '';

                // 1-2 중간
                baseInfo['1-2중간_수학'] = row.scores?.['1-2-mid']?.math ?? '';
                baseInfo['1-2중간_국어'] = row.scores?.['1-2-mid']?.korean ?? '';
                baseInfo['1-2중간_영어'] = row.scores?.['1-2-mid']?.english ?? '';
                baseInfo['1-2중간_사회'] = row.scores?.['1-2-mid']?.society ?? '';
                baseInfo['1-2중간_한국사'] = row.scores?.['1-2-mid']?.history ?? '';
                baseInfo['1-2중간_과학'] = row.scores?.['1-2-mid']?.science ?? '';

                // 1-2 기말
                baseInfo['1-2기말_수학'] = row.scores?.['1-2-final']?.math ?? '';
                baseInfo['1-2기말_국어'] = row.scores?.['1-2-final']?.korean ?? '';
                baseInfo['1-2기말_영어'] = row.scores?.['1-2-final']?.english ?? '';
                baseInfo['1-2기말_사회'] = row.scores?.['1-2-final']?.society ?? '';
                baseInfo['1-2기말_한국사'] = row.scores?.['1-2-final']?.history ?? '';
                baseInfo['1-2기말_과학'] = row.scores?.['1-2-final']?.science ?? '';
            } else {
                // 2-1 중간
                baseInfo['2-1중간_수학'] = row.scores?.['2-1-mid']?.math ?? '';
                baseInfo['2-1중간_국어'] = row.scores?.['2-1-mid']?.korean ?? '';
                baseInfo['2-1중간_영어'] = row.scores?.['2-1-mid']?.english ?? '';
                baseInfo['2-1중간_선택1'] = row.scores?.['2-1-mid']?.elective1_score ?? '';
                baseInfo['2-1중간_선택2'] = row.scores?.['2-1-mid']?.elective2_score ?? '';
                baseInfo['2-1중간_선택3'] = row.scores?.['2-1-mid']?.elective3_score ?? '';

                // 2-1 기말
                baseInfo['2-1기말_수학'] = row.scores?.['2-1-final']?.math ?? '';
                baseInfo['2-1기말_국어'] = row.scores?.['2-1-final']?.korean ?? '';
                baseInfo['2-1기말_영어'] = row.scores?.['2-1-final']?.english ?? '';
                baseInfo['2-1기말_선택1'] = row.scores?.['2-1-final']?.elective1_score ?? '';
                baseInfo['2-1기말_선택2'] = row.scores?.['2-1-final']?.elective2_score ?? '';
                baseInfo['2-1기말_선택3'] = row.scores?.['2-1-final']?.elective3_score ?? '';

                // 1학기 종합등급
                baseInfo['1학기종합_수학등급'] = row.scores?.['2-1-overall']?.math ?? '';
                baseInfo['1학기종합_국어등급'] = row.scores?.['2-1-overall']?.korean ?? '';
                baseInfo['1학기종합_영어등급'] = row.scores?.['2-1-overall']?.english ?? '';
                baseInfo['1학기종합_선택1등급'] = row.scores?.['2-1-overall']?.elective1_score ?? '';
                baseInfo['1학기종합_선택2등급'] = row.scores?.['2-1-overall']?.elective2_score ?? '';
                baseInfo['1학기종합_선택3등급'] = row.scores?.['2-1-overall']?.elective3_score ?? '';

                // 2-2 중간
                baseInfo['2-2중간_수학'] = row.scores?.['2-2-mid']?.math ?? '';
                baseInfo['2-2중간_국어'] = row.scores?.['2-2-mid']?.korean ?? '';
                baseInfo['2-2중간_영어'] = row.scores?.['2-2-mid']?.english ?? '';
                baseInfo['2-2중간_선택1'] = row.scores?.['2-2-mid']?.elective1_score ?? '';
                baseInfo['2-2중간_선택2'] = row.scores?.['2-2-mid']?.elective2_score ?? '';
                baseInfo['2-2중간_선택3'] = row.scores?.['2-2-mid']?.elective3_score ?? '';

                // 2-2 기말
                baseInfo['2-2기말_수학'] = row.scores?.['2-2-final']?.math ?? '';
                baseInfo['2-2기말_국어'] = row.scores?.['2-2-final']?.korean ?? '';
                baseInfo['2-2기말_영어'] = row.scores?.['2-2-final']?.english ?? '';
                baseInfo['2-2기말_선택1'] = row.scores?.['2-2-final']?.elective1_score ?? '';
                baseInfo['2-2기말_선택2'] = row.scores?.['2-2-final']?.elective2_score ?? '';
                baseInfo['2-2기말_선택3'] = row.scores?.['2-2-final']?.elective3_score ?? '';
            }

            return baseInfo;
        });

        const worksheet = XLSX.utils.json_to_sheet(excelRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Scores');
        XLSX.writeFile(
            workbook,
            `성적표_${selectedYear}년_${selectedGradeTab === 'all' ? '전체' : selectedGradeTab + '학년'}.xlsx`
        );
    };

    // 엑셀 업로드 처리 (ArrayBuffer 최신 표준)
    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const buffer = evt.target?.result as ArrayBuffer;
                const wb = XLSX.read(buffer, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const importedData: any[] = XLSX.utils.sheet_to_json(ws);

                if (importedData.length === 0) {
                    showToast({ severity: 'warn', summary: '빈 파일', detail: '엑셀 파일에 데이터가 없습니다.' });
                    return;
                }

                setScoreData((prev) => {
                    const next = [...prev];
                    importedData.forEach((item) => {
                        const targetIndex = next.findIndex(
                            (r) =>
                                (item['학생ID'] && r.studentId === item['학생ID']) ||
                                (r.name === item['이름'] && r.school === item['학교'])
                        );

                        if (targetIndex !== -1) {
                            const cur = next[targetIndex];
                            const scores = { ...cur.scores };

                            // 1-1 중간
                            if (item['1-1중간_수학'] !== undefined) {
                                scores['1-1-mid'] = {
                                    ...scores['1-1-mid'],
                                    math: item['1-1중간_수학'],
                                    korean: item['1-1중간_국어'],
                                    english: item['1-1중간_영어'],
                                    society: item['1-1중간_사회'],
                                    history: item['1-1중간_한국사'],
                                    science: item['1-1중간_과학']
                                };
                            }
                            // 1-1 기말
                            if (item['1-1기말_수학'] !== undefined) {
                                scores['1-1-final'] = {
                                    ...scores['1-1-final'],
                                    math: item['1-1기말_수학'],
                                    korean: item['1-1기말_국어'],
                                    english: item['1-1기말_영어'],
                                    society: item['1-1기말_사회'],
                                    history: item['1-1기말_한국사'],
                                    science: item['1-1기말_과학']
                                };
                            }
                            // 1학기 종합
                            if (item['1학기종합_수학등급'] !== undefined) {
                                scores['1-1-overall'] = {
                                    ...scores['1-1-overall'],
                                    math: item['1학기종합_수학등급'],
                                    korean: item['1학기종합_국어등급'],
                                    english: item['1학기종합_영어등급'],
                                    society: item['1학기종합_사회등급'],
                                    science: item['1학기종합_과학등급']
                                };
                            }
                            // 1-2 중간
                            if (item['1-2중간_수학'] !== undefined) {
                                scores['1-2-mid'] = {
                                    ...scores['1-2-mid'],
                                    math: item['1-2중간_수학'],
                                    korean: item['1-2중간_국어'],
                                    english: item['1-2중간_영어'],
                                    society: item['1-2중간_사회'],
                                    history: item['1-2중간_한국사'],
                                    science: item['1-2중간_과학']
                                };
                            }
                            // 1-2 기말
                            if (item['1-2기말_수학'] !== undefined) {
                                scores['1-2-final'] = {
                                    ...scores['1-2-final'],
                                    math: item['1-2기말_수학'],
                                    korean: item['1-2기말_국어'],
                                    english: item['1-2기말_영어'],
                                    society: item['1-2기말_사회'],
                                    history: item['1-2기말_한국사'],
                                    science: item['1-2기말_과학']
                                };
                            }

                            // 2-2 중간
                            if (item['2-2중간_수학'] !== undefined) {
                                scores['2-2-mid'] = {
                                    ...scores['2-2-mid'],
                                    math: item['2-2중간_수학'],
                                    korean: item['2-2중간_국어'],
                                    english: item['2-2중간_영어'],
                                    elective1_score: item['2-2중간_선택1'],
                                    elective2_score: item['2-2중간_선택2'],
                                    elective3_score: item['2-2중간_선택3']
                                };
                            }
                            // 2-2 기말
                            if (item['2-2기말_수학'] !== undefined) {
                                scores['2-2-final'] = {
                                    ...scores['2-2-final'],
                                    math: item['2-2기말_수학'],
                                    korean: item['2-2기말_국어'],
                                    english: item['2-2기말_영어'],
                                    elective1_score: item['2-2기말_선택1'],
                                    elective2_score: item['2-2기말_선택2'],
                                    elective3_score: item['2-2기말_선택3']
                                };
                            }

                            next[targetIndex] = {
                                ...cur,
                                track: item['계열'] || cur.track,
                                scores,
                                isModified: true
                            };
                        }
                    });
                    return next;
                });

                showToast({
                    severity: 'success',
                    summary: '엑셀 불러오기 완료',
                    detail: `${importedData.length}건을 읽어왔습니다. '일괄 저장' 버튼을 눌러 적용하세요.`
                });
            } catch (err: any) {
                console.error('Excel Import Error:', err);
                showToast({ severity: 'error', summary: '가져오기 실패', detail: '엑셀 파싱 중 오류가 발생했습니다.' });
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // 컬럼 너비 상수
    const COL_WIDTH = {
        name: '240px',
        track: '105px',
        subject: '84px',
        elective: '95px'
    };

    // 1학년 다단 헤더 정의
    const headerGroupGrade1 = (
        <ColumnGroup>
            <Row>
                <Column header="학생 정보 (이름 / 학년 / 학교)" rowSpan={2} frozen style={{ width: COL_WIDTH.name, minWidth: COL_WIDTH.name }} />
                <Column header="계열" rowSpan={2} style={{ width: COL_WIDTH.track, minWidth: COL_WIDTH.track }} />
                <Column header="1-1 중간" colSpan={6} />
                <Column header="1-1 기말" colSpan={6} />
                <Column header="1학기 종합등급" colSpan={5} />
                <Column header="1-2 중간" colSpan={6} />
                <Column header="1-2 기말" colSpan={6} />
            </Row>
            <Row>
                {/* 1-1 중간 */}
                <Column header="수학" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="국어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="영어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="사회" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="한국사" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="과학" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />

                {/* 1-1 기말 */}
                <Column header="수학" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="국어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="영어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="사회" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="한국사" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="과학" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />

                {/* 1학기 종합등급 */}
                <Column header="수학" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="국어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="영어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="사회" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="과학" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />

                {/* 1-2 중간 */}
                <Column header="수학" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="국어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="영어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="사회" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="한국사" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="과학" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />

                {/* 1-2 기말 */}
                <Column header="수학" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="국어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="영어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="사회" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="한국사" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="과학" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
            </Row>
        </ColumnGroup>
    );

    // 2학년 다단 헤더 정의
    const headerGroupGrade2 = (
        <ColumnGroup>
            <Row>
                <Column header="학생 정보 (이름 / 학년 / 학교)" rowSpan={2} frozen style={{ width: COL_WIDTH.name, minWidth: COL_WIDTH.name }} />
                <Column header="계열" rowSpan={2} style={{ width: COL_WIDTH.track, minWidth: COL_WIDTH.track }} />
                <Column header="2-1 중간" colSpan={6} />
                <Column header="2-1 기말" colSpan={6} />
                <Column header="1학기 종합등급" colSpan={6} />
                <Column header="2-2 중간" colSpan={6} />
                <Column header="2-2 기말" colSpan={6} />
            </Row>
            <Row>
                {/* 2-1 중간 */}
                <Column header="수학" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="국어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="영어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="선택1" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} />
                <Column header="선택2" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} />
                <Column header="선택3" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} />

                {/* 2-1 기말 */}
                <Column header="수학" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="국어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="영어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="선택1" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} />
                <Column header="선택2" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} />
                <Column header="선택3" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} />

                {/* 1학기 종합등급 */}
                <Column header="수학" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="국어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="영어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="선택1" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} />
                <Column header="선택2" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} />
                <Column header="선택3" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} />

                {/* 2-2 중간 */}
                <Column header="수학" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="국어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="영어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="선택1" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} />
                <Column header="선택2" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} />
                <Column header="선택3" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} />

                {/* 2-2 기말 */}
                <Column header="수학" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="국어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="영어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="선택1" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} />
                <Column header="선택2" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} />
                <Column header="선택3" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} />
            </Row>
        </ColumnGroup>
    );

    const isGrade1View = selectedGradeTab === '1' || selectedGradeTab === 'all';

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card shadow-2 p-3">
                    {/* 상단 1행: 타이틀 및 액션 버튼들 */}
                    <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3 mb-2 pb-2 border-bottom-1 surface-border">
                        <div className="flex align-items-center gap-2">
                            <span className="text-xl font-bold text-900">성적 관리표</span>
                            {modifiedCount > 0 && (
                                <Tag severity="warning" value={`수정됨: ${modifiedCount}명`} className="ml-2 font-bold" />
                            )}
                        </div>

                        <div className="flex flex-wrap align-items-center gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".xlsx, .xls"
                                onChange={handleImportExcel}
                            />
                            <Button
                                icon="pi pi-file-excel"
                                label="엑셀 다운"
                                severity="success"
                                size="small"
                                outlined
                                onClick={exportToExcel}
                            />
                            <Button
                                icon="pi pi-upload"
                                label="엑셀 업로드"
                                severity="secondary"
                                size="small"
                                outlined
                                onClick={() => fileInputRef.current?.click()}
                            />
                            <Button
                                icon="pi pi-check"
                                label="일괄 저장"
                                size="small"
                                loading={saving}
                                onClick={handleSaveBatch}
                                disabled={modifiedCount === 0}
                            />
                            <Button
                                icon="pi pi-refresh"
                                severity="secondary"
                                text
                                size="small"
                                onClick={() => fetchScores(selectedYear, selectedGradeTab)}
                                tooltip="새로고침"
                            />
                        </div>
                    </div>

                    {/* 상단 2행: 라벨 달린 연도/학년 셀렉트박스 & 검색 필터 */}
                    <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3 mb-3 px-1">
                        <div className="flex flex-wrap align-items-center gap-3">
                            {/* 연도 라벨 + Selectbox */}
                            <div className="flex align-items-center gap-1">
                                <label className="font-bold text-sm text-700 whitespace-nowrap">연도:</label>
                                <Dropdown
                                    value={selectedYear}
                                    options={yearOptions}
                                    onChange={(e) => setSelectedYear(e.value)}
                                    className="p-inputtext-sm font-semibold"
                                    style={{ width: '120px' }}
                                />
                            </div>

                            {/* 학년 라벨 + Selectbox (고3 제외) */}
                            <div className="flex align-items-center gap-1">
                                <label className="font-bold text-sm text-700 whitespace-nowrap">학년:</label>
                                <Dropdown
                                    value={selectedGradeTab}
                                    options={GRADE_TABS}
                                    onChange={(e) => setSelectedGradeTab(e.value)}
                                    className="p-inputtext-sm font-semibold"
                                    style={{ width: '125px' }}
                                    placeholder="학년 선택"
                                />
                            </div>

                            {/* 검색 라벨 + Input */}
                            <div className="flex align-items-center gap-1">
                                <label className="font-bold text-sm text-700 whitespace-nowrap">검색:</label>
                                <span className="p-input-icon-left">
                                    <i className="pi pi-search text-500" />
                                    <InputText
                                        value={globalFilterValue}
                                        onChange={onGlobalFilterChange}
                                        placeholder="이름 또는 학교 검색..."
                                        className="p-inputtext-sm"
                                        style={{ width: '210px' }}
                                    />
                                </span>
                            </div>

                            <span className="text-xs text-500 ml-1">
                                (조회: <strong className="text-primary">{scoreData.length}</strong>명)
                            </span>
                        </div>
                    </div>

                    {/* 성적 그리드 테이블: 모든 성적 셀에 항상 활성화된 InputText 제공 */}
                    <div className="surface-card">
                        {isGrade1View ? (
                            <DataTable
                                value={scoreData}
                                headerColumnGroup={headerGroupGrade1}
                                scrollable
                                scrollHeight="calc(100vh - 280px)"
                                tableStyle={{ minWidth: '2800px' }}
                                filters={filters}
                                globalFilterFields={['name', 'school', 'grade', 'track']}
                                loading={loading}
                                emptyMessage="해당 학년에 등록된 학생 데이터가 없습니다."
                                size="small"
                                stripedRows
                                showGridlines
                                className="p-datatable-sm"
                            >
                                {/* 고정 컬럼: 학생 정보 */}
                                <Column
                                    field="name"
                                    frozen
                                    style={{ width: COL_WIDTH.name, minWidth: COL_WIDTH.name }}
                                    body={(row: StudentScoreRow) => (
                                        <div className="flex align-items-center justify-content-between gap-1 px-1 py-1">
                                            <div className="flex align-items-center flex-wrap gap-1">
                                                <span className="font-bold text-sm text-900 mr-1">{row.name}</span>
                                                {row.grade && (
                                                    <Tag
                                                        value={`${row.grade}학년`}
                                                        severity="info"
                                                        style={{ fontSize: '10px', padding: '1px 5px', height: '18px' }}
                                                    />
                                                )}
                                                {row.school && (
                                                    <Tag
                                                        value={row.school}
                                                        severity="warning"
                                                        style={{ fontSize: '10px', padding: '1px 5px', height: '18px' }}
                                                    />
                                                )}
                                                {row.isModified && (
                                                    <span
                                                        className="inline-block border-circle bg-yellow-500 ml-1"
                                                        style={{ width: '7px', height: '7px' }}
                                                        title="수정됨"
                                                    />
                                                )}
                                            </div>
                                            {row.description && (
                                                <Button
                                                    icon="pi pi-info-circle"
                                                    rounded
                                                    text
                                                    severity="info"
                                                    tooltip={row.description}
                                                    tooltipOptions={{ position: 'top' }}
                                                    style={{ width: '20px', height: '20px', marginLeft: '4px', flexShrink: 0 }}
                                                />
                                            )}
                                        </div>
                                    )}
                                />

                                {/* 계열 컬럼 (1학년: 일반 태그) */}
                                <Column
                                    field="track"
                                    style={{ width: COL_WIDTH.track, minWidth: COL_WIDTH.track }}
                                    body={(row: StudentScoreRow) => (
                                        <div className="flex justify-content-center align-items-center">
                                            <Tag value="일반" className="font-semibold text-xs px-2" style={{ backgroundColor: 'var(--surface-200)', color: 'var(--text-color)' }} />
                                        </div>
                                    )}
                                />

                                {/* 1-1 중간 */}
                                <Column field="scores.1-1-mid.math" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-1-mid']?.math} studentId={row.studentId} termKey="1-1-mid" subjectKey="math" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-1-mid.korean" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-1-mid']?.korean} studentId={row.studentId} termKey="1-1-mid" subjectKey="korean" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-1-mid.english" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-1-mid']?.english} studentId={row.studentId} termKey="1-1-mid" subjectKey="english" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-1-mid.society" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-1-mid']?.society} studentId={row.studentId} termKey="1-1-mid" subjectKey="society" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-1-mid.history" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-1-mid']?.history} studentId={row.studentId} termKey="1-1-mid" subjectKey="history" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-1-mid.science" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-1-mid']?.science} studentId={row.studentId} termKey="1-1-mid" subjectKey="science" onCellChange={handleScoreInputChange} />} />

                                {/* 1-1 기말 */}
                                <Column field="scores.1-1-final.math" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-1-final']?.math} studentId={row.studentId} termKey="1-1-final" subjectKey="math" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-1-final.korean" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-1-final']?.korean} studentId={row.studentId} termKey="1-1-final" subjectKey="korean" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-1-final.english" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-1-final']?.english} studentId={row.studentId} termKey="1-1-final" subjectKey="english" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-1-final.society" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-1-final']?.society} studentId={row.studentId} termKey="1-1-final" subjectKey="society" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-1-final.history" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-1-final']?.history} studentId={row.studentId} termKey="1-1-final" subjectKey="history" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-1-final.science" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-1-final']?.science} studentId={row.studentId} termKey="1-1-final" subjectKey="science" onCellChange={handleScoreInputChange} />} />

                                {/* 1학기 종합등급 */}
                                <Column field="scores.1-1-overall.math" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-1-overall']?.math} studentId={row.studentId} termKey="1-1-overall" subjectKey="math" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-1-overall.korean" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-1-overall']?.korean} studentId={row.studentId} termKey="1-1-overall" subjectKey="korean" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-1-overall.english" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-1-overall']?.english} studentId={row.studentId} termKey="1-1-overall" subjectKey="english" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-1-overall.society" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-1-overall']?.society} studentId={row.studentId} termKey="1-1-overall" subjectKey="society" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-1-overall.science" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-1-overall']?.science} studentId={row.studentId} termKey="1-1-overall" subjectKey="science" onCellChange={handleScoreInputChange} />} />

                                {/* 1-2 중간 */}
                                <Column field="scores.1-2-mid.math" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-2-mid']?.math} studentId={row.studentId} termKey="1-2-mid" subjectKey="math" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-2-mid.korean" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-2-mid']?.korean} studentId={row.studentId} termKey="1-2-mid" subjectKey="korean" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-2-mid.english" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-2-mid']?.english} studentId={row.studentId} termKey="1-2-mid" subjectKey="english" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-2-mid.society" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-2-mid']?.society} studentId={row.studentId} termKey="1-2-mid" subjectKey="society" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-2-mid.history" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-2-mid']?.history} studentId={row.studentId} termKey="1-2-mid" subjectKey="history" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-2-mid.science" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-2-mid']?.science} studentId={row.studentId} termKey="1-2-mid" subjectKey="science" onCellChange={handleScoreInputChange} />} />

                                {/* 1-2 기말 */}
                                <Column field="scores.1-2-final.math" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-2-final']?.math} studentId={row.studentId} termKey="1-2-final" subjectKey="math" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-2-final.korean" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-2-final']?.korean} studentId={row.studentId} termKey="1-2-final" subjectKey="korean" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-2-final.english" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-2-final']?.english} studentId={row.studentId} termKey="1-2-final" subjectKey="english" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-2-final.society" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-2-final']?.society} studentId={row.studentId} termKey="1-2-final" subjectKey="society" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-2-final.history" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-2-final']?.history} studentId={row.studentId} termKey="1-2-final" subjectKey="history" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-2-final.science" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-2-final']?.science} studentId={row.studentId} termKey="1-2-final" subjectKey="science" onCellChange={handleScoreInputChange} />} />
                            </DataTable>
                        ) : (
                            <DataTable
                                value={scoreData}
                                headerColumnGroup={headerGroupGrade2}
                                scrollable
                                scrollHeight="calc(100vh - 280px)"
                                tableStyle={{ minWidth: '2800px' }}
                                filters={filters}
                                globalFilterFields={['name', 'school', 'grade', 'track']}
                                loading={loading}
                                emptyMessage="해당 학년에 등록된 학생 데이터가 없습니다."
                                size="small"
                                stripedRows
                                showGridlines
                                className="p-datatable-sm"
                            >
                                {/* 고정 컬럼: 학생 정보 */}
                                <Column
                                    field="name"
                                    frozen
                                    style={{ width: COL_WIDTH.name, minWidth: COL_WIDTH.name }}
                                    body={(row: StudentScoreRow) => (
                                        <div className="flex align-items-center justify-content-between gap-1 px-1 py-1">
                                            <div className="flex align-items-center flex-wrap gap-1">
                                                <span className="font-bold text-sm text-900 mr-1">{row.name}</span>
                                                {row.grade && (
                                                    <Tag
                                                        value={`${row.grade}학년`}
                                                        severity="info"
                                                        style={{ fontSize: '10px', padding: '1px 5px', height: '18px' }}
                                                    />
                                                )}
                                                {row.school && (
                                                    <Tag
                                                        value={row.school}
                                                        severity="warning"
                                                        style={{ fontSize: '10px', padding: '1px 5px', height: '18px' }}
                                                    />
                                                )}
                                                {row.isModified && (
                                                    <span
                                                        className="inline-block border-circle bg-yellow-500 ml-1"
                                                        style={{ width: '7px', height: '7px' }}
                                                        title="수정됨"
                                                    />
                                                )}
                                            </div>
                                            {row.description && (
                                                <Button
                                                    icon="pi pi-info-circle"
                                                    rounded
                                                    text
                                                    severity="info"
                                                    tooltip={row.description}
                                                    tooltipOptions={{ position: 'top' }}
                                                    style={{ width: '20px', height: '20px', marginLeft: '4px', flexShrink: 0 }}
                                                />
                                            )}
                                        </div>
                                    )}
                                />

                                {/* 계열: 2학년 문과/이과 드롭다운 */}
                                <Column
                                    field="track"
                                    style={{ width: COL_WIDTH.track, minWidth: COL_WIDTH.track }}
                                    body={(row: StudentScoreRow) => (
                                        <div className="p-1 flex justify-content-center">
                                            <Dropdown
                                                value={row.track || '문과'}
                                                options={TRACK_OPTIONS}
                                                onChange={(e) => handleTrackChange(row.studentId, e.value)}
                                                className="p-inputtext-sm w-full font-medium"
                                                style={{ height: '32px', fontSize: '12px' }}
                                                placeholder="계열"
                                            />
                                        </div>
                                    )}
                                />

                                {/* 2-1 중간 */}
                                <Column field="scores.2-1-mid.math" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-mid']?.math} studentId={row.studentId} termKey="2-1-mid" subjectKey="math" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-mid.korean" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-mid']?.korean} studentId={row.studentId} termKey="2-1-mid" subjectKey="korean" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-mid.english" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-mid']?.english} studentId={row.studentId} termKey="2-1-mid" subjectKey="english" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-mid.elective1_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-mid']?.elective1_score} studentId={row.studentId} termKey="2-1-mid" subjectKey="elective1_score" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-mid.elective2_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-mid']?.elective2_score} studentId={row.studentId} termKey="2-1-mid" subjectKey="elective2_score" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-mid.elective3_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-mid']?.elective3_score} studentId={row.studentId} termKey="2-1-mid" subjectKey="elective3_score" onCellChange={handleScoreInputChange} />} />

                                {/* 2-1 기말 */}
                                <Column field="scores.2-1-final.math" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-final']?.math} studentId={row.studentId} termKey="2-1-final" subjectKey="math" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-final.korean" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-final']?.korean} studentId={row.studentId} termKey="2-1-final" subjectKey="korean" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-final.english" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-final']?.english} studentId={row.studentId} termKey="2-1-final" subjectKey="english" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-final.elective1_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-final']?.elective1_score} studentId={row.studentId} termKey="2-1-final" subjectKey="elective1_score" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-final.elective2_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-final']?.elective2_score} studentId={row.studentId} termKey="2-1-final" subjectKey="elective2_score" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-final.elective3_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-final']?.elective3_score} studentId={row.studentId} termKey="2-1-final" subjectKey="elective3_score" onCellChange={handleScoreInputChange} />} />

                                {/* 1학기 종합등급 */}
                                <Column field="scores.2-1-overall.math" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-overall']?.math} studentId={row.studentId} termKey="2-1-overall" subjectKey="math" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-overall.korean" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-overall']?.korean} studentId={row.studentId} termKey="2-1-overall" subjectKey="korean" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-overall.english" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-overall']?.english} studentId={row.studentId} termKey="2-1-overall" subjectKey="english" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-overall.elective1_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-overall']?.elective1_score} studentId={row.studentId} termKey="2-1-overall" subjectKey="elective1_score" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-overall.elective2_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-overall']?.elective2_score} studentId={row.studentId} termKey="2-1-overall" subjectKey="elective2_score" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-overall.elective3_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-overall']?.elective3_score} studentId={row.studentId} termKey="2-1-overall" subjectKey="elective3_score" onCellChange={handleScoreInputChange} />} />

                                {/* 2-2 중간 */}
                                <Column field="scores.2-2-mid.math" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-mid']?.math} studentId={row.studentId} termKey="2-2-mid" subjectKey="math" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-mid.korean" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-mid']?.korean} studentId={row.studentId} termKey="2-2-mid" subjectKey="korean" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-mid.english" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-mid']?.english} studentId={row.studentId} termKey="2-2-mid" subjectKey="english" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-mid.elective1_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-mid']?.elective1_score} studentId={row.studentId} termKey="2-2-mid" subjectKey="elective1_score" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-mid.elective2_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-mid']?.elective2_score} studentId={row.studentId} termKey="2-2-mid" subjectKey="elective2_score" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-mid.elective3_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-mid']?.elective3_score} studentId={row.studentId} termKey="2-2-mid" subjectKey="elective3_score" onCellChange={handleScoreInputChange} />} />

                                {/* 2-2 기말 */}
                                <Column field="scores.2-2-final.math" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-final']?.math} studentId={row.studentId} termKey="2-2-final" subjectKey="math" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-final.korean" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-final']?.korean} studentId={row.studentId} termKey="2-2-final" subjectKey="korean" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-final.english" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-final']?.english} studentId={row.studentId} termKey="2-2-final" subjectKey="english" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-final.elective1_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-final']?.elective1_score} studentId={row.studentId} termKey="2-2-final" subjectKey="elective1_score" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-final.elective2_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-final']?.elective2_score} studentId={row.studentId} termKey="2-2-final" subjectKey="elective2_score" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-final.elective3_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-final']?.elective3_score} studentId={row.studentId} termKey="2-2-final" subjectKey="elective3_score" onCellChange={handleScoreInputChange} />} />
                            </DataTable>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScoreListPage;
