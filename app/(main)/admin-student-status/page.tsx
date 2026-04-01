'use client';

import React, { useState } from 'react';
import { Card } from 'primereact/card';
import StudentDropDown from '@/components/select/StudentDropDown';
import { StudentStatusContent } from '@/components/studentStatus/StudentStatusContent';
import { Student } from '@/types/class';
import { useToast } from '@/hooks/useToast';
import { Button } from 'primereact/button';
import useKakaoShare from '@/hooks/useKakaoShare';
import { ShareItem } from '../kakao-share/types';

const AdminStudentStatusPage = () => {
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const { shareDefault } = useKakaoShare();
    const { showToast } = useToast();

    const handleShare = () => {
        const baseUri = typeof window !== 'undefined' ? window.location.origin : '';
        const shareLink = `${baseUri}/student-status`;

        shareDefault({
            title: '나의 칭찬 현황 보기',
            description: '칭찬,출석현황 그리고 평가메시지를 확인하세요!',
            buttonText: '자세히 보기',
            linkUrl: shareLink
        });
    };

    const copyLink = () => {
        const baseUri = typeof window !== 'undefined' ? window.location.origin : '';
        const shareLink = `${baseUri}/student-status`;

        navigator.clipboard
            .writeText(shareLink)
            .then(() => {
                showToast({
                    severity: 'success',
                    summary: '복사 완료',
                    detail: '학생 현황 이동 링크가 클립보드에 복사되었습니다. \r\n학생들에게 공유하세요!'
                });
            })
            .catch((err) => {
                console.error('Copy error:', err);
                showToast({ severity: 'error', summary: '오류', detail: '링크 복사에 실패했습니다.' });
            });
    };
    return (
        <div className="grid">
            <div className="col-12">
                <div className="flex gap-2">
                    <Button
                        className="p-button-warning flex-2"
                        icon="pi pi-copy"
                        label="링크 복사"
                        tooltipOptions={{ position: 'bottom' }}
                        onClick={copyLink}
                    ></Button>
                    <Button
                        className="p-button-primary flex-2"
                        icon="pi pi-share-alt"
                        label="공유"
                        tooltipOptions={{ position: 'bottom' }}
                        onClick={handleShare}
                    ></Button>
                </div>

                <Card title="학생 현황 조회 (관리자)">
                    <div className="p-fluid formgrid grid">
                        <div className="field col-12">
                            <label htmlFor="student">학생 선택</label>
                            <StudentDropDown
                                value={selectedStudent?.studentId}
                                onChange={(student) => setSelectedStudent(student)}
                                placeholder="조회할 학생을 선택하세요"
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {selectedStudent && (
                <div className="col-12 mt-4">
                    <StudentStatusContent studentAuthData={selectedStudent} />
                </div>
            )}
        </div>
    );
};

export default AdminStudentStatusPage;
