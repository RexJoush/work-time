import type { Attendance, WeeklyStats, PaginatedResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const json = (await res.json()) as ApiResponse<T>;
  if (json.code !== 200) {
    throw new Error(json.message || '请求失败');
  }
  return json.data;
}

/**
 * 获取今日签到记录
 */
export async function getTodayAttendance(): Promise<Attendance | null> {
  return request<Attendance | null>('/attendance/today');
}

/**
 * 上班签到
 */
export async function clockIn(): Promise<Attendance> {
  return request<Attendance>('/attendance/clock-in', { method: 'POST' });
}

/**
 * 下班签到
 */
export async function clockOut(): Promise<Attendance> {
  return request<Attendance>('/attendance/clock-out', { method: 'POST' });
}

/**
 * 重置今日上班签到时间
 */
export async function resetClockIn(): Promise<void> {
  await request<null>('/attendance/reset-clock-in', { method: 'POST' });
}

/**
 * 重置今日下班签到时间
 */
export async function resetClockOut(): Promise<void> {
  await request<null>('/attendance/reset-clock-out', { method: 'POST' });
}

/**
 * 获取历史签到记录（分页）
 */
export async function getAttendanceHistory(
  page = 1,
  pageSize = 10,
): Promise<PaginatedResponse<Attendance>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return request<PaginatedResponse<Attendance>>(`/attendance/history?${params.toString()}`);
}

/**
 * 获取本周工时统计（周一到周五）
 */
export async function getWeeklyStats(): Promise<WeeklyStats> {
  return request<WeeklyStats>('/attendance/weekly-stats');
}
