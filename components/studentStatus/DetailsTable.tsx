'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import dayjs from 'dayjs';
import { ATTENDANCE_STATUS_OPTIONS } from '@/constants/attendance';

interface DetailsTableProps {
    classes: any[];
    expandedRows: any;
    onRowToggle: (data: any) => void;
    classRanks: Record<string, number>;
}

const DetailsTable: React.FC<DetailsTableProps> = ({ classes, expandedRows, onRowToggle, classRanks }) => {
    const getAttendanceSeverity = (status: string) => {
        switch (status) {
            case 'class_present':
                return 'success';
            case 'class_absent':
                return 'danger';
            case 'late':
                return 'warning';
            default:
                return 'info';
        }
    };

    const rowExpansionTemplate = (data: any) => {
        const filterAttendance = data?.attendance?.filter((item: any) => item.status !== 'none' || item.praise);

        return (
            <div className="p-3">
                <DataTable value={filterAttendance} emptyMessage="칭찬,출석 내역이 없습니다.">
                    <Column
                        field="date"
                        header="날짜"
                        headerStyle={{ minWidth: '120px' }}
                        sortable
                        body={(rowData: any) => dayjs(rowData?.date).format('YYYY-MM-DD')}
                    />
                    <Column
                        field="status"
                        header="출석상태"
                        headerStyle={{ minWidth: '100px' }}
                        sortable
                        body={(rowData: any) => (
                            <Tag
                                value={
                                    ATTENDANCE_STATUS_OPTIONS.find((opt) => opt.value === rowData.status)?.label ||
                                    '없음'
                                }
                                severity={getAttendanceSeverity(rowData.status || '')}
                            />
                        )}
                    />
                    <Column
                        sortable
                        field="homework"
                        headerStyle={{ minWidth: '80px' }}
                        header="숙제"
                        body={(rowData: any) => `${rowData?.homework || 0}%`}
                    />
                    <Column
                        sortable
                        field="praise"
                        header="칭찬여부"
                        align={'center'}
                        headerStyle={{ minWidth: '100px' }}
                        body={(rowData: any) =>
                            rowData.praise ? (
                                <i className="pi pi-face-smile text-green-500 text-2xl" />
                            ) : (
                                <i className="pi pi-minus text-400" />
                            )
                        }
                    />
                    <Column
                        sortable
                        field="note"
                        headerStyle={{ minWidth: '120px', textAlign: 'center' }}
                        header="비고"
                        alignHeader={'center'}
                    />
                </DataTable>
            </div>
        );
    };

    return (
        <div className="grid mt-2">
            <div className="col-12">
                <Card title="클래스별 칭찬 및 출석 내역" className="border-none shadow-1 border-round-2xl overflow-hidden">
                    <DataTable
                        value={classes}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => onRowToggle(e.data)}
                        rowExpansionTemplate={rowExpansionTemplate}
                        dataKey="classId"
                        emptyMessage="수강 중인 클래스가 없습니다."
                        className="p-datatable-sm"
                    >
                        <Column expander style={{ width: '3em' }} />
                        <Column field="className" header="클래스명" sortable />
                        <Column
                            header="칭찬 횟수"
                            body={(rowData) => {
                                const praiseCount = rowData.attendance?.filter((a: any) => a.praise).length || 0;
                                return <Tag value={`${praiseCount}회`} severity={praiseCount > 0 ? 'success' : 'info'} />;
                            }}
                        />
                        <Column
                            header="순위"
                            body={(rowData) => {
                                const rank = classRanks[rowData.classId] || 0;
                                if (rank === 0) return <span>-</span>;
                                let textColor = 'text-600';
                                let trophyColor = '';
                                if (rank === 1) {
                                    textColor = 'text-yellow-600';
                                    trophyColor = '#FFD700';
                                } else if (rank === 2) {
                                    textColor = 'text-gray-500';
                                    trophyColor = '#C0C0C0';
                                } else if (rank === 3) {
                                    textColor = 'text-orange-600';
                                    trophyColor = '#CD7F32';
                                }

                                return (
                                    <div className={`flex align-items-center font-bold ${textColor}`}>
                                        {rank}위
                                        {rank <= 3 && <i className="pi pi-trophy ml-1" style={{ color: trophyColor }}></i>}
                                    </div>
                                );
                            }}
                        />
                    </DataTable>
                </Card>
            </div>
        </div>
    );
};

export default DetailsTable;
