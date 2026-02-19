'use client';

import React, { useState } from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';

const ManualPage = () => {
    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <h1 className="mb-4">시스템 사용 매뉴얼</h1>
                    <p className="text-600 mb-5">
                        출석부, 사용자 목록, 학생 목록, 클래스 목록 기능 사용 방법을 안내합니다.
                    </p>

                    <Accordion multiple>
                        {/* 출석부 매뉴얼 */}
                        <AccordionTab header="출석부">
                            <div className="p-3">
                                <h3 className="mb-3">출석부 기능</h3>
                                
                                <div className="mb-4">
                                    <h4 className="mb-2">1. 출석부 조회</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>상단의 <strong>"수업클래스 선택"</strong> 드롭다운에서 클래스를 선택합니다.</li>
                                        <li><strong>"월 선택"</strong> 캘린더에서 조회할 월을 선택합니다.</li>
                                        <li>클래스와 월을 모두 선택하면 해당 월의 출석부가 자동으로 로드됩니다.</li>
                                        <li>출석부가 없으면 자동으로 신규 생성되며, <Tag severity="success" value="출석부 신규생성완료!" /> 메시지가 표시됩니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">2. 출석 상태 입력</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>각 학생의 날짜별 <strong>"출석"</strong> 컬럼에서 드롭다운을 클릭합니다.</li>
                                        <li>다음 중 하나를 선택합니다:
                                            <ul className="ml-4 mt-2">
                                                <li><Tag severity="secondary" value="없음" /> - 출석 상태 없음</li>
                                                <li><Tag severity="success" value="수업출석" /> - 정상 출석</li>
                                                <li><Tag severity="danger" value="수업결석" /> - 결석</li>
                                                <li><Tag severity="info" value="보강출석" /> - 보강 수업 출석</li>
                                                <li><Tag severity="warning" value="보강결석" /> - 보강 수업 결석</li>
                                                <li><Tag severity="primary" value="클리닉출석" /> - 클리닉 출석</li>
                                                <li><Tag severity="danger" value="클리닉결석" /> - 클리닉 결석</li>
                                            </ul>
                                        </li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">3. 숙제 진행률 입력</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>각 학생의 날짜별 <strong>"숙제"</strong> 컬럼에서 드롭다운을 클릭합니다.</li>
                                        <li>숙제 진행률을 선택합니다: 0%, 25%, 50%, 75%, 100%</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">4. 출석부 저장</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>출석 및 숙제 정보를 입력한 후 상단의 <Button label="출석부 저장" icon="pi pi-save" className="p-button-success p-button-sm" /> 버튼을 클릭합니다.</li>
                                        <li>저장이 완료되면 <Tag severity="success" value="출석부가 저장되었습니다." /> 메시지가 표시됩니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">5. 학생 검색</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>상단 검색창에 학생 이름을 입력하면 해당 학생만 필터링되어 표시됩니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">6. 오늘 날짜로 이동</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li><Button label="오늘날짜로" icon="pi pi-refresh" className="p-button-sm" /> 버튼을 클릭하면 현재 날짜 컬럼으로 자동 스크롤됩니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">참고사항</h4>
                                    <ul className="ml-4 line-height-3">
                                        <li>출석부는 클래스와 월 단위로 관리됩니다.</li>
                                        <li>출석부가 없으면 자동으로 생성되며, 해당 클래스의 모든 학생이 포함됩니다.</li>
                                        <li>날짜별로 구분선이 표시되어 가독성이 향상됩니다.</li>
                                        <li>일요일과 공휴일은 빨간색으로, 토요일은 파란색으로 표시됩니다.</li>
                                    </ul>
                                </div>
                            </div>
                        </AccordionTab>

                        {/* 사용자 목록 매뉴얼 */}
                        <AccordionTab header="사용자 목록">
                            <div className="p-3">
                                <h3 className="mb-3">사용자 목록 기능</h3>
                                
                                <div className="mb-4">
                                    <h4 className="mb-2">1. 사용자 조회</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>사용자 목록 페이지에 접속하면 등록된 모든 사용자가 표시됩니다.</li>
                                        <li>테이블의 컬럼 헤더를 클릭하여 정렬할 수 있습니다.</li>
                                        <li>필터 기능을 사용하여 특정 조건으로 검색할 수 있습니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">2. 사용자 등록</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>상단의 <Button label="신규" icon="pi pi-plus" className="p-button-info p-button-sm" /> 버튼을 클릭합니다.</li>
                                        <li>팝업에서 다음 정보를 입력합니다:
                                            <ul className="ml-4 mt-2">
                                                <li><strong>이메일</strong> (필수)</li>
                                                <li><strong>비밀번호</strong> (필수)</li>
                                                <li><strong>사용자 ID</strong> (필수)</li>
                                                <li><strong>사용자 이름</strong> (필수)</li>
                                                <li><strong>권한</strong> (필수) - 관리자, 학생, 선생님, 학부모님 중 선택</li>
                                            </ul>
                                        </li>
                                        <li><Button label="등록" icon="pi pi-check" className="p-button-sm" /> 버튼을 클릭하여 저장합니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">3. 사용자 수정</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>수정할 사용자 행의 <Button icon="pi pi-pencil" className="p-button-warning p-button-sm p-button-rounded p-button-outlined" /> 버튼을 클릭합니다.</li>
                                        <li>팝업에서 정보를 수정합니다.</li>
                                        <li><Button label="저장" icon="pi pi-check" className="p-button-sm" /> 버튼을 클릭하여 저장합니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">4. 비밀번호 초기화</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>비밀번호를 초기화할 사용자 행의 <Button icon="pi pi-key" className="p-button-secondary p-button-sm p-button-rounded p-button-outlined" /> 버튼을 클릭합니다.</li>
                                        <li>확인 메시지에서 확인을 클릭하면 비밀번호가 초기화됩니다.</li>
                                        <li>초기 비밀번호는 <strong>"chocho1234"</strong>입니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">5. 사용자 삭제</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>삭제할 사용자를 체크박스로 선택합니다 (다중 선택 가능).</li>
                                        <li>상단의 <Button label="삭제" icon="pi pi-trash" className="p-button-danger p-button-sm" /> 버튼을 클릭합니다.</li>
                                        <li>확인 메시지에서 확인을 클릭하면 선택한 사용자가 삭제됩니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">참고사항</h4>
                                    <ul className="ml-4 line-height-3">
                                        <li>권한 컬럼에는 선택한 권한의 라벨이 표시됩니다 (관리자, 학생, 선생님, 학부모님).</li>
                                        <li>삭제 작업은 확인 모달이 표시되어 실수를 방지합니다.</li>
                                    </ul>
                                </div>
                            </div>
                        </AccordionTab>

                        {/* 학생 목록 매뉴얼 */}
                        <AccordionTab header="학생 목록">
                            <div className="p-3">
                                <h3 className="mb-3">학생 목록 기능</h3>
                                
                                <div className="mb-4">
                                    <h4 className="mb-2">1. 학생 조회</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>학생 목록 페이지에 접속하면 등록된 모든 학생이 표시됩니다.</li>
                                        <li>테이블의 컬럼 헤더를 클릭하여 정렬할 수 있습니다.</li>
                                        <li>필터 기능을 사용하여 특정 조건으로 검색할 수 있습니다.</li>
                                        <li>각 행의 왼쪽 확장 아이콘(▶)을 클릭하면 해당 학생이 수강 중인 수업 목록을 확인할 수 있습니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">2. 학생 등록</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>상단의 <Button label="신규" icon="pi pi-plus" className="p-button-info p-button-sm" /> 버튼을 클릭합니다.</li>
                                        <li>팝업에서 다음 정보를 입력합니다:
                                            <ul className="ml-4 mt-2">
                                                <li><strong>이름</strong> (필수) - 쉼표(,)로 구분하여 여러 명을 한 번에 등록할 수 있습니다 (예: 홍길동, 김철수, 이영희)</li>
                                                <li><strong>학년</strong> (필수) - 드롭다운에서 선택 (1, 2, 3)</li>
                                                <li><strong>학교</strong> (필수)</li>
                                                <li><strong>등록일자</strong> (선택) - 캘린더에서 선택 (미입력 시 현재 날짜)</li>
                                                <li><strong>설명</strong> (선택) - 여러 줄 입력 가능</li>
                                            </ul>
                                        </li>
                                        <li><Button label="등록" icon="pi pi-check" className="p-button-sm" /> 버튼을 클릭하여 저장합니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">3. 학생 수정</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>수정할 학생 행의 <Button icon="pi pi-pencil" className="p-button-warning p-button-sm p-button-rounded p-button-outlined" /> 버튼을 클릭합니다.</li>
                                        <li>팝업에서 정보를 수정합니다.</li>
                                        <li>수정 모드에서는 <strong>"퇴원 여부"</strong> 체크박스가 표시되어 퇴원 상태를 변경할 수 있습니다.</li>
                                        <li><Button label="저장" icon="pi pi-check" className="p-button-sm" /> 버튼을 클릭하여 저장합니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">4. 입원/퇴원 처리</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li><strong>일괄 처리:</strong>
                                            <ul className="ml-4 mt-2">
                                                <li>입원/퇴원 처리할 학생들을 체크박스로 선택합니다.</li>
                                                <li>상단의 <Button label="입원" icon="pi pi-sign-in" className="p-button-success p-button-sm" /> 또는 <Button label="퇴원" icon="pi pi-sign-out" className="p-button-warning p-button-sm" /> 버튼을 클릭합니다.</li>
                                                <li>확인 메시지에서 확인을 클릭하면 처리됩니다.</li>
                                            </ul>
                                        </li>
                                        <li><strong>개별 처리:</strong>
                                            <ul className="ml-4 mt-2">
                                                <li>각 학생 행의 <strong>"작업"</strong> 컬럼에서 상태에 따라 버튼이 표시됩니다:
                                                    <ul className="ml-4 mt-2">
                                                        <li>재학 중인 학생: <Button icon="pi pi-sign-out" className="p-button-warning p-button-sm p-button-rounded p-button-outlined" /> (퇴원) 버튼</li>
                                                        <li>퇴원한 학생: <Button icon="pi pi-sign-in" className="p-button-success p-button-sm p-button-rounded p-button-outlined" /> (입원) 버튼</li>
                                                    </ul>
                                                </li>
                                            </ul>
                                        </li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">5. 학생 삭제</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>삭제할 학생을 체크박스로 선택합니다 (다중 선택 가능).</li>
                                        <li>상단의 <Button label="삭제" icon="pi pi-trash" className="p-button-danger p-button-sm" /> 버튼을 클릭합니다.</li>
                                        <li>확인 메시지에서 확인을 클릭하면 선택한 학생이 삭제됩니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">6. 수강 중인 수업 확인</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>각 학생 행의 왼쪽 확장 아이콘(▶)을 클릭합니다.</li>
                                        <li>확장된 행에서 해당 학생이 수강 중인 수업 목록을 확인할 수 있습니다.</li>
                                        <li>수업 정보에는 수업명, 선생님, 개강일, 종강일, 설명이 포함됩니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">참고사항</h4>
                                    <ul className="ml-4 line-height-3">
                                        <li>상태 컬럼에서 <Tag severity="success" value="재학" /> 또는 <Tag severity="danger" value="퇴원" /> 상태를 확인할 수 있습니다.</li>
                                        <li>입원일자는 등록일자를 의미하며, YYYY-MM-DD 형식으로 표시됩니다.</li>
                                        <li>수정일자는 마지막 수정 시간을 YYYY-MM-DD HH:mm 형식으로 표시합니다.</li>
                                    </ul>
                                </div>
                            </div>
                        </AccordionTab>

                        {/* 클래스 목록 매뉴얼 */}
                        <AccordionTab header="클래스 목록">
                            <div className="p-3">
                                <h3 className="mb-3">클래스 목록 기능</h3>
                                
                                <div className="mb-4">
                                    <h4 className="mb-2">1. 클래스 조회</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>클래스 목록 페이지에 접속하면 등록된 모든 클래스가 표시됩니다.</li>
                                        <li>테이블의 컬럼 헤더를 클릭하여 정렬할 수 있습니다.</li>
                                        <li>필터 기능을 사용하여 특정 조건으로 검색할 수 있습니다.</li>
                                        <li>각 행의 왼쪽 확장 아이콘(▶)을 클릭하면 해당 클래스에 등록된 학생 목록을 확인할 수 있습니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">2. 클래스 등록</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>상단의 <Button label="신규" icon="pi pi-plus" className="p-button-info p-button-sm" /> 버튼을 클릭합니다.</li>
                                        <li>팝업에서 다음 정보를 입력합니다:
                                            <ul className="ml-4 mt-2">
                                                <li><strong>클래스명</strong> (필수)</li>
                                                <li><strong>선생님</strong> (필수)</li>
                                                <li><strong>학생</strong> (선택) - <Button label="학생 선택" icon="pi pi-users" className="p-button-outlined p-button-sm" /> 버튼을 클릭하여 학생 선택 팝업을 엽니다.
                                                    <ul className="ml-4 mt-2">
                                                        <li>팝업에서 입원한 학생만 표시됩니다.</li>
                                                        <li>검색 기능을 사용하여 학생을 찾을 수 있습니다.</li>
                                                        <li>체크박스로 여러 학생을 선택할 수 있습니다.</li>
                                                        <li>확인 버튼을 클릭하면 선택한 학생들이 클래스에 등록됩니다.</li>
                                                    </ul>
                                                </li>
                                                <li><strong>설명</strong> (필수)</li>
                                                <li><strong>개강일시</strong> (선택) - 캘린더에서 선택</li>
                                                <li><strong>종강일시</strong> (선택) - 캘린더에서 선택</li>
                                                <li><strong>종강 여부</strong> (선택) - 체크박스로 선택</li>
                                            </ul>
                                        </li>
                                        <li><Button label="등록" icon="pi pi-check" className="p-button-sm" /> 버튼을 클릭하여 저장합니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">3. 클래스 수정</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>수정할 클래스 행의 <Button icon="pi pi-pencil" className="p-button-warning p-button-sm p-button-rounded p-button-outlined" /> 버튼을 클릭합니다.</li>
                                        <li>팝업에서 정보를 수정합니다.</li>
                                        <li>학생 목록에서 Chip의 X 버튼을 클릭하여 학생을 제거할 수 있습니다.</li>
                                        <li><Button label="저장" icon="pi pi-check" className="p-button-sm" /> 버튼을 클릭하여 저장합니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">4. 개강/종강 처리</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li><strong>일괄 처리:</strong>
                                            <ul className="ml-4 mt-2">
                                                <li>처리할 클래스들을 체크박스로 선택합니다.</li>
                                                <li>상단의 <Button label="개강" icon="pi pi-play" className="p-button-success p-button-sm" /> 또는 <Button label="종강" icon="pi pi-stop" className="p-button-warning p-button-sm" /> 버튼을 클릭합니다.</li>
                                                <li>확인 메시지에서 확인을 클릭하면 처리됩니다.</li>
                                            </ul>
                                        </li>
                                        <li><strong>개별 처리:</strong>
                                            <ul className="ml-4 mt-2">
                                                <li>각 클래스 행의 <strong>"작업"</strong> 컬럼에서 상태에 따라 버튼이 표시됩니다:
                                                    <ul className="ml-4 mt-2">
                                                        <li>진행 중인 클래스: <Button icon="pi pi-stop" className="p-button-danger p-button-sm p-button-rounded p-button-outlined" /> (종강) 버튼</li>
                                                        <li>종강한 클래스: <Button icon="pi pi-play" className="p-button-success p-button-sm p-button-rounded p-button-outlined" /> (개강) 버튼</li>
                                                    </ul>
                                                </li>
                                            </ul>
                                        </li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">5. 클래스 삭제</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>삭제할 클래스를 체크박스로 선택합니다 (다중 선택 가능).</li>
                                        <li>상단의 <Button label="삭제" icon="pi pi-trash" className="p-button-danger p-button-sm" /> 버튼을 클릭합니다.</li>
                                        <li>확인 메시지에서 확인을 클릭하면 선택한 클래스가 삭제됩니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">6. 등록된 학생 확인</h4>
                                    <ol className="ml-4 line-height-3">
                                        <li>각 클래스 행의 왼쪽 확장 아이콘(▶)을 클릭합니다.</li>
                                        <li>확장된 행에서 해당 클래스에 등록된 학생 목록을 확인할 수 있습니다.</li>
                                        <li>학생 정보에는 학생명, 학년, 학교가 표시됩니다.</li>
                                    </ol>
                                </div>

                                <hr className="my-4" />

                                <div className="mb-4">
                                    <h4 className="mb-2">참고사항</h4>
                                    <ul className="ml-4 line-height-3">
                                        <li>상태 컬럼에서 <Tag severity="success" value="진행중" /> 또는 <Tag severity="danger" value="종강" /> 상태를 확인할 수 있습니다.</li>
                                        <li>클래스에 등록할 수 있는 학생은 입원한 학생만 가능합니다.</li>
                                        <li>학생 선택 팝업에서는 이름, ID, 학교, 학년, 설명으로 검색할 수 있습니다.</li>
                                        <li>개강일시와 종강일시는 YYYY-MM-DD 형식으로 표시됩니다.</li>
                                    </ul>
                                </div>
                            </div>
                        </AccordionTab>
                    </Accordion>
                </div>
            </div>
        </div>
    );
};

export default ManualPage;
