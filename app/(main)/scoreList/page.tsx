'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { FilterMatchMode } from 'primereact/api';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { StudentScoreRow } from '@/types/score';
import * as XLSX from 'xlsx-js-style';

// 고3 제외 (고1, 고2, 전체만)
const GRADE_TABS = [
    { label: '고1 전체', value: '1' },
    { label: '고2 전체', value: '2' },
    { label: '전체 학생', value: 'all' }
];

// 실제 연도 기반 동적 옵션 생성 (현재 연도 + 1년 ~ 과거 4년)
const getCurrentYearOptions = (): { label: string; value: number }[] => {
    const currentYear = new Date().getFullYear();
    const options: { label: string; value: number }[] = [];
    for (let y = currentYear + 1; y >= currentYear - 4; y--) {
        options.push({ label: `${y}년`, value: y });
    }
    return options;
};

const TRACK_OPTIONS = [
    { label: '문과', value: '문과' },
    { label: '이과', value: '이과' }
];

// 고2 선택과목 프리셋 옵션 (직접 입력도 지원)
const ELECTIVE_SUBJECT_OPTIONS = [
    // 과학탐구
    { label: '물리학Ⅰ', value: '물리학Ⅰ' },
    { label: '화학Ⅰ', value: '화학Ⅰ' },
    { label: '생명과학Ⅰ', value: '생명과학Ⅰ' },
    { label: '지구과학Ⅰ', value: '지구과학Ⅰ' },
    { label: '물리학Ⅱ', value: '물리학Ⅱ' },
    { label: '화학Ⅱ', value: '화학Ⅱ' },
    { label: '생명과학Ⅱ', value: '생명과학Ⅱ' },
    { label: '지구과학Ⅱ', value: '지구과학Ⅱ' },
    // 사회탐구
    { label: '생활과 윤리', value: '생활과 윤리' },
    { label: '사회·문화', value: '사회·문화' },
    { label: '한국지리', value: '한국지리' },
    { label: '세계지리', value: '세계지리' },
    { label: '윤리와 사상', value: '윤리와 사상' },
    { label: '정치와 법', value: '정치와 법' },
    { label: '경제', value: '경제' },
    { label: '동아시아사', value: '동아시아사' },
    { label: '세계사', value: '세계사' },
    // 수학 / 기타
    { label: '기하', value: '기하' },
    { label: '인공지능 수학', value: '인공지능 수학' },
    { label: '확률과 통계', value: '확률과 통계' },
    { label: '정보', value: '정보' },
    { label: '제2외국어', value: '제2외국어' },
    { label: '한문Ⅰ', value: '한문Ⅰ' }
];

// 학생의 선택과목 정보를 추출하는 헬퍼 함수
const getStudentElectives = (row: StudentScoreRow) => {
    const fromScores = row.scores?.electiveSubjects;
    if (fromScores) {
        return {
            elective1: fromScores.elective1 || '',
            elective2: fromScores.elective2 || '',
            elective3: fromScores.elective3 || ''
        };
    }
    return {
        elective1: row.scores?.['2-1-mid']?.elective1_name || row.scores?.['2-1-final']?.elective1_name || '',
        elective2: row.scores?.['2-1-mid']?.elective2_name || row.scores?.['2-1-final']?.elective2_name || '',
        elective3: row.scores?.['2-1-mid']?.elective3_name || row.scores?.['2-1-final']?.elective3_name || ''
    };
};

// 🚀 [초고속 60fps 렌더링 최적화 & 다크모드 완벽 대응 셀 컴포넌트]
interface ScoreCellInputProps {
    initialValue: string | number | undefined;
    studentId: string;
    termKey: string;
    subjectKey: string;
    subLabel?: string; // 선택과목명 등의 서브 라벨
    onCellChange: (studentId: string, termKey: string, subjectKey: string, val: string) => void;
}

const ScoreCellInput = React.memo(({
    initialValue,
    studentId,
    termKey,
    subjectKey,
    subLabel,
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
    // ⚡ 2. 300ms 디바운스로 부모 state 전파하여 전체 셀의 불필요한 연쇄 리렌더링 차단
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
        <div className="p-1 w-full flex flex-column align-items-center justify-content-center">
            {subLabel ? (
                <span
                    className="text-xs font-semibold text-600 text-center text-overflow-ellipsis overflow-hidden whitespace-nowrap mb-1"
                    style={{ maxWidth: '85px', fontSize: '10.5px', lineHeight: '12px' }}
                    title={subLabel}
                >
                    {subLabel}
                </span>
            ) : null}
            <input
                type="text"
                value={val}
                placeholder={subLabel || ''}
                className="p-inputtext p-inputtext-sm text-center w-full font-semibold"
                style={{
                    height: '32px',
                    fontSize: '13px',
                    padding: '4px',
                    borderRadius: '4px',
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

    // 실제 시간 기반 동적 연도 옵션 생성 및 현재 연도 기본값 설정
    const yearOptions = useMemo(() => getCurrentYearOptions(), []);
    const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
    const [selectedGradeTab, setSelectedGradeTab] = useState<string>('1');
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [scoreData, setScoreData] = useState<StudentScoreRow[]>([]);
    const [filters, setFilters] = useState<any>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');

    // 고2 선택과목 설정 모달 상태
    const [electiveModalVisible, setElectiveModalVisible] = useState<boolean>(false);
    const [currentElectiveStudent, setCurrentElectiveStudent] = useState<StudentScoreRow | null>(null);
    const [tempElectives, setTempElectives] = useState<{ elective1: string; elective2: string; elective3: string }>({
        elective1: '',
        elective2: '',
        elective3: ''
    });

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

    // 🚀 성적란 텍스트/숫자 자유 입력 핸들러
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

    // 선택과목 설정 모달 열기
    const handleOpenElectiveModal = (student: StudentScoreRow) => {
        const current = getStudentElectives(student);
        setCurrentElectiveStudent(student);
        setTempElectives(current);
        setElectiveModalVisible(true);
    };

    // 선택과목 설정 저장 핸들러
    const handleSaveElectives = () => {
        if (!currentElectiveStudent) return;
        const studentId = currentElectiveStudent.studentId;

        setScoreData((prev) =>
            prev.map((row) => {
                if (row.studentId !== studentId) return row;
                const updatedScores = { ...(row.scores || {}) };
                updatedScores.electiveSubjects = tempElectives;

                // 각 학기 시험 객체에도 선택과목명 동기화
                ['2-1-mid', '2-1-final', '2-1-overall', '2-2-mid', '2-2-final', '2-2-overall'].forEach((term) => {
                    const termObj = { ...(updatedScores[term] || {}) };
                    termObj.elective1_name = tempElectives.elective1;
                    termObj.elective2_name = tempElectives.elective2;
                    termObj.elective3_name = tempElectives.elective3;
                    updatedScores[term] = termObj;
                });

                return {
                    ...row,
                    scores: updatedScores,
                    isModified: true
                };
            })
        );

        setElectiveModalVisible(false);
        showToast({
            severity: 'info',
            summary: '선택과목 반영',
            detail: `${currentElectiveStudent.name} 학생의 선택과목이 적용되었습니다. 일괄 저장을 눌러 영구 저장하세요.`
        });
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
                    if (term === 'electiveSubjects') {
                        cleanedScores[term] = termObj;
                    } else if (termObj && typeof termObj === 'object') {
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

    // 엑셀 내보내기
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

                // 2학기 종합등급
                baseInfo['2학기종합_수학등급'] = row.scores?.['1-2-overall']?.math ?? '';
                baseInfo['2학기종합_국어등급'] = row.scores?.['1-2-overall']?.korean ?? '';
                baseInfo['2학기종합_영어등급'] = row.scores?.['1-2-overall']?.english ?? '';
                baseInfo['2학기종합_사회등급'] = row.scores?.['1-2-overall']?.society ?? '';
                baseInfo['2학기종합_과학등급'] = row.scores?.['1-2-overall']?.science ?? '';
            } else {
                const electives = getStudentElectives(row);
                baseInfo['선택1_과목'] = electives.elective1;
                baseInfo['선택2_과목'] = electives.elective2;
                baseInfo['선택3_과목'] = electives.elective3;

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

                // 2학기 종합등급
                baseInfo['2학기종합_수학등급'] = row.scores?.['2-2-overall']?.math ?? '';
                baseInfo['2학기종합_국어등급'] = row.scores?.['2-2-overall']?.korean ?? '';
                baseInfo['2학기종합_영어등급'] = row.scores?.['2-2-overall']?.english ?? '';
                baseInfo['2학기종합_선택1등급'] = row.scores?.['2-2-overall']?.elective1_score ?? '';
                baseInfo['2학기종합_선택2등급'] = row.scores?.['2-2-overall']?.elective2_score ?? '';
                baseInfo['2학기종합_선택3등급'] = row.scores?.['2-2-overall']?.elective3_score ?? '';
            }

            return baseInfo;
        });

        const worksheet = XLSX.utils.json_to_sheet(excelRows);

        // 1. 글자 길이에 맞춰 컬럼 너비(wch) 자동 계산 (한글 2바이트 고려)
        const keys = Object.keys(excelRows[0] || {});
        const getByteLength = (str: any) => {
            const s = String(str ?? '');
            let len = 0;
            for (let i = 0; i < s.length; i++) {
                len += s.charCodeAt(i) > 128 ? 2 : 1;
            }
            return len;
        };

        const colWidths = keys.map((key) => {
            let maxLen = getByteLength(key);
            for (const row of excelRows) {
                const valLen = getByteLength(row[key]);
                if (valLen > maxLen) {
                    maxLen = valLen;
                }
            }
            // 양옆 여백 3자 추가, 최소 너비 11
            return { wch: Math.max(maxLen + 3, 11) };
        });
        worksheet['!cols'] = colWidths;

        // 2. 헤더 및 데이터 셀 스타일 적용 (굵은 글씨, 테두리, 배경색, 가운데 정렬)
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let col = range.s.c; col <= range.e.c; col++) {
            // 헤더 셀 (Row 0)
            const headerAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (worksheet[headerAddress]) {
                worksheet[headerAddress].s = {
                    font: {
                        name: '맑은 고딕',
                        bold: true,
                        sz: 11,
                        color: { rgb: '111827' }
                    },
                    fill: {
                        fgColor: { rgb: 'E5E7EB' } // 헤더 배경: 은은한 라이트 그레이
                    },
                    border: {
                        top: { style: 'thin', color: { rgb: '9CA3AF' } },
                        bottom: { style: 'medium', color: { rgb: '4B5563' } },
                        left: { style: 'thin', color: { rgb: 'D1D5DB' } },
                        right: { style: 'thin', color: { rgb: 'D1D5DB' } }
                    },
                    alignment: {
                        horizontal: 'center',
                        vertical: 'center'
                    }
                };
            }

            // 데이터 셀들 (Row 1 ~ 끝)
            for (let row = range.s.r + 1; row <= range.e.r; row++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                if (worksheet[cellAddress]) {
                    worksheet[cellAddress].s = {
                        font: {
                            name: '맑은 고딕',
                            sz: 10
                        },
                        border: {
                            top: { style: 'thin', color: { rgb: 'E5E7EB' } },
                            bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
                            left: { style: 'thin', color: { rgb: 'E5E7EB' } },
                            right: { style: 'thin', color: { rgb: 'E5E7EB' } }
                        },
                        alignment: {
                            horizontal: 'center',
                            vertical: 'center'
                        }
                    };
                }
            }
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Scores');
        XLSX.writeFile(
            workbook,
            `성적표_${selectedYear}년_${selectedGradeTab === 'all' ? '전체' : selectedGradeTab + '학년'}.xlsx`
        );
    };

    // 엑셀 업로드 처리
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

                const isGrade1 = selectedGradeTab === '1';

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

                            // 선택과목 정보
                            if (item['선택1_과목'] !== undefined || item['선택2_과목'] !== undefined || item['선택3_과목'] !== undefined) {
                                const curElectives = scores.electiveSubjects || {};
                                scores.electiveSubjects = {
                                    elective1: item['선택1_과목'] !== undefined ? String(item['선택1_과목']) : curElectives.elective1 || '',
                                    elective2: item['선택2_과목'] !== undefined ? String(item['선택2_과목']) : curElectives.elective2 || '',
                                    elective3: item['선택3_과목'] !== undefined ? String(item['선택3_과목']) : curElectives.elective3 || ''
                                };
                            }

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
                            // 2학기 종합 (1학년)
                            if (item['2학기종합_수학등급'] !== undefined && isGrade1) {
                                scores['1-2-overall'] = {
                                    ...scores['1-2-overall'],
                                    math: item['2학기종합_수학등급'],
                                    korean: item['2학기종합_국어등급'],
                                    english: item['2학기종합_영어등급'],
                                    society: item['2학기종합_사회등급'],
                                    science: item['2학기종합_과학등급']
                                };
                            }

                            // 2-1 중간
                            if (item['2-1중간_수학'] !== undefined) {
                                scores['2-1-mid'] = {
                                    ...scores['2-1-mid'],
                                    math: item['2-1중간_수학'],
                                    korean: item['2-1중간_국어'],
                                    english: item['2-1중간_영어'],
                                    elective1_score: item['2-1중간_선택1'],
                                    elective2_score: item['2-1중간_선택2'],
                                    elective3_score: item['2-1중간_선택3']
                                };
                            }
                            // 2-1 기말
                            if (item['2-1기말_수학'] !== undefined) {
                                scores['2-1-final'] = {
                                    ...scores['2-1-final'],
                                    math: item['2-1기말_수학'],
                                    korean: item['2-1기말_국어'],
                                    english: item['2-1기말_영어'],
                                    elective1_score: item['2-1기말_선택1'],
                                    elective2_score: item['2-1기말_선택2'],
                                    elective3_score: item['2-1기말_선택3']
                                };
                            }
                            // 2-1 종합
                            if (item['1학기종합_수학등급'] !== undefined && !isGrade1) {
                                scores['2-1-overall'] = {
                                    ...scores['2-1-overall'],
                                    math: item['1학기종합_수학등급'],
                                    korean: item['1학기종합_국어등급'],
                                    english: item['1학기종합_영어등급'],
                                    elective1_score: item['1학기종합_선택1등급'],
                                    elective2_score: item['1학기종합_선택2등급'],
                                    elective3_score: item['1학기종합_선택3등급']
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
                            // 2학기 종합 (2학년)
                            if (item['2학기종합_수학등급'] !== undefined && !isGrade1) {
                                scores['2-2-overall'] = {
                                    ...scores['2-2-overall'],
                                    math: item['2학기종합_수학등급'],
                                    korean: item['2학기종합_국어등급'],
                                    english: item['2학기종합_영어등급'],
                                    elective1_score: item['2학기종합_선택1등급'],
                                    elective2_score: item['2학기종합_선택2등급'],
                                    elective3_score: item['2학기종합_선택3등급']
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
        electives: '190px',
        subject: '84px',
        elective: '95px'
    };

    // 1학년 다단 헤더 정의
    const headerGroupGrade1 = (
        <ColumnGroup>
            <Row>
                <Column header="학생 정보 (이름 / 학년 / 학교)" rowSpan={2} frozen style={{ width: COL_WIDTH.name, minWidth: COL_WIDTH.name, zIndex: 30 }} />
                <Column header="계열" rowSpan={2} frozen style={{ width: COL_WIDTH.track, minWidth: COL_WIDTH.track, zIndex: 30, left: COL_WIDTH.name }} />
                <Column header="1-1 중간" colSpan={6} />
                <Column header="1-1 기말" colSpan={6} />
                <Column header="1학기 종합등급" colSpan={5} />
                <Column header="1-2 중간" colSpan={6} />
                <Column header="1-2 기말" colSpan={6} />
                <Column header="2학기 종합등급" colSpan={5} />
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

                {/* 2학기 종합등급 */}
                <Column header="수학" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="국어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="영어" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="사회" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
                <Column header="과학" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} />
            </Row>
        </ColumnGroup>
    );

    // 2학년 다단 헤더 정의 (선택과목 컬럼 포함)
    const headerGroupGrade2 = (
        <ColumnGroup>
            <Row>
                <Column header="학생 정보 (이름 / 학년 / 학교)" rowSpan={2} frozen style={{ width: COL_WIDTH.name, minWidth: COL_WIDTH.name, zIndex: 30 }} />
                <Column header="계열" rowSpan={2} frozen style={{ width: COL_WIDTH.track, minWidth: COL_WIDTH.track, zIndex: 30, left: COL_WIDTH.name }} />
                <Column header="선택과목 (1·2·3)" rowSpan={2} style={{ width: COL_WIDTH.electives, minWidth: COL_WIDTH.electives }} />
                <Column header="2-1 중간" colSpan={6} />
                <Column header="2-1 기말" colSpan={6} />
                <Column header="1학기 종합등급" colSpan={6} />
                <Column header="2-2 중간" colSpan={6} />
                <Column header="2-2 기말" colSpan={6} />
                <Column header="2학기 종합등급" colSpan={6} />
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

                {/* 2학기 종합등급 */}
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
            {/* 🚀 가로/세로 스크롤 시 테이블 헤더 및 고정(frozen) 컬럼 겹침 방지 완벽 대응 스타일 */}
            <style>{`
                /* 1. 테이블 래퍼 스크롤 기준 설정 */
                .score-datatable .p-datatable-wrapper {
                    position: relative;
                }

                /* 2. 테이블 헤더(thead) 전체 상단 고정 및 본문보다 높은 z-index */
                .score-datatable .p-datatable-thead {
                    position: sticky !important;
                    top: 0 !important;
                    z-index: 20 !important;
                }

                /* 3. 모든 헤더 th에 불투명 배경색 적용 (스크롤 시 본문 내용이 비치지 않음) */
                .score-datatable .p-datatable-thead > tr > th {
                    background-color: var(--surface-100, #f1f5f9) !important;
                    color: var(--text-color, #1e293b) !important;
                    text-align: center;
                    vertical-align: middle;
                }

                /* 4. 고정 컬럼 헤더 (학생 정보 & 계열) */
                .score-datatable .p-datatable-thead > tr > th.p-frozen-column {
                    position: sticky !important;
                    top: 0 !important;
                    z-index: 30 !important;
                    background-color: var(--surface-200, #e2e8f0) !important;
                    text-align: center;
                    vertical-align: middle;
                }
                .score-datatable .p-datatable-thead > tr > th.p-frozen-column:nth-child(1) {
                    left: 0px !important;
                }
                .score-datatable .p-datatable-thead > tr > th.p-frozen-column:nth-child(2) {
                    left: 240px !important;
                    box-shadow: 3px 0 6px rgba(0, 0, 0, 0.08) !important;
                    border-right: 1px solid var(--surface-border, #cbd5e1) !important;
                }

                /* 5. PrimeReact 다단헤더 버그 방지: Row 2에 주입되는 잘못된 left: 0px 리셋 */
                .score-datatable .p-datatable-thead > tr:nth-child(2) > th:not(.p-frozen-column) {
                    left: auto !important;
                    position: static !important;
                }

                /* 6. 고정 컬럼 본문 셀: 학생 정보(0px) 및 계열(240px) */
                .score-datatable .p-datatable-tbody > tr > td.p-frozen-column {
                    position: sticky !important;
                    z-index: 10 !important;
                    background-color: var(--surface-card, #ffffff) !important;
                }
                .score-datatable .p-datatable-tbody > tr > td.p-frozen-column:nth-child(1) {
                    left: 0px !important;
                }
                .score-datatable .p-datatable-tbody > tr > td.p-frozen-column:nth-child(2) {
                    left: 240px !important;
                    box-shadow: 3px 0 6px rgba(0, 0, 0, 0.08) !important;
                    border-right: 1px solid var(--surface-border, #cbd5e1) !important;
                }

                /* 7. 일반 본문 셀 및 내부 요소: z-index를 1로 유지하여 고정 컬럼(10) 및 헤더(20, 30) 뒤로 스크롤 */
                .score-datatable .p-datatable-tbody > tr > td:not(.p-frozen-column) {
                    position: relative;
                    z-index: 1 !important;
                }
                .score-datatable .p-datatable-tbody > tr > td:not(.p-frozen-column) .p-dropdown,
                .score-datatable .p-datatable-tbody > tr > td:not(.p-frozen-column) .p-tag,
                .score-datatable .p-datatable-tbody > tr > td:not(.p-frozen-column) .p-button,
                .score-datatable .p-datatable-tbody > tr > td:not(.p-frozen-column) input {
                    position: relative;
                    z-index: 1 !important;
                }
            `}</style>

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
                                label="새로고침"
                                severity="secondary"
                                size="small"
                                outlined
                                onClick={() => fetchScores(selectedYear, selectedGradeTab)}
                            />
                        </div>
                    </div>

                    {/* 상단 2행: 넉넉한 고정 너비의 연도/학년 셀렉트박스 & 검색 필터 */}
                    <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3 mb-3 px-1">
                        <div className="flex flex-wrap align-items-center gap-3">
                            {/* 연도 라벨 + Selectbox (너비 135px로 넉넉하게 확장) */}
                            <div className="flex align-items-center gap-2">
                                <label className="font-bold text-sm text-700 whitespace-nowrap">연도:</label>
                                <Dropdown
                                    value={selectedYear}
                                    options={yearOptions}
                                    onChange={(e) => setSelectedYear(e.value)}
                                    className="p-inputtext-sm font-semibold"
                                    style={{ width: '135px' }}
                                />
                            </div>

                            {/* 학년 라벨 + Selectbox (고3 제외, 너비 145px로 전체 텍스트 완벽 표시) */}
                            <div className="flex align-items-center gap-2">
                                <label className="font-bold text-sm text-700 whitespace-nowrap">학년:</label>
                                <Dropdown
                                    value={selectedGradeTab}
                                    options={GRADE_TABS}
                                    onChange={(e) => setSelectedGradeTab(e.value)}
                                    className="p-inputtext-sm font-semibold"
                                    style={{ width: '145px' }}
                                    placeholder="학년 선택"
                                />
                            </div>

                            {/* 검색 라벨 + Input (너비 260px로 여유롭게 검색어/placeholder 노출) */}
                            <div className="flex align-items-center gap-2">
                                <label className="font-bold text-sm text-700 whitespace-nowrap">검색:</label>
                                <span className="p-input-icon-left">
                                    <i className="pi pi-search text-500" />
                                    <InputText
                                        value={globalFilterValue}
                                        onChange={onGlobalFilterChange}
                                        placeholder="이름 또는 학교 검색..."
                                        className="p-inputtext-sm"
                                        style={{ width: '260px' }}
                                    />
                                </span>
                            </div>

                            <span className="text-xs text-500 ml-1">
                                (조회: <strong className="text-primary">{scoreData.length}</strong>명)
                            </span>
                        </div>
                    </div>

                    {/* 성적 그리드 테이블 */}
                    <div className="surface-card">
                        {isGrade1View ? (
                            <DataTable
                                value={scoreData}
                                headerColumnGroup={headerGroupGrade1}
                                scrollable
                                scrollHeight="calc(100vh - 280px)"
                                tableStyle={{ minWidth: '3300px' }}
                                filters={filters}
                                globalFilterFields={['name', 'school', 'grade', 'track']}
                                loading={loading}
                                emptyMessage="해당 학년에 등록된 학생 데이터가 없습니다."
                                size="small"
                                stripedRows
                                showGridlines
                                className="p-datatable-sm score-datatable"
                            >
                                {/* 고정 컬럼: 학생 정보 */}
                                <Column
                                    field="name"
                                    frozen
                                    style={{ width: COL_WIDTH.name, minWidth: COL_WIDTH.name, zIndex: 10, backgroundColor: 'var(--surface-card, #ffffff)' }}
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
                                    frozen
                                    style={{ width: COL_WIDTH.track, minWidth: COL_WIDTH.track, zIndex: 10, left: COL_WIDTH.name, backgroundColor: 'var(--surface-card, #ffffff)' }}
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

                                {/* 2학기 종합등급 */}
                                <Column field="scores.1-2-overall.math" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-2-overall']?.math} studentId={row.studentId} termKey="1-2-overall" subjectKey="math" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-2-overall.korean" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-2-overall']?.korean} studentId={row.studentId} termKey="1-2-overall" subjectKey="korean" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-2-overall.english" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-2-overall']?.english} studentId={row.studentId} termKey="1-2-overall" subjectKey="english" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-2-overall.society" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-2-overall']?.society} studentId={row.studentId} termKey="1-2-overall" subjectKey="society" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.1-2-overall.science" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['1-2-overall']?.science} studentId={row.studentId} termKey="1-2-overall" subjectKey="science" onCellChange={handleScoreInputChange} />} />
                            </DataTable>
                        ) : (
                            <DataTable
                                value={scoreData}
                                headerColumnGroup={headerGroupGrade2}
                                scrollable
                                scrollHeight="calc(100vh - 280px)"
                                tableStyle={{ minWidth: '3600px' }}
                                filters={filters}
                                globalFilterFields={['name', 'school', 'grade', 'track']}
                                loading={loading}
                                emptyMessage="해당 학년에 등록된 학생 데이터가 없습니다."
                                size="small"
                                stripedRows
                                showGridlines
                                className="p-datatable-sm score-datatable"
                            >
                                {/* 고정 컬럼: 학생 정보 */}
                                <Column
                                    field="name"
                                    frozen
                                    style={{ width: COL_WIDTH.name, minWidth: COL_WIDTH.name, zIndex: 10, backgroundColor: 'var(--surface-card, #ffffff)' }}
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
                                    frozen
                                    style={{ width: COL_WIDTH.track, minWidth: COL_WIDTH.track, zIndex: 10, left: COL_WIDTH.name, backgroundColor: 'var(--surface-card, #ffffff)' }}
                                    body={(row: StudentScoreRow) => (
                                        <div className="p-1 flex justify-content-center" style={{ position: "relative", zIndex: 1 }}>
                                            <Dropdown
                                                value={row.track || '문과'}
                                                options={TRACK_OPTIONS}
                                                onChange={(e) => handleTrackChange(row.studentId, e.value)}
                                                className="p-inputtext-sm w-full font-medium"
                                                style={{ height: '32px', fontSize: '12px' }}
                                                valueTemplate={(option) => {
                                                    const label = option ? option.label : (row.track || '문과');
                                                    return (
                                                        <span
                                                            className="flex align-items-center justify-content-center w-full"
                                                            style={{ transform: 'translateY(-2px)' }}
                                                        >
                                                            {label}
                                                        </span>
                                                    );
                                                }}
                                                pt={{
                                                    input: {
                                                        style: {
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            paddingTop: '0',
                                                            paddingBottom: '0',
                                                            height: '100%'
                                                        }
                                                    }
                                                }}
                                                placeholder="계열"
                                            />
                                        </div>
                                    )}
                                />

                                {/* 선택과목 컬럼: 학생별 선택1, 선택2, 선택3 과목 확인 및 변경 */}
                                <Column
                                    header="선택과목"
                                    style={{ width: COL_WIDTH.electives, minWidth: COL_WIDTH.electives, zIndex: 1 }}
                                    body={(row: StudentScoreRow) => {
                                        const electives = getStudentElectives(row);
                                        const hasAny = electives.elective1 || electives.elective2 || electives.elective3;
                                        return (
                                            <div
                                                className="flex flex-column gap-1 p-1 cursor-pointer hover:surface-100 border-round transition-duration-150"
                                                onClick={() => handleOpenElectiveModal(row)}
                                                title="클릭하여 학생의 선택1, 2, 3 과목 설정"
                                            >
                                                {hasAny ? (
                                                    <div className="flex flex-column gap-1">
                                                        {electives.elective1 && (
                                                            <Tag severity="info" value={`1: ${electives.elective1}`} className="text-overflow-ellipsis overflow-hidden" style={{ fontSize: '10px', padding: '1px 5px', height: '18px', textAlign: 'left' }} />
                                                        )}
                                                        {electives.elective2 && (
                                                            <Tag severity="success" value={`2: ${electives.elective2}`} className="text-overflow-ellipsis overflow-hidden" style={{ fontSize: '10px', padding: '1px 5px', height: '18px', textAlign: 'left' }} />
                                                        )}
                                                        {electives.elective3 && (
                                                            <Tag severity="warning" value={`3: ${electives.elective3}`} className="text-overflow-ellipsis overflow-hidden" style={{ fontSize: '10px', padding: '1px 5px', height: '18px', textAlign: 'left' }} />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Button
                                                        label="과목 설정"
                                                        icon="pi pi-pencil"
                                                        size="small"
                                                        outlined
                                                        className="p-button-xs w-full"
                                                        style={{ height: '28px', fontSize: '11px' }}
                                                    />
                                                )}
                                            </div>
                                        );
                                    }}
                                />

                                {/* 2-1 중간 */}
                                <Column field="scores.2-1-mid.math" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-mid']?.math} studentId={row.studentId} termKey="2-1-mid" subjectKey="math" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-mid.korean" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-mid']?.korean} studentId={row.studentId} termKey="2-1-mid" subjectKey="korean" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-mid.english" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-mid']?.english} studentId={row.studentId} termKey="2-1-mid" subjectKey="english" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-mid.elective1_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-mid']?.elective1_score} studentId={row.studentId} termKey="2-1-mid" subjectKey="elective1_score" subLabel={getStudentElectives(row).elective1} onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-mid.elective2_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-mid']?.elective2_score} studentId={row.studentId} termKey="2-1-mid" subjectKey="elective2_score" subLabel={getStudentElectives(row).elective2} onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-mid.elective3_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-mid']?.elective3_score} studentId={row.studentId} termKey="2-1-mid" subjectKey="elective3_score" subLabel={getStudentElectives(row).elective3} onCellChange={handleScoreInputChange} />} />

                                {/* 2-1 기말 */}
                                <Column field="scores.2-1-final.math" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-final']?.math} studentId={row.studentId} termKey="2-1-final" subjectKey="math" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-final.korean" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-final']?.korean} studentId={row.studentId} termKey="2-1-final" subjectKey="korean" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-final.english" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-final']?.english} studentId={row.studentId} termKey="2-1-final" subjectKey="english" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-final.elective1_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-final']?.elective1_score} studentId={row.studentId} termKey="2-1-final" subjectKey="elective1_score" subLabel={getStudentElectives(row).elective1} onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-final.elective2_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-final']?.elective2_score} studentId={row.studentId} termKey="2-1-final" subjectKey="elective2_score" subLabel={getStudentElectives(row).elective2} onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-final.elective3_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-final']?.elective3_score} studentId={row.studentId} termKey="2-1-final" subjectKey="elective3_score" subLabel={getStudentElectives(row).elective3} onCellChange={handleScoreInputChange} />} />

                                {/* 1학기 종합등급 */}
                                <Column field="scores.2-1-overall.math" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-overall']?.math} studentId={row.studentId} termKey="2-1-overall" subjectKey="math" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-overall.korean" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-overall']?.korean} studentId={row.studentId} termKey="2-1-overall" subjectKey="korean" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-overall.english" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-overall']?.english} studentId={row.studentId} termKey="2-1-overall" subjectKey="english" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-overall.elective1_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-overall']?.elective1_score} studentId={row.studentId} termKey="2-1-overall" subjectKey="elective1_score" subLabel={getStudentElectives(row).elective1} onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-overall.elective2_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-overall']?.elective2_score} studentId={row.studentId} termKey="2-1-overall" subjectKey="elective2_score" subLabel={getStudentElectives(row).elective2} onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-1-overall.elective3_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-1-overall']?.elective3_score} studentId={row.studentId} termKey="2-1-overall" subjectKey="elective3_score" subLabel={getStudentElectives(row).elective3} onCellChange={handleScoreInputChange} />} />

                                {/* 2-2 중간 */}
                                <Column field="scores.2-2-mid.math" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-mid']?.math} studentId={row.studentId} termKey="2-2-mid" subjectKey="math" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-mid.korean" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-mid']?.korean} studentId={row.studentId} termKey="2-2-mid" subjectKey="korean" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-mid.english" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-mid']?.english} studentId={row.studentId} termKey="2-2-mid" subjectKey="english" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-mid.elective1_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-mid']?.elective1_score} studentId={row.studentId} termKey="2-2-mid" subjectKey="elective1_score" subLabel={getStudentElectives(row).elective1} onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-mid.elective2_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-mid']?.elective2_score} studentId={row.studentId} termKey="2-2-mid" subjectKey="elective2_score" subLabel={getStudentElectives(row).elective2} onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-mid.elective3_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-mid']?.elective3_score} studentId={row.studentId} termKey="2-2-mid" subjectKey="elective3_score" subLabel={getStudentElectives(row).elective3} onCellChange={handleScoreInputChange} />} />

                                {/* 2-2 기말 */}
                                <Column field="scores.2-2-final.math" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-final']?.math} studentId={row.studentId} termKey="2-2-final" subjectKey="math" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-final.korean" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-final']?.korean} studentId={row.studentId} termKey="2-2-final" subjectKey="korean" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-final.english" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-final']?.english} studentId={row.studentId} termKey="2-2-final" subjectKey="english" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-final.elective1_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-final']?.elective1_score} studentId={row.studentId} termKey="2-2-final" subjectKey="elective1_score" subLabel={getStudentElectives(row).elective1} onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-final.elective2_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-final']?.elective2_score} studentId={row.studentId} termKey="2-2-final" subjectKey="elective2_score" subLabel={getStudentElectives(row).elective2} onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-final.elective3_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-final']?.elective3_score} studentId={row.studentId} termKey="2-2-final" subjectKey="elective3_score" subLabel={getStudentElectives(row).elective3} onCellChange={handleScoreInputChange} />} />

                                {/* 2학기 종합등급 */}
                                <Column field="scores.2-2-overall.math" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-overall']?.math} studentId={row.studentId} termKey="2-2-overall" subjectKey="math" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-overall.korean" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-overall']?.korean} studentId={row.studentId} termKey="2-2-overall" subjectKey="korean" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-overall.english" style={{ width: COL_WIDTH.subject, minWidth: COL_WIDTH.subject }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-overall']?.english} studentId={row.studentId} termKey="2-2-overall" subjectKey="english" onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-overall.elective1_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-overall']?.elective1_score} studentId={row.studentId} termKey="2-2-overall" subjectKey="elective1_score" subLabel={getStudentElectives(row).elective1} onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-overall.elective2_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-overall']?.elective2_score} studentId={row.studentId} termKey="2-2-overall" subjectKey="elective2_score" subLabel={getStudentElectives(row).elective2} onCellChange={handleScoreInputChange} />} />
                                <Column field="scores.2-2-overall.elective3_score" style={{ width: COL_WIDTH.elective, minWidth: COL_WIDTH.elective }} body={(row: StudentScoreRow) => <ScoreCellInput initialValue={row.scores?.['2-2-overall']?.elective3_score} studentId={row.studentId} termKey="2-2-overall" subjectKey="elective3_score" subLabel={getStudentElectives(row).elective3} onCellChange={handleScoreInputChange} />} />
                            </DataTable>
                        )}
                    </div>
                </div>
            </div>

            {/* 고2 학생별 선택과목 설정 대화상자 */}
            <Dialog
                visible={electiveModalVisible}
                onHide={() => setElectiveModalVisible(false)}
                header="고2 선택과목 설정"
                style={{ width: '440px' }}
                modal
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="취소" severity="secondary" text size="small" onClick={() => setElectiveModalVisible(false)} />
                        <Button label="적용하기" icon="pi pi-check" size="small" onClick={handleSaveElectives} />
                    </div>
                }
            >
                {currentElectiveStudent && (
                    <div className="flex flex-column gap-3 pt-2">
                        <div className="surface-100 p-2 border-round text-sm">
                            <span className="font-bold text-900">{currentElectiveStudent.name}</span>
                            <span className="text-600 ml-2">({currentElectiveStudent.school} / {currentElectiveStudent.track || '계열 미지정'})</span>
                        </div>

                        <div className="flex flex-column gap-1">
                            <label className="text-xs font-bold text-700">선택과목 1</label>
                            <Dropdown
                                value={tempElectives.elective1}
                                options={ELECTIVE_SUBJECT_OPTIONS}
                                onChange={(e) => setTempElectives((prev) => ({ ...prev, elective1: e.value }))}
                                editable
                                placeholder="과목 선택 또는 직접 입력"
                                className="p-inputtext-sm w-full"
                            />
                        </div>

                        <div className="flex flex-column gap-1">
                            <label className="text-xs font-bold text-700">선택과목 2</label>
                            <Dropdown
                                value={tempElectives.elective2}
                                options={ELECTIVE_SUBJECT_OPTIONS}
                                onChange={(e) => setTempElectives((prev) => ({ ...prev, elective2: e.value }))}
                                editable
                                placeholder="과목 선택 또는 직접 입력"
                                className="p-inputtext-sm w-full"
                            />
                        </div>

                        <div className="flex flex-column gap-1">
                            <label className="text-xs font-bold text-700">선택과목 3</label>
                            <Dropdown
                                value={tempElectives.elective3}
                                options={ELECTIVE_SUBJECT_OPTIONS}
                                onChange={(e) => setTempElectives((prev) => ({ ...prev, elective3: e.value }))}
                                editable
                                placeholder="과목 선택 또는 직접 입력"
                                className="p-inputtext-sm w-full"
                            />
                        </div>
                        <p className="text-xs text-500 m-0">
                            * 과목을 드롭다운에서 선택하거나 직접 입력할 수 있습니다.<br />
                            * 적용 후 상단의 <strong>[일괄 저장]</strong> 버튼을 누르면 DB에 영구 저장됩니다.
                        </p>
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default ScoreListPage;