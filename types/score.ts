export interface SubjectScore {
    subjectName?: string;
    score?: number | string;
    grade?: number | string;
}

export interface TermScores {
    math?: number | string;
    korean?: number | string;
    english?: number | string;
    society?: number | string;
    history?: number | string;
    science?: number | string;
    // 2~3학년 선택과목용
    elective1_name?: string;
    elective1_score?: number | string;
    elective2_name?: string;
    elective2_score?: number | string;
    elective3_name?: string;
    elective3_score?: number | string;
    [key: string]: any;
}

export interface StudentScoreRow {
    studentId: string;
    school: string;
    name: string;
    grade: string | number;
    track?: string; // 일반, 인문, 자연 등
    description?: string; // 학생 특이사항 / 설명
    year: number;
    scoreId?: string | null;
    scores: {
        '1-1-mid'?: TermScores;
        '1-1-final'?: TermScores;
        '1-1-overall'?: TermScores;
        '1-2-mid'?: TermScores;
        '1-2-final'?: TermScores;
        '1-2-overall'?: TermScores;
        '2-1-mid'?: TermScores;
        '2-1-final'?: TermScores;
        '2-1-overall'?: TermScores;
        '2-2-mid'?: TermScores;
        '2-2-final'?: TermScores;
        '2-2-overall'?: TermScores;
        [termKey: string]: any;
    };
    memo?: string;
    isModified?: boolean; // 프론트 편집 추적 플래그
}
