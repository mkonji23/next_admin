'use client';

import React from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';

const ManualPage = () => {
    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <div className="flex align-items-center justify-content-between mb-4">
                        <div>
                            <h1 className="m-0 text-900 font-bold">시스템 사용 매뉴얼 v1.2</h1>
                            <p className="text-600 mt-2">
                                각 메뉴의 상세 기능과 조작 방법을 안내합니다. 본 매뉴얼을 통해 모든 기능을 즉시 사용하실 수 있습니다.
                            </p>
                        </div>
                        <i className="pi pi-book text-primary" style={{ fontSize: '2.5rem' }}></i>
                    </div>

                    <Accordion multiple activeIndex={[0, 1, 2, 3]}>
                        {/* 1. Statistics (데이터 분석) */}
                        <AccordionTab header={<div className="flex align-items-center gap-2"><i className="pi pi-chart-bar text-primary"></i><span>1. Statistics (성과 및 통계 분석)</span></div>}>
                            <Accordion multiple className="mt-2">
                                <AccordionTab header="출석 현황 통계">
                                    <div className="p-2 text-700">
                                        <p className="font-bold text-900 mb-2">📌 기능 개요</p>
                                        <p className="mb-3">학원 전체의 월간 출석 추이를 시각화하여 운영 상태를 점검합니다.</p>
                                        <p className="font-bold text-900 mb-2">🚀 사용 방법</p>
                                        <ol className="pl-3 mb-3 line-height-3">
                                            <li>상단 <strong>날짜 선택기</strong>에서 분석을 원하는 연도와 월을 지정합니다.</li>
                                            <li><Button icon="pi pi-search" className="p-button-success p-button-xs mr-1" rounded /> <strong>조회 버튼</strong>을 클릭하여 차트를 생성합니다.</li>
                                            <li>차트의 각 막대나 포인터에 마우스를 올려 <strong>상세 수치(출석인원, 결석률 등)</strong>를 확인합니다.</li>
                                        </ol>
                                    </div>
                                </AccordionTab>
                                <AccordionTab header="학생별 출석현황 통계">
                                    <div className="p-2 text-700">
                                        <p className="font-bold text-900 mb-2">📌 기능 개요</p>
                                        <p className="mb-3">특정 학생의 누적 데이터를 통해 학습 성실도를 정밀 분석합니다.</p>
                                        <p className="font-bold text-900 mb-2">🚀 사용 방법</p>
                                        <ol className="pl-3 mb-3 line-height-3">
                                            <li>좌측 검색창에서 <strong>학생 이름을 검색</strong>하여 대상을 선택합니다.</li>
                                            <li>상단 요약 섹션에서 <strong>누적 출석률과 결석 횟수</strong>를 즉시 확인합니다.</li>
                                            <li>하단 리스트를 통해 해당 학생이 언제, 어떤 사유로 결석했는지 <strong>과거 이력</strong>을 검토합니다.</li>
                                        </ol>
                                    </div>
                                </AccordionTab>
                                <AccordionTab header="칭찬 현황 통계">
                                    <div className="p-2 text-700">
                                        <p className="font-bold text-900 mb-2">📌 기능 개요</p>
                                        <p className="mb-3">학생들의 칭찬 내역을 관리하고 포인트를 부여하는 동기부여 기능입니다.</p>
                                        <p className="font-bold text-900 mb-2">🚀 사용 방법</p>
                                        <ol className="pl-3 mb-3 line-height-3">
                                            <li>포인트를 부여할 학생 행의 <Button icon="pi pi-heart" className="p-button-danger p-button-xs mr-1" rounded /> <strong>하트 버튼</strong>을 클릭합니다.</li>
                                            <li>팝업창에 <strong>칭찬 점수</strong>와 <strong>사유(예: 과제 만점, 태도 우수)</strong>를 입력합니다.</li>
                                            <li>저장 시 학생별 누적 점수에 반영되며 리스트에서 실시간으로 확인 가능합니다.</li>
                                        </ol>
                                    </div>
                                </AccordionTab>
                                <AccordionTab header="학생 칭찬 현황(관리자)">
                                    <div className="p-2 text-700">
                                        <p className="font-bold text-900 mb-2">📌 기능 개요</p>
                                        <p className="mb-3">관리자가 학생 본인의 현황을 어드민 메뉴 내에서 조회하는 기능입니다.</p>
                                        <p className="font-bold text-900 mb-2">🚀 사용 방법</p>
                                        <ol className="pl-3 mb-3 line-height-3">
                                            <li>학생 현황 페이지와 동일한 화면을 관리자 레이아웃에서 <strong>사이드바와 함께</strong> 확인할 수 있습니다.</li>
                                            <li>인증된 학생의 <strong>칭찬 배지, 출석/결석률, 과제 수행률</strong> 등을 종합적으로 파악합니다.</li>
                                        </ol>
                                    </div>
                                </AccordionTab>
                            </Accordion>
                        </AccordionTab>

                        {/* 2. Attendance (현장 운영 관리) */}
                        <AccordionTab header={<div className="flex align-items-center gap-2"><i className="pi pi-check-square text-primary"></i><span>2. Attendance (현장 출석 및 일정)</span></div>}>
                            <Accordion multiple className="mt-2">
                                <AccordionTab header="출석부">
                                    <div className="p-2 text-700">
                                        <p className="font-bold text-900 mb-2">📌 기능 개요</p>
                                        <p className="mb-3">매일 수업 전후로 학생의 출결과 과제 수행도를 실시간으로 기록합니다.</p>
                                        <p className="font-bold text-900 mb-2">🚀 사용 방법</p>
                                        <ol className="pl-3 mb-3 line-height-3">
                                            <li><strong>수업 클래스</strong>와 <strong>해당 월</strong>을 선택합니다. (해당 월 데이터가 없으면 자동 생성됨)</li>
                                            <li><strong>출석 체크:</strong> 각 날짜 셀의 드롭다운을 통해 상태(출석, 결석, 보강 등)를 선택합니다.</li>
                                            <li><strong>숙제 체크:</strong> 숙제 컬럼에서 진행률(0%, 25%, 50%, 75%, 100%)을 선택합니다.</li>
                                            <li><strong>저장:</strong> 입력 후 반드시 우측 상단의 <Button icon="pi pi-save" label="출석부 저장" className="p-button-success p-button-xs mr-1" /> <strong>저장 버튼</strong>을 클릭해야 합니다.</li>
                                            <li><strong>팁:</strong> <Button icon="pi pi-refresh" label="오늘날짜로" className="p-button-info p-button-xs mr-1" /> 클릭 시 현재 날짜 컬럼으로 자동 스크롤됩니다.</li>
                                        </ol>
                                    </div>
                                </AccordionTab>
                                <AccordionTab header="학생별 주간스케줄">
                                    <div className="p-2 text-700">
                                        <p className="font-bold text-900 mb-2">📌 기능 개요</p>
                                        <p className="mb-3">학생 개인별 시간표 및 주간 일정을 관리합니다.</p>
                                        <p className="font-bold text-900 mb-2">🚀 사용 방법</p>
                                        <ol className="pl-3 mb-3 line-height-3">
                                            <li>학생을 선택하여 <strong>주간 달력</strong>을 로드합니다.</li>
                                            <li>일정을 <strong>마우스로 드래그</strong>하여 시간을 변경하거나 클릭하여 상세 내용을 수정합니다.</li>
                                            <li>정규 수업 외에 추가된 <strong>보강 일정</strong>을 시각적으로 관리하여 충돌을 방지합니다.</li>
                                        </ol>
                                    </div>
                                </AccordionTab>
                                <AccordionTab header="조교쌤 일자별 업무">
                                    <div className="p-2 text-700">
                                        <p className="font-bold text-900 mb-2">📌 기능 개요</p>
                                        <p className="mb-3">조교 선생님들의 일별 업무 목록을 관리하고 체크합니다.</p>
                                        <p className="font-bold text-900 mb-2">🚀 사용 방법</p>
                                        <ol className="pl-3 mb-3 line-height-3">
                                            <li>특정 날짜를 선택하여 당일의 <strong>할 일(To-Do) 목록</strong>을 확인합니다.</li>
                                            <li>업무를 추가하거나 완료된 업무를 <strong>체크</strong>하여 진행 상태를 갱신합니다.</li>
                                        </ol>
                                    </div>
                                </AccordionTab>
                            </Accordion>
                        </AccordionTab>

                        {/* 3. Share (공유 및 소통) */}
                        <AccordionTab header={<div className="flex align-items-center gap-2"><i className="pi pi-share-alt text-primary"></i><span>3. Share (공유 및 소통)</span></div>}>
                            <Accordion multiple className="mt-2">
                                <AccordionTab header="카카오 공유 게시판">
                                    <div className="p-2 text-700">
                                        <p className="font-bold text-900 mb-2">📌 기능 개요</p>
                                        <p className="mb-3">학부모 및 학생에게 카카오톡으로 안내 사항이나 리포트를 전송합니다.</p>
                                        <p className="font-bold text-900 mb-2">🚀 사용 방법</p>
                                        <ol className="pl-3 mb-3 line-height-3">
                                            <li>공유 템플릿을 선택하거나 메시지 내용을 직접 입력합니다.</li>
                                            <li>수신 대상(학생/학부모)을 선택하고 <strong>카카오톡 아이콘</strong> 버튼을 통해 메시지를 전송합니다.</li>
                                        </ol>
                                    </div>
                                </AccordionTab>
                                <AccordionTab header="공유 템플릿 관리">
                                    <div className="p-2 text-700">
                                        <p className="font-bold text-900 mb-2">📌 기능 개요</p>
                                        <p className="mb-3">자주 사용하는 알림 메시지 템플릿을 사전 등록하여 관리합니다.</p>
                                        <p className="font-bold text-900 mb-2">🚀 사용 방법</p>
                                        <ol className="pl-3 mb-3 line-height-3">
                                            <li>새로운 템플릿을 <strong>추가</strong>하거나 기존 템플릿을 수정합니다.</li>
                                            <li>저장된 템플릿은 '카카오 공유 게시판' 등에서 <strong>빠르게 불러와</strong> 활용할 수 있습니다.</li>
                                        </ol>
                                    </div>
                                </AccordionTab>
                            </Accordion>
                        </AccordionTab>

                        {/* 4. Settings (기준 데이터 설정) */}
                        <AccordionTab header={<div className="flex align-items-center gap-2"><i className="pi pi-cog text-primary"></i><span>4. Settings (인프라 및 환경 설정)</span></div>}>
                            <Accordion multiple className="mt-2">
                                <AccordionTab header="학생 목록">
                                    <div className="p-2 text-700">
                                        <p className="font-bold text-900 mb-2">🚀 사용 방법</p>
                                        <ol className="pl-3 mb-3 line-height-3">
                                            <li><strong>개별/멀티 등록:</strong> '신규' 버튼 클릭 후 이름 칸에 <strong>콤마(,)</strong>를 사용하여 다건 등록 가능합니다.</li>
                                            <li><strong>엑셀 대량 등록:</strong> <Button icon="pi pi-file-excel" label="엑셀 업로드" className="p-button-help p-button-xs mr-1" /> 를 통해 수십 명의 학생을 한 번에 추가합니다.</li>
                                            <li><strong>엑셀 백업:</strong> <Button icon="pi pi-download" label="엑셀 다운로드" className="p-button-secondary p-button-xs mr-1" /> 로 현재 명단을 추출합니다.</li>
                                            <li><strong>정보 조회:</strong> 행 좌측의 <strong>(▶) 확장 아이콘</strong>을 누르면 수강 중인 수업 명단을 즉시 확인합니다.</li>
                                            <li><strong>입/퇴원:</strong> 상단 [입원]/[퇴원] 버튼으로 학생의 재학 상태를 일괄 관리합니다.</li>
                                        </ol>
                                    </div>
                                </AccordionTab>
                                <AccordionTab header="클래스 목록">
                                    <div className="p-2 text-700">
                                        <p className="font-bold text-900 mb-2">🚀 사용 방법</p>
                                        <ol className="pl-3 mb-3 line-height-3">
                                            <li>'신규' 클릭 후 수업명과 담당 선생님을 지정합니다.</li>
                                            <li><Button icon="pi pi-users" label="학생 선택" className="p-button-outlined p-button-xs mr-1" /> 버튼으로 <strong>입원(재학) 중인 학생</strong>들만 검색하여 배정합니다.</li>
                                            <li><strong>진행 관리:</strong> 수업이 실제 시작되면 <Button icon="pi pi-play" className="p-button-success p-button-xs mr-1" rounded outlined /> <strong>개강</strong> 상태여야 출석부에 나타납니다.</li>
                                        </ol>
                                    </div>
                                </AccordionTab>
                                <AccordionTab header="사용자 목록">
                                    <div className="p-2 text-700">
                                        <p className="font-bold text-900 mb-2">🚀 주요 기능</p>
                                        <ul className="pl-3 mb-3 line-height-3">
                                            <li><Button icon="pi pi-plus" label="신규" className="p-button-info p-button-xs mr-1" /> <strong>계정 생성:</strong> 선생님, 학부모 계정을 생성하고 권한을 부여합니다.</li>
                                            <li><Button icon="pi pi-key" className="p-button-secondary p-button-xs mr-1" rounded outlined /> <strong>초기화:</strong> 비밀번호를 'chocho1234'로 즉시 초기화합니다.</li>
                                        </ul>
                                    </div>
                                </AccordionTab>
                            </Accordion>
                        </AccordionTab>

                        {/* 5. HELP (지원 가이드) */}
                        <AccordionTab header={<div className="flex align-items-center gap-2"><i className="pi pi-question-circle text-primary"></i><span>5. HELP (지원 가이드)</span></div>}>
                            <div className="p-3 text-700">
                                <p><strong>사용 매뉴얼:</strong> 현재 보고 계신 페이지로, 시스템의 전반적인 운영 프로세스와 각 메뉴의 사용법을 확인합니다.</p>
                            </div>
                        </AccordionTab>

                        {/* 6. 학생용 (공용 페이지) */}
                        <AccordionTab header={<div className="flex align-items-center gap-2"><i className="pi pi-desktop text-primary"></i><span>6. 학생용 (현황 조회 레이아웃)</span></div>}>
                            <Accordion multiple className="mt-2">
                                <AccordionTab header="학생 칭찬 현황">
                                    <div className="p-2 text-700">
                                        <p className="font-bold text-900 mb-2">📌 기능 개요</p>
                                        <p className="mb-3">학생 본인 또는 학부모가 HOC(고차 컴포넌트) 인증을 거쳐 개인별 학업 달성률을 확인할 수 있는 공용 뷰(`/student-status`) 페이지입니다.</p>
                                        <p className="font-bold text-900 mb-2">🚀 사용 방법</p>
                                        <ol className="pl-3 mb-3 line-height-3">
                                            <li>초기 진입 시 <strong>학생 이름</strong>과 <strong>전화번호</strong>(학생 본인 또는 학부모)를 입력합니다. (숫자만 입력해도 무방)</li>
                                            <li>인증 완료 후 상단에 <strong>총 칭찬 획득 배지 수</strong>가 시각적으로 표시됩니다.</li>
                                            <li><strong>출석 현황 (도넛 차트):</strong> 툴팁에 마우스를 올리면 출석률, 결석률, 지각률 등의 % 정보가 표시됩니다.</li>
                                            <li><strong>과제 현황 (다중 도넛 차트):</strong> 수강하는 각 클래스별 과제 수행률과 우측 또는 하단의 <strong>총 달성률</strong>을 확인할 수 있습니다.</li>
                                            <li><strong>하단 칭찬 내역:</strong> 확장 기능을 통해 각 클래스별 칭찬받은 날짜와 당시의 출석/과제율을 목록으로 볼 수 있습니다.</li>
                                        </ol>
                                    </div>
                                </AccordionTab>
                            </Accordion>
                        </AccordionTab>
                    </Accordion>
                </div>
            </div>
        </div>
    );
};

export default ManualPage;
