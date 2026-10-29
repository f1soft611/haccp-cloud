import { apiClient } from '../api/apiClient';

export type MigrationDbStatus =
    | 'APPLIED'
    | 'FAILED'
    | 'PENDING'
    | 'BLOCKED'
    | 'ERROR';

export type MigrationApplyResult = 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'BLOCKED';

export type MigrationItem = {
    migrationId: string;
    appliedCount: number;
    failedCount: number;
    pendingCount: number;
    blockedCount: number;
    runnable: boolean;
};

export type MigrationDatabaseRow = {
    dbName: string;
    status: MigrationDbStatus;
    appliedAt?: string | null;
    appliedBy?: string | null;
    errorMessage?: string | null;
};

export type MigrationDetail = {
    migrationId: string;
    sql: string;
    databases: MigrationDatabaseRow[];
};

export type MigrationApplyRow = {
    dbName: string;
    result: MigrationApplyResult;
    errorMessage?: string | null;
};

type ResultEnvelope<T> = {
    resultCode?: number | string;
    resultMessage?: string;
    result?: T & { message?: string };
};

const BASE = '/v1/platform-admin/migrations';

function unwrap<T>(data: ResultEnvelope<T>): T {
    const resultCode = Number(data?.resultCode);
    if (Number.isFinite(resultCode) && resultCode !== 200) {
        const message =
            data?.result?.message ||
            data?.resultMessage ||
            '요청 처리 중 오류가 발생했습니다.';
        throw { response: { data: { message } }, message };
    }
    return (data?.result ?? {}) as T;
}

export async function getMigrations(): Promise<MigrationItem[]> {
    const { data } =
        await apiClient.get<ResultEnvelope<{ migrations?: MigrationItem[] }>>(BASE);
    return unwrap(data).migrations ?? [];
}

export async function getMigrationDetail(
    migrationId: string,
): Promise<MigrationDetail> {
    const { data } = await apiClient.get<ResultEnvelope<MigrationDetail>>(
        `${BASE}/${encodeURIComponent(migrationId)}`,
    );
    return unwrap(data);
}

export async function applyMigration(
    migrationId: string,
): Promise<MigrationApplyRow[]> {
    const { data } = await apiClient.post<
        ResultEnvelope<{ results?: MigrationApplyRow[] }>
    >(`${BASE}/${encodeURIComponent(migrationId)}/apply`);
    return unwrap(data).results ?? [];
}