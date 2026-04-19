'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { CustomEditor } from '@/components/editor/CustomEditor';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import dayjs from 'dayjs';

interface StudentSettlement {
    studentId: string;
    name: string;
    school: string;
    grade: string;
    classStr: string;
    totalPraiseCnt: number;
    rank: number;
    prize: string;
}

const PraiseSettlementPage = () => {
    const [startDate, setStartDate] = useState<Date>(dayjs().startOf('month').toDate());
    const [endDate, setEndDate] = useState<Date>(dayjs().endOf('month').toDate());
    const [rankLimit, setRankLimit] = useState<number>(3);
    const [prizes, setPrizes] = useState<string[]>(['1등', '2등', '3등']);
    const [settlementData, setSettlementData] = useState<StudentSettlement[]>([]);
    const [loading, setLoading] = useState(false);
    const [reportVisible, setReportVisible] = useState(false);
    const [reportDelta, setReportDelta] = useState<any>(null);

    const http = useHttp();
    const { showToast } = useToast();

    // 동적으로 상품 입력 배열 길이 조절
    useEffect(() => {
        if (rankLimit > prizes.length) {
            setPrizes([...prizes, ...Array(rankLimit - prizes.length).fill('')]);
        } else if (rankLimit < prizes.length) {
            setPrizes(prizes.slice(0, rankLimit));
        }
    }, [rankLimit]);

    const handlePrizeChange = (index: number, value: string) => {
        const newPrizes = [...prizes];
        newPrizes[index] = value;
        setPrizes(newPrizes);
    };

    const calculateSettlement = async () => {
        setLoading(true);
        try {
            const dateFrom = dayjs(startDate).startOf('month').format('YYYYMMDD');
            const dateTo = dayjs(endDate).endOf('month').format('YYYYMMDD');

            const params = { dateFrom, dateTo };
            const response = await http.get('/choiMath/attendance/getPraiseStatistics', { params });
            const rawData = response.data || [];

            // 1. 고유 점수 추출 및 정렬 (내림차순)
            const uniqueScores = Array.from(
                new Set<number>(rawData.map((item: any) => item.totalPraiseCnt as number))
            ).sort((a: number, b: number) => b - a);

            // 2. 학생별로 순위 및 상품 매핑
            const processedData: StudentSettlement[] = rawData.map((item: any) => {
                // Dense Ranking: 1, 1, 2, 3...
                const rank = uniqueScores.indexOf(item.totalPraiseCnt) + 1;
                let prize = '';
                if (rank > 0 && rank <= rankLimit) {
                    prize = prizes[rank - 1] || '';
                }

                return {
                    studentId: `${item.studentId}_${
                        item.classes ? item.classes.map((c: any) => c.className).join(',') : item.className || ''
                    }`, // DataTable key를 위해 고유화
                    name: item.name,
                    school: item.school || '',
                    grade: item.grade || '',
                    classStr: item.classes
                        ? item.classes.map((c: any) => c.className).join(', ')
                        : item.className || '',
                    totalPraiseCnt: item.totalPraiseCnt,
                    rank,
                    prize
                };
            });

            // 3. 결산 대상만 필터링
            const sortedData = processedData
                .filter((item) => item.totalPraiseCnt > 0) // 칭찬이 있는 학생만
                .sort((a, b) => a.rank - b.rank); // 순위 오름차순 정렬

            setSettlementData(sortedData);

            showToast({
                severity: 'success',
                summary: '조회 완료',
                detail: '칭찬 결산 데이터가 계산되었습니다.'
            });
        } catch (error: any) {
            console.error('Error fetching praise settlement:', error);
            showToast({
                severity: 'error',
                summary: '조회 실패',
                detail: error.response?.data?.message || '결산 데이터를 불러오는데 실패했습니다.'
            });
        } finally {
            setLoading(false);
        }
    };

    const generateReportDelta = () => {
        const winners = settlementData.filter((item) => item.rank <= rankLimit);
        if (winners.length === 0) return { ops: [{ insert: '당첨자가 없습니다.\n' }] };

        const startStr = dayjs(startDate).format('YYYY년 MM월');
        const endStr = dayjs(endDate).format('YYYY년 MM월');
        const periodStr = startStr === endStr ? startStr : `${startStr} ~ ${endStr}`;

        // 그룹화
        const grouped = winners.reduce((acc: any, curr) => {
            if (!acc[curr.rank]) {
                acc[curr.rank] = {
                    prize: curr.prize,
                    students: []
                };
            }
            acc[curr.rank].students.push(curr);
            return acc;
        }, {});

        const ops: any[] = [];
        ops.push({ insert: '📢 [칭찬 결산 당첨자 안내]\n', attributes: { bold: true } });
        ops.push({ insert: `🗓 결산 기간: ${periodStr}\n\n` });

        const getIcon = (rank: number) => {
            if (rank === 1) return '🏆';
            if (rank === 2) return '🥈';
            if (rank === 3) return '🥉';
            return '🏅';
        };

        Object.keys(grouped)
            .sort((a, b) => Number(a) - Number(b))
            .forEach((rank) => {
                const group = grouped[rank];
                const icon = getIcon(Number(rank));
                ops.push({
                    insert: `${icon} ${rank}위 - ${group.prize || '상품 미정'} (총 ${group.students.length}명)\n`,
                    attributes: { bold: true }
                });

                group.students.forEach((student: any) => {
                    ops.push({ insert: ` - ` });
                    ops.push({ insert: student.name, attributes: { bold: true, color: '#2563eb' } }); // 파란색 이름 강조
                    const infoStr = [student.school, student.grade, student.classStr].filter(Boolean).join(' ');
                    ops.push({ insert: ` ${infoStr ? `(${infoStr})` : ''} : ${student.totalPraiseCnt}개\n` });
                });
                ops.push({ insert: `\n` });
            });

        return { ops };
    };

    const copyReport = () => {
        let text = '';
        if (reportDelta && reportDelta.ops) {
            reportDelta.ops.forEach((op: any) => {
                if (typeof op.insert === 'string') {
                    text += op.insert;
                }
            });
        }

        navigator.clipboard
            .writeText(text)
            .then(() => {
                showToast({
                    severity: 'success',
                    summary: '복사 완료',
                    detail: '리포트 텍스트가 클립보드에 복사되었습니다.'
                });
            })
            .catch((err) => {
                console.error('Copy failed', err);
                showToast({
                    severity: 'error',
                    summary: '복사 실패',
                    detail: '클립보드 복사에 실패했습니다.'
                });
            });
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <h5>칭찬 결산</h5>
                    <div className="flex flex-column gap-4">
                        <div className="flex flex-wrap gap-4">
                            <div className="flex flex-column gap-2">
                                <label className="font-bold">시작 월</label>
                                <Calendar
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.value as Date)}
                                    view="month"
                                    dateFormat="yy/mm"
                                    placeholder="시작 월"
                                    showIcon
                                    locale="ko"
                                    appendTo="self"
                                />
                            </div>
                            <div className="flex flex-column gap-2">
                                <label className="font-bold">종료 월</label>
                                <Calendar
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.value as Date)}
                                    view="month"
                                    dateFormat="yy/mm"
                                    placeholder="종료 월"
                                    showIcon
                                    locale="ko"
                                    appendTo="self"
                                    minDate={startDate}
                                />
                            </div>
                            <div className="flex flex-column gap-2">
                                <label className="font-bold">시상 등수 커트라인</label>
                                <InputNumber
                                    value={rankLimit}
                                    onValueChange={(e) => setRankLimit(e.value || 0)}
                                    min={1}
                                    max={20}
                                    showButtons
                                />
                            </div>
                            <div className="flex align-items-end">
                                <Button
                                    label="결산하기"
                                    icon="pi pi-check-circle"
                                    className="p-button-primary"
                                    onClick={calculateSettlement}
                                    loading={loading}
                                />
                            </div>
                        </div>

                        <div className="flex flex-column gap-3 mt-3">
                            <label className="font-bold">등수별 상품 설정</label>
                            <div className="grid">
                                {prizes.map((prize, idx) => (
                                    <div key={idx} className="col-12 md:col-6 lg:col-4 xl:col-3">
                                        <div className="p-inputgroup">
                                            <span className="p-inputgroup-addon bg-primary text-white font-bold">
                                                {idx + 1}등
                                            </span>
                                            <InputText
                                                placeholder={`${idx + 1}등 상품명 입력`}
                                                value={prize}
                                                onChange={(e) => handlePrizeChange(idx, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <div className="flex justify-content-between align-items-center mb-4">
                        <div className="flex flex-column gap-1">
                            <h5 className="m-0">결산 결과</h5>
                            <span className="text-sm text-500">* 공동 순위(동점자)는 동일한 상품을 지급받습니다.</span>
                        </div>
                        <Button
                            label="리포트 보기"
                            icon="pi pi-file"
                            className="p-button-outlined p-button-secondary"
                            onClick={() => {
                                setReportDelta(generateReportDelta());
                                setReportVisible(true);
                            }}
                            disabled={settlementData.filter((item) => item.rank <= rankLimit).length === 0}
                        />
                    </div>
                    <DataTable
                        value={settlementData}
                        dataKey="studentId"
                        emptyMessage="조회된 결산 데이터가 없습니다."
                        paginator
                        rows={20}
                        rowsPerPageOptions={[20, 50, 100]}
                        stripedRows
                        className="p-datatable-sm"
                    >
                        <Column
                            field="rank"
                            header="순위"
                            headerStyle={{ minWidth: '80px' }}
                            body={(rowData) => (
                                <span
                                    className={`font-bold ${rowData.rank <= rankLimit ? 'text-primary' : 'text-500'}`}
                                >
                                    {rowData.rank}위
                                </span>
                            )}
                            sortable
                        />
                        <Column field="name" header="학생명" sortable headerStyle={{ minWidth: '100px' }} />
                        <Column field="school" header="학교" sortable headerStyle={{ minWidth: '120px' }} />
                        <Column field="grade" header="학년" sortable headerStyle={{ minWidth: '100px' }} />
                        <Column field="classStr" header="클래스" sortable headerStyle={{ minWidth: '150px' }} />
                        <Column
                            field="totalPraiseCnt"
                            header="획득 칭찬 수"
                            headerStyle={{ minWidth: '130px' }}
                            body={(rowData) => (
                                <div className="flex align-items-center gap-2">
                                    <span className="font-bold">{rowData.totalPraiseCnt}개</span>
                                    <i className="pi pi-star-fill text-yellow-500" />
                                </div>
                            )}
                            sortable
                        />
                        <Column
                            field="prize"
                            header="지급 상품"
                            headerStyle={{ minWidth: '150px' }}
                            body={(rowData) =>
                                rowData.rank <= rankLimit ? (
                                    <span className="font-bold text-green-600 bg-green-50 px-2 py-1 border-round">
                                        🎁 {rowData.prize || '상품 미입력'}
                                    </span>
                                ) : (
                                    <span className="text-400">-</span>
                                )
                            }
                        />
                    </DataTable>
                </div>
            </div>

            <Dialog
                header="칭찬 결산 당첨자 리포트"
                visible={reportVisible}
                style={{ width: '80vw', minWidth: '400px', minHeight: '700px' }}
                onHide={() => setReportVisible(false)}
                footer={
                    <div>
                        <Button
                            label="닫기"
                            icon="pi pi-times"
                            onClick={() => setReportVisible(false)}
                            className="p-button-text"
                        />
                        <Button label="복사하기" icon="pi pi-copy" onClick={copyReport} autoFocus />
                    </div>
                }
            >
                <CustomEditor
                    delta={reportDelta}
                    onChange={({ delta }) => setReportDelta(delta)}
                    style={{ height: '500px' }}
                />
            </Dialog>
        </div>
    );
};

export default PraiseSettlementPage;
