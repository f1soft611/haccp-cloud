import { apiClient } from '../../api/apiClient';

type ResultEnvelope<T> = {
    result?: T;
};

export type WorkdayType =
    | 'WORK'
    | 'PUBLIC_HOLIDAY'
    | 'COMPANY_HOLIDAY'
    | 'SUBSTITUTE_HOLIDAY'
    | 'SPECIAL_WORK';

export type WorkdaySource = 'API' | 'MANUAL' | 'PATTERN';

export type WorkdayItem = {
    workdayDate: string;
    dayType: WorkdayType;
    dayName: string;
    memo: string;
    source: WorkdaySource;
};

export type GenerateWorkdaysRequest = {
    tenantCode?: string;
    year: number;
    // 0=일 ~ 6=토
    weeklyOffDays: number[];
    includePublicHolidays: boolean;
    overwrite: boolean;
};

// year 는 ISO 주 기준 연도 (2027-01-01 은 2026년 53주차)
export type WeekItem = {
    year: number;
    week: number;
    fromDate: string;
    toDate: string;
};

function tenantHeaders(tenantCode?: string) {
    return tenantCode ? { 'x-tenant-code': tenantCode } : undefined;
}

export async function listWorkdays(params: {
    tenantCode?: string;
    year: number;
}): Promise<WorkdayItem[]> {
    const { data } = await apiClient.get<ResultEnvelope<{ items: WorkdayItem[] }>>(
        '/v1/workday',
        { headers: tenantHeaders(params.tenantCode), params: { year: params.year } },
    );
    return data?.result?.items ?? [];
}

export async function saveWorkdays(params: {
    tenantCode?: string;
    items: WorkdayItem[];
}): Promise<void> {
    await apiClient.put(
        '/v1/workday/batch',
        { items: params.items },
        { headers: tenantHeaders(params.tenantCode) },
    );
}

export async function generateWorkdays(params: GenerateWorkdaysRequest): Promise<void> {
    await apiClient.post(
        '/v1/workday/generate',
        {
            year: params.year,
            weeklyOffDays: params.weeklyOffDays,
            includePublicHolidays: params.includePublicHolidays,
            overwrite: params.overwrite,
        },
        { headers: tenantHeaders(params.tenantCode) },
    );
}

export async function listWeeks(params: {
    tenantCode?: string;
    from: string;
    to: string;
}): Promise<WeekItem[]> {
    const { data } = await apiClient.get<ResultEnvelope<{ items: WeekItem[] }>>(
        '/v1/workday/weeks',
        { headers: tenantHeaders(params.tenantCode), params: { from: params.from, to: params.to } },
    );
    return data?.result?.items ?? [];
}