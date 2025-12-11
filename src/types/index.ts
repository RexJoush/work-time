export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

// 签到记录类型
export interface Attendance {
  id: string;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  work_hours: number;
  created_at: string;
  updated_at: string;
}

// 周统计数据类型
export interface WeeklyStats {
  totalHours: number;
  averageHours: number;
  dailyHours: {
    date: string;
    day: string;
    hours: number;
  }[];
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
