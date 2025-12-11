-- 创建签到记录表
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  clock_in_time TIMESTAMPTZ,
  clock_out_time TIMESTAMPTZ,
  work_hours NUMERIC(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date DESC);

-- 添加注释
COMMENT ON TABLE attendance IS '员工签到记录表';
COMMENT ON COLUMN attendance.date IS '签到日期';
COMMENT ON COLUMN attendance.clock_in_time IS '上班签到时间';
COMMENT ON COLUMN attendance.clock_out_time IS '下班签到时间';
COMMENT ON COLUMN attendance.work_hours IS '工作时长（小时）';
