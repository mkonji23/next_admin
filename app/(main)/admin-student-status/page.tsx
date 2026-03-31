'use client';

import React, { useState } from 'react';
import { Card } from 'primereact/card';
import StudentDropDown from '@/components/select/StudentDropDown';
import { StudentStatusContent } from '@/components/studentStatus/StudentStatusContent';
import { Student } from '@/types/class';

const AdminStudentStatusPage = () => {
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    return (
        <div className="grid">
            <div className="col-12">
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
