'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { Message } from 'primereact/message';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import dayjs from 'dayjs';

// ─── Plan Limits ─────────────────────────────────────────────────────────────

/** ImageKit Free Plan */
const IK_LIMITS = {
    bandwidthBytes: 20 * 1024 * 1024 * 1024,         // 20 GB
    mediaLibraryStorageBytes: 3 * 1024 * 1024 * 1024, // 3 GB (fixed)
    videoProcessingUnitsCount: 500,
    extensionUnitsCount: 650,
};

/** Vercel Hobby Plan (공식 사용량 대시보드 기준) */
const VERCEL_LIMITS = {
    cdnRequests: 1_000_000,             // CDN Requests: 1M (1,000,000회)
    fastDataTransferGB: 100,            // Fast Data Transfer: 100 GB
    fastOriginTransferGB: 10,           // Fast Origin Transfer: 10 GB
    functionInvocations: 1_000_000,     // Function Invocations: 1M (1,000,000회)
    functionGBHours: 100,               // Function Duration: 100 GB-Hrs
    edgeMiddlewareInvocations: 1_000_000,// Edge Middleware Invocations: 1M
    buildMinutes: 6000,                 // Build Minutes: 6,000분
};

/** MongoDB Atlas Free Tier */
const MONGO_STORAGE_LIMIT_BYTES = 512 * 1024 * 1024; // 512 MB (Atlas Free Tier)

const WARN_THRESHOLD = 80; // 80% 이상 경고

// ─── Types ───────────────────────────────────────────────────────────────────

interface ImageKitUsage {
    startDate: string;
    endDate: string;
    bandwidthBytes: number;
    mediaLibraryStorageBytes: number;
    videoProcessingUnitsCount: number;
    extensionUnitsCount: number;
    originalCacheStorageBytes: number;
}

interface VercelUsage {
    from: string;
    to: string;
    plan?: string;
    projectCount?: number;
    deploymentCount?: number;
    projects?: { id: string; name: string; updatedAt?: number }[];
    cdnRequests: number;
    bandwidthBytes: number;
    fastDataTransferMB: number;
    bandwidthGB: number;
    fastOriginTransferMB: number;
    fastOriginTransferGB: number;
    functionInvocations: number;
    functionDurationGbHours: number;
    functionGBHours: number;
    buildMinutes: number;
    buildCount: number;
    edgeMiddlewareInvocations: number;
}

interface CollectionStat {
    name: string;
    count: number;
    storageSize: number;
    totalIndexSize: number;
    avgObjSize: number;
}

interface MongoUsage {
    dbName: string;
    dataSize: number;
    storageSize: number;
    indexSize: number;
    totalDocuments: number;
    collections: CollectionStat[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const bytesToReadable = (bytes: number): string => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const usagePct = (used: number, limit: number): number =>
    limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0;

// ─── UsageBarCard ─────────────────────────────────────────────────────────────

interface UsageBarCardProps {
    icon: string;
    label: string;
    usedLabel: string;
    limitLabel: string;
    pct: number;
    note?: string;
    isFixed?: boolean;
}

const UsageBarCard = ({ icon, label, usedLabel, limitLabel, pct, note, isFixed }: UsageBarCardProps) => {
    const isWarning = pct >= WARN_THRESHOLD;
    const isDanger = pct >= 95;
    const barColor = isDanger ? '#ef4444' : isWarning ? '#f97316' : '#22c55e';

    return (
        <div className="col-12 md:col-6">
            <div
                className="card mb-0 h-full"
                style={{
                    border: isWarning ? `2px solid ${barColor}` : '1px solid transparent',
                    borderRadius: '8px',
                    transition: 'border 0.3s',
                }}
            >
                <div className="flex align-items-center justify-content-between mb-3">
                    <div className="flex align-items-center gap-2">
                        <div
                            className="flex align-items-center justify-content-center border-round"
                            style={{ width: '2.2rem', height: '2.2rem', backgroundColor: barColor + '20' }}
                        >
                            <i className={`${icon} text-lg`} style={{ color: barColor }} />
                        </div>
                        <span className="font-semibold text-900">{label}</span>
                        {isFixed && <Tag value="고정" severity="secondary" className="text-xs" />}
                    </div>
                    {isWarning && (
                        <Tag
                            value={isDanger ? '⚠ 위험' : '⚠ 경고'}
                            style={{ backgroundColor: barColor, color: '#fff', fontSize: '0.75rem' }}
                        />
                    )}
                </div>

                <div className="flex align-items-end justify-content-between mb-2">
                    <span className="text-2xl font-bold text-900">{usedLabel}</span>
                    <span className="text-500 text-sm">/ {limitLabel}</span>
                </div>

                <div className="mb-2">
                    <div style={{ height: '10px', borderRadius: '5px', backgroundColor: 'var(--surface-border, #e2e8f0)', overflow: 'hidden' }}>
                        <div
                            style={{
                                height: '100%',
                                width: `${pct}%`,
                                backgroundColor: barColor,
                                borderRadius: '5px',
                                transition: 'width 0.6s ease, background-color 0.3s',
                            }}
                        />
                    </div>
                </div>

                <div className="flex align-items-center justify-content-between">
                    <span className="text-sm font-semibold" style={{ color: barColor }}>
                        {pct}% 사용중
                    </span>
                    {note && <span className="text-xs text-500">{note}</span>}
                </div>

                {isWarning && (
                    <div
                        className="mt-3 p-2 border-round text-sm"
                        style={{ backgroundColor: barColor + '15', color: barColor, border: `1px solid ${barColor}40` }}
                    >
                        <i className="pi pi-exclamation-triangle mr-2" />
                        {isDanger
                            ? `한도의 ${pct}%를 사용했습니다. 즉시 플랜 업그레이드를 검토하세요!`
                            : `한도의 ${pct}%를 사용했습니다. 사용량을 확인하세요.`}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Small Stat Card ──────────────────────────────────────────────────────────

interface StatCardProps {
    icon: string;
    label: string;
    value: string;
    subValue?: string;
    color: string;
    warn?: boolean;
}

const StatCard = ({ icon, label, value, subValue, color, warn }: StatCardProps) => (
    <div className="col-12 md:col-6 lg:col-3">
        <div
            className="card mb-0 h-full"
            style={{ border: warn ? `2px solid #f97316` : '1px solid transparent', borderRadius: '8px' }}
        >
            <div className="flex justify-content-between mb-3">
                <div>
                    <span className="block text-500 font-medium mb-3">{label}</span>
                    <div className="text-900 font-medium text-xl">{value}</div>
                    {subValue && <span className="text-500 text-sm">{subValue}</span>}
                    {warn && (
                        <div className="mt-2 text-xs font-semibold" style={{ color: '#f97316' }}>
                            <i className="pi pi-exclamation-triangle mr-1" />
                            512 MB 한도 80% 이상
                        </div>
                    )}
                </div>
                <div
                    className="flex align-items-center justify-content-center border-round"
                    style={{ width: '2.5rem', height: '2.5rem', backgroundColor: (warn ? '#f97316' : color) + '20' }}
                >
                    <i className={`${icon} text-xl`} style={{ color: warn ? '#f97316' : color }} />
                </div>
            </div>
        </div>
    </div>
);

// ─── Section Header ────────────────────────────────────────────────────────────

const SectionHeader = ({ icon, iconColor, title, badge, subTitle }: { icon: string; iconColor: string; title: string; badge?: React.ReactNode; subTitle?: string }) => (
    <div className="col-12">
        <div className="flex align-items-center gap-2 mb-1">
            <i className={`${icon} text-2xl`} style={{ color: iconColor }} />
            <h5 className="m-0">{title}</h5>
            {badge}
        </div>
        {subTitle && <p className="text-500 text-sm mt-1 mb-0">{subTitle}</p>}
    </div>
);

// ─── Loading Placeholder ───────────────────────────────────────────────────────

const LoadingCard = ({ color }: { color: string }) => (
    <div className="col-12">
        <div className="card flex align-items-center justify-content-center" style={{ minHeight: '140px' }}>
            <i className="pi pi-spin pi-spinner text-3xl" style={{ color }} />
            <span className="ml-3 text-500">데이터 로딩 중...</span>
        </div>
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const SystemUsagePage = () => {
    const http = useHttp();
    const { showToast } = useToast();

    const [imageKitData, setImageKitData] = useState<ImageKitUsage | null>(null);
    const [vercelData, setVercelData] = useState<VercelUsage | null>(null);
    const [mongoData, setMongoData] = useState<MongoUsage | null>(null);
    const [loadingIK, setLoadingIK] = useState(false);
    const [loadingVercel, setLoadingVercel] = useState(false);
    const [loadingMongo, setLoadingMongo] = useState(false);

    // ImageKit 사용량 조회 (최근 30일 기준)
    const fetchImageKitUsage = useCallback(async () => {
        try {
            setLoadingIK(true);
            const startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
            const endDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
            const res = await http.get('/system/usage/imagekit', { params: { startDate, endDate } });
            setImageKitData(res.data);
        } catch {
            showToast({ severity: 'error', summary: '오류', detail: 'ImageKit 사용량 조회 실패' });
        } finally {
            setLoadingIK(false);
        }
    }, []);

    const fetchVercelUsage = useCallback(async () => {
        try {
            setLoadingVercel(true);
            const res = await http.get('/system/usage/vercel');
            setVercelData(res.data);
        } catch {
            showToast({ severity: 'warn', summary: '알림', detail: 'Vercel 사용량 조회 실패 (토큰 확인 필요)' });
        } finally {
            setLoadingVercel(false);
        }
    }, []);

    const fetchMongoUsage = useCallback(async () => {
        try {
            setLoadingMongo(true);
            const res = await http.get('/system/usage/mongodb');
            setMongoData(res.data);
        } catch {
            showToast({ severity: 'error', summary: '오류', detail: 'MongoDB 사용량 조회 실패' });
        } finally {
            setLoadingMongo(false);
        }
    }, []);

    const fetchAll = useCallback(() => {
        fetchImageKitUsage();
        fetchVercelUsage();
        fetchMongoUsage();
    }, [fetchImageKitUsage, fetchVercelUsage, fetchMongoUsage]);

    useEffect(() => { fetchAll(); }, []);

    // ─── 경고 항목 계산 ─────────────────────────────────────────────────────
    const ikWarnings = imageKitData ? [
        { pct: usagePct(imageKitData.bandwidthBytes, IK_LIMITS.bandwidthBytes), label: 'IK 대역폭' },
        { pct: usagePct(imageKitData.mediaLibraryStorageBytes, IK_LIMITS.mediaLibraryStorageBytes), label: 'IK 스토리지' },
        { pct: usagePct(imageKitData.videoProcessingUnitsCount, IK_LIMITS.videoProcessingUnitsCount), label: 'IK 비디오 유닛' },
        { pct: usagePct(imageKitData.extensionUnitsCount, IK_LIMITS.extensionUnitsCount), label: 'IK 익스텐션 유닛' },
    ].filter(w => w.pct >= WARN_THRESHOLD) : [];

    const vercelWarnings = vercelData ? [
        { pct: usagePct(vercelData.cdnRequests, VERCEL_LIMITS.cdnRequests), label: 'Vercel CDN 요청' },
        { pct: usagePct(vercelData.bandwidthGB, VERCEL_LIMITS.fastDataTransferGB), label: 'Vercel 대역폭' },
        { pct: usagePct(vercelData.functionInvocations, VERCEL_LIMITS.functionInvocations), label: 'Vercel 함수 실행' },
        { pct: usagePct(vercelData.functionDurationGbHours, VERCEL_LIMITS.functionGBHours), label: 'Vercel 함수 실행시간' },
        { pct: usagePct(vercelData.buildMinutes, VERCEL_LIMITS.buildMinutes), label: 'Vercel 빌드 시간' },
    ].filter(w => w.pct >= WARN_THRESHOLD) : [];

    const mongoStoragePct = mongoData ? usagePct(mongoData.storageSize, MONGO_STORAGE_LIMIT_BYTES) : 0;
    const mongoWarn = mongoStoragePct >= WARN_THRESHOLD;

    const allWarnings = [...ikWarnings, ...vercelWarnings, ...(mongoWarn ? [{ pct: mongoStoragePct, label: 'MongoDB 스토리지' }] : [])];

    // ─── MongoDB 테이블 helpers ──────────────────────────────────────────────
    const maxStorage = mongoData ? Math.max(...mongoData.collections.map(c => c.storageSize), 1) : 1;

    const storageBarTemplate = (row: CollectionStat) => {
        const pct = Math.round((row.storageSize / maxStorage) * 100);
        return (
            <div className="flex align-items-center gap-2">
                <div style={{ width: '120px', height: '8px', borderRadius: '4px', backgroundColor: 'var(--surface-border, #e2e8f0)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#6366f1', borderRadius: '4px' }} />
                </div>
                <span className="text-sm text-500">{pct}%</span>
            </div>
        );
    };

    return (
        <div className="grid">

            {/* ── 헤더 ─────────────────────────────────────────────────────── */}
            <div className="col-12">
                <div className="card">
                    <div className="flex flex-wrap align-items-center justify-content-between gap-3">
                        <div>
                            <h4 className="m-0 mb-1">시스템 사용량 모니터링</h4>
                            <div className="flex flex-wrap align-items-center gap-2 mt-1">
                                <span className="text-500 text-sm">ImageKit · Vercel · MongoDB 리소스 현황</span>
                                <Tag value="최근 30일 기준" severity="info" />
                                <Tag value="IK Free" severity="warning" />
                                <Tag value="Vercel Hobby" severity="warning" />
                                <Tag value="MongoDB Free" severity="warning" />
                            </div>
                        </div>
                        <div className="flex align-items-center gap-2">
                            <Button
                                icon="pi pi-refresh"
                                label="새로고침"
                                onClick={fetchAll}
                                loading={loadingIK || loadingVercel || loadingMongo}
                                className="p-button-outlined"
                            />
                        </div>
                    </div>

                    {/* 전체 경고 배너 */}
                    {allWarnings.length > 0 && (
                        <div className="mt-3">
                            <Message
                                severity="warn"
                                text={`⚠ 경고: ${allWarnings.map(w => `${w.label} ${w.pct}%`).join(' · ')} — 한도의 80% 이상 사용 중입니다.`}
                                className="w-full"
                                style={{ borderRadius: '6px' }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                SECTION 1: ImageKit (Free Plan)
            ══════════════════════════════════════════════════════════════ */}
            <SectionHeader
                icon="pi pi-image"
                iconColor="#6366f1"
                title="ImageKit 사용량"
                badge={imageKitData && <Tag value={`${imageKitData.startDate} ~ ${imageKitData.endDate}`} severity="info" className="ml-1" />}
                subTitle="Free 플랜 월간 한도 대비 (80% 이상 경고)"
            />

            {loadingIK ? <LoadingCard color="#6366f1" /> : imageKitData ? (
                <>
                    <UsageBarCard icon="pi pi-wifi" label="대역폭 (Bandwidth)" usedLabel={bytesToReadable(imageKitData.bandwidthBytes)} limitLabel="20 GB / 월" pct={usagePct(imageKitData.bandwidthBytes, IK_LIMITS.bandwidthBytes)} note={`${imageKitData.bandwidthBytes.toLocaleString()} bytes`} />
                    <UsageBarCard icon="pi pi-database" label="DAM 스토리지" usedLabel={bytesToReadable(imageKitData.mediaLibraryStorageBytes)} limitLabel="3 GB 고정" pct={usagePct(imageKitData.mediaLibraryStorageBytes, IK_LIMITS.mediaLibraryStorageBytes)} isFixed />
                    <UsageBarCard icon="pi pi-video" label="비디오 처리 유닛" usedLabel={`${imageKitData.videoProcessingUnitsCount.toLocaleString()} VPU`} limitLabel="500 VPU / 월" pct={usagePct(imageKitData.videoProcessingUnitsCount, IK_LIMITS.videoProcessingUnitsCount)} />
                    <UsageBarCard icon="pi pi-cog" label="익스텐션 유닛" usedLabel={`${imageKitData.extensionUnitsCount.toLocaleString()} Units`} limitLabel="650 Units / 월" pct={usagePct(imageKitData.extensionUnitsCount, IK_LIMITS.extensionUnitsCount)} note={`오리지널 캐시: ${bytesToReadable(imageKitData.originalCacheStorageBytes)}`} />
                </>
            ) : (
                <div className="col-12"><div className="card text-center text-500">ImageKit 데이터를 불러올 수 없습니다.</div></div>
            )}

            <div className="col-12"><Divider /></div>

            {/* ══════════════════════════════════════════════════════════════
                SECTION 2: Vercel (Hobby Plan)
            ══════════════════════════════════════════════════════════════ */}
            <SectionHeader
                icon="pi pi-cloud"
                iconColor="var(--text-color, #000000)"
                title="Vercel 사용량"
                badge={vercelData && <Tag value={`${dayjs(vercelData.from).format('MM/DD')} ~ ${dayjs(vercelData.to).format('MM/DD')}`} severity="secondary" className="ml-1" />}
                subTitle="Hobby 플랜 월간 한도 대비 (80% 이상 경고) · VERCEL_ACCESS_TOKEN 필요"
            />

            {loadingVercel ? <LoadingCard color="var(--text-color, #000000)" /> : vercelData ? (
                <>
                    {/* 프로젝트 및 배포 현황 요약 */}
                    <div className="col-12 md:col-6">
                        <div className="card mb-0 h-full">
                            <div className="flex justify-content-between mb-3">
                                <div>
                                    <span className="block text-500 font-medium mb-3">활성 프로젝트</span>
                                    <div className="text-900 font-medium text-xl">{vercelData.projectCount ?? 0}개 프로젝트</div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {vercelData.projects?.map((p) => (
                                            <Tag key={p.id} value={p.name} severity="info" />
                                        ))}
                                    </div>
                                </div>
                                <div
                                    className="flex align-items-center justify-content-center border-round"
                                    style={{ width: '2.5rem', height: '2.5rem', backgroundColor: '#00000015' }}
                                >
                                    <i className="pi pi-folder text-xl text-900" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 md:col-6">
                        <div className="card mb-0 h-full">
                            <div className="flex justify-content-between mb-3">
                                <div>
                                    <span className="block text-500 font-medium mb-3">최근 배포 이력</span>
                                    <div className="text-900 font-medium text-xl">{vercelData.deploymentCount ?? 0}회 배포 감지</div>
                                    <span className="text-500 text-sm">일일 한도: 100회 / 일</span>
                                </div>
                                <div
                                    className="flex align-items-center justify-content-center border-round"
                                    style={{ width: '2.5rem', height: '2.5rem', backgroundColor: '#00000015' }}
                                >
                                    <i className="pi pi-cloud-upload text-xl text-900" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vercel 공식 대시보드 핵심 지표 카드 */}
                    <UsageBarCard
                        icon="pi pi-globe"
                        label="CDN Requests"
                        usedLabel={`${(vercelData.cdnRequests >= 1000 ? (vercelData.cdnRequests / 1000).toFixed(1) + 'K' : vercelData.cdnRequests)} 회`}
                        limitLabel="1M (100만 회) / 월"
                        pct={usagePct(vercelData.cdnRequests, VERCEL_LIMITS.cdnRequests)}
                        note={`총 ${vercelData.cdnRequests.toLocaleString()} 건 요청`}
                    />

                    <UsageBarCard
                        icon="pi pi-send"
                        label="Fast Data Transfer"
                        usedLabel={vercelData.fastDataTransferMB >= 1024 ? `${vercelData.bandwidthGB.toFixed(2)} GB` : `${vercelData.fastDataTransferMB} MB`}
                        limitLabel="100 GB / 월"
                        pct={usagePct(vercelData.bandwidthGB, VERCEL_LIMITS.fastDataTransferGB)}
                        note={`${bytesToReadable(vercelData.bandwidthBytes)} 아웃바운드`}
                    />

                    <UsageBarCard
                        icon="pi pi-cloud-download"
                        label="Fast Origin Transfer"
                        usedLabel={`${vercelData.fastOriginTransferMB} MB`}
                        limitLabel="10 GB / 월"
                        pct={usagePct(vercelData.fastOriginTransferGB, VERCEL_LIMITS.fastOriginTransferGB)}
                        note={`인바운드 / 오리진 전송`}
                    />

                    <UsageBarCard
                        icon="pi pi-bolt"
                        label="Function Invocations"
                        usedLabel={`${(vercelData.functionInvocations >= 1000 ? (vercelData.functionInvocations / 1000).toFixed(1) + 'K' : vercelData.functionInvocations)} 회`}
                        limitLabel="1M (100만 회) / 월"
                        pct={usagePct(vercelData.functionInvocations, VERCEL_LIMITS.functionInvocations)}
                        note={`총 ${vercelData.functionInvocations.toLocaleString()} 회 실행`}
                    />

                    <UsageBarCard
                        icon="pi pi-clock"
                        label="Function Duration"
                        usedLabel={`${vercelData.functionDurationGbHours.toFixed(2)} GB-Hrs`}
                        limitLabel="100 GB-Hrs / 월"
                        pct={usagePct(vercelData.functionDurationGbHours, VERCEL_LIMITS.functionGBHours)}
                        note={`서버리스 함수 실행 시간/메모리`}
                    />

                    <UsageBarCard
                        icon="pi pi-share-alt"
                        label="Edge Middleware Invocations"
                        usedLabel={`${(vercelData.edgeMiddlewareInvocations >= 1000 ? (vercelData.edgeMiddlewareInvocations / 1000).toFixed(1) + 'K' : vercelData.edgeMiddlewareInvocations)} 회`}
                        limitLabel="1M (100만 회) / 월"
                        pct={usagePct(vercelData.edgeMiddlewareInvocations, VERCEL_LIMITS.edgeMiddlewareInvocations)}
                        note={`미들웨어 실행 횟수`}
                    />

                    <UsageBarCard
                        icon="pi pi-hammer"
                        label="Build Execution Time"
                        usedLabel={`${vercelData.buildMinutes.toFixed(1)} 분`}
                        limitLabel="6,000 분 / 월"
                        pct={usagePct(vercelData.buildMinutes, VERCEL_LIMITS.buildMinutes)}
                        note={`총 ${vercelData.buildCount ?? 0}회 빌드 감지`}
                    />

                    {/* Vercel 한도 안내 */}
                    <div className="col-12">
                        <div className="card surface-50 border-1 surface-border">
                            <div className="flex align-items-center gap-2 mb-2">
                                <i className="pi pi-info-circle text-primary" />
                                <span className="font-semibold text-sm text-900">Vercel Hobby Plan 리소스 한도 (최근 30일)</span>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-600">
                                {[
                                    'CDN Requests: 100만 회/월',
                                    'Fast Data Transfer: 100 GB/월',
                                    'Fast Origin Transfer: 10 GB/월',
                                    'Function Invocations: 100만 회/월',
                                    'Function Duration: 100 GB-Hrs/월',
                                    'Edge Middleware: 100만 회/월',
                                    '빌드 시간: 6,000분/월',
                                    '배포: 100회/일',
                                ].map(t => (
                                    <span key={t} className="flex align-items-center">
                                        <i className="pi pi-circle-fill mr-1" style={{ color: '#22c55e', fontSize: '8px' }} />
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="col-12">
                    <div className="card border-dashed border-1 surface-border surface-50">
                        <div className="flex align-items-center gap-3 p-2">
                            <i className="pi pi-info-circle text-2xl text-500" />
                            <div>
                                <p className="m-0 font-semibold text-900">Vercel 사용량을 불러올 수 없습니다</p>
                                <p className="m-0 text-sm text-600 mt-1">
                                    <a href="https://vercel.com/account/tokens" target="_blank" rel="noreferrer" className="text-primary font-medium">vercel.com/account/tokens</a>에서 Personal Access Token을 발급한 뒤
                                    <code className="mx-1 px-1 border-round surface-100 text-primary" style={{ fontSize: '12px' }}>VERCEL_ACCESS_TOKEN</code>
                                    환경변수에 설정하세요.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="col-12"><Divider /></div>

            {/* ══════════════════════════════════════════════════════════════
                SECTION 3: MongoDB (Free Tier — 500 MB 기준)
            ══════════════════════════════════════════════════════════════ */}
            <SectionHeader
                icon="pi pi-server"
                iconColor="#22c55e"
                title="MongoDB 사용량"
                badge={mongoData && <Tag value={mongoData.dbName} severity="success" className="ml-1" />}
                subTitle="Atlas Free Tier 스토리지 512 MB 기준 — 80% 이상 경고"
            />

            {loadingMongo ? <LoadingCard color="#22c55e" /> : mongoData ? (
                <>
                    {/* 스토리지 경고 바 (512MB 기준 — Atlas Free Tier) */}
                    <div className="col-12">
                        <UsageBarCard
                            icon="pi pi-save"
                            label="MongoDB 스토리지 (Atlas Free Tier 기준)"
                            usedLabel={bytesToReadable(mongoData.storageSize)}
                            limitLabel="512 MB"
                            pct={mongoStoragePct}
                            note={`${mongoData.storageSize.toLocaleString()} bytes`}
                            isFixed
                        />
                    </div>

                    {/* 요약 카드 */}
                    <StatCard icon="pi pi-file" label="데이터 크기" value={bytesToReadable(mongoData.dataSize)} subValue={`${mongoData.dataSize.toLocaleString()} bytes`} color="#22c55e" />
                    <StatCard icon="pi pi-save" label="스토리지 크기" value={bytesToReadable(mongoData.storageSize)} subValue={`512 MB 한도`} color="#0ea5e9" warn={mongoWarn} />
                    <StatCard icon="pi pi-sort-alt" label="인덱스 크기" value={bytesToReadable(mongoData.indexSize)} subValue={`${mongoData.indexSize.toLocaleString()} bytes`} color="#8b5cf6" />
                    <StatCard icon="pi pi-list" label="전체 도큐먼트 수" value={`${mongoData.totalDocuments.toLocaleString()} 건`} subValue={`컬렉션 ${mongoData.collections.length}개`} color="#f97316" />

                    {/* 컬렉션 테이블 */}
                    <div className="col-12">
                        <div className="card">
                            <h6 className="mt-0 mb-3">컬렉션별 상세 현황</h6>
                            <DataTable
                                value={mongoData.collections}
                                paginator rows={15} rowsPerPageOptions={[15, 30, 50]}
                                showGridlines stripedRows
                                className="p-datatable-sm"
                                emptyMessage="컬렉션 정보가 없습니다."
                                sortField="count" sortOrder={-1}
                            >
                                <Column field="name" header="컬렉션명" sortable body={(r: CollectionStat) => <span className="font-medium">{r.name}</span>} style={{ minWidth: '160px' }} />
                                <Column field="count" header="도큐먼트 수" sortable body={(r: CollectionStat) => r.count.toLocaleString()} style={{ width: '130px', textAlign: 'right' }} />
                                <Column field="storageSize" header="스토리지" sortable body={(r: CollectionStat) => bytesToReadable(r.storageSize)} style={{ width: '110px' }} />
                                <Column field="totalIndexSize" header="인덱스 크기" sortable body={(r: CollectionStat) => bytesToReadable(r.totalIndexSize)} style={{ width: '110px' }} />
                                <Column field="avgObjSize" header="평균 크기" sortable body={(r: CollectionStat) => bytesToReadable(r.avgObjSize)} style={{ width: '110px' }} />
                                <Column header="스토리지 비율" body={storageBarTemplate} style={{ minWidth: '180px' }} />
                            </DataTable>
                        </div>
                    </div>
                </>
            ) : (
                <div className="col-12"><div className="card text-center text-500">MongoDB 데이터를 불러올 수 없습니다.</div></div>
            )}
        </div>
    );
};

export default SystemUsagePage;
