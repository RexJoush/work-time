import { supabase } from './supabase';
import type { Attendance } from '@/types';

/**
 * 获取今日签到记录
 */
export async function getTodayAttendance(): Promise<Attendance | null> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('date', today)
    .maybeSingle();

  if (error) {
    console.error('获取今日签到记录失败:', error);
    throw error;
  }

  return data;
}

/**
 * 上班签到
 */
export async function clockIn(): Promise<Attendance> {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  // 检查今日是否已签到
  const existing = await getTodayAttendance();
  
  if (existing?.clock_in_time) {
    throw new Error('今日已完成上班签到');
  }

  if (existing) {
    // 更新现有记录
    const { data, error } = await supabase
      .from('attendance')
      .update({ 
        clock_in_time: now,
        updated_at: now
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('上班签到失败:', error);
      throw error;
    }

    return data;
  }

  // 创建新记录
  const { data, error } = await supabase
    .from('attendance')
    .insert({
      date: today,
      clock_in_time: now,
      work_hours: 0
    })
    .select()
    .single();

  if (error) {
    console.error('上班签到失败:', error);
    throw error;
  }

  return data;
}

/**
 * 下班签到
 */
export async function clockOut(): Promise<Attendance> {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  const existing = await getTodayAttendance();

  if (!existing) {
    throw new Error('请先完成上班签到');
  }

  if (!existing.clock_in_time) {
    throw new Error('请先完成上班签到');
  }

  if (existing.clock_out_time) {
    throw new Error('今日已完成下班签到');
  }

  // 计算工时
  const clockInTime = new Date(existing.clock_in_time);
  const clockOutTime = new Date(now);
  const workHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

  const { data, error } = await supabase
    .from('attendance')
    .update({
      clock_out_time: now,
      work_hours: Number(workHours.toFixed(2)),
      updated_at: now
    })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) {
    console.error('下班签到失败:', error);
    throw error;
  }

  return data;
}

/**
 * 重置今日上班签到时间
 */
export async function resetClockIn(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // 获取今日记录
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('date', today)
    .maybeSingle();

  if (!attendance) {
    throw new Error('今日暂无签到记录');
  }

  // 如果只有上班签到，删除整条记录
  if (!attendance.clock_out_time) {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('date', today);

    if (error) {
      console.error('重置上班签到失败:', error);
      throw error;
    }
  } else {
    // 如果已有下班签到，只清除上班时间并重新计算工时
    const { error } = await supabase
      .from('attendance')
      .update({
        clock_in_time: null,
        work_hours: 0
      })
      .eq('date', today);

    if (error) {
      console.error('重置上班签到失败:', error);
      throw error;
    }
  }
}

/**
 * 重置今日下班签到时间
 */
export async function resetClockOut(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // 获取今日记录
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('date', today)
    .maybeSingle();

  if (!attendance || !attendance.clock_out_time) {
    throw new Error('今日暂无下班签到记录');
  }

  // 清除下班时间并重新计算工时
  const clockInTime = attendance.clock_in_time ? new Date(attendance.clock_in_time) : null;
  const currentWorkHours = clockInTime 
    ? (new Date().getTime() - clockInTime.getTime()) / (1000 * 60 * 60)
    : 0;

  const { error } = await supabase
    .from('attendance')
    .update({
      clock_out_time: null,
      work_hours: Number(currentWorkHours.toFixed(2))
    })
    .eq('date', today);

  if (error) {
    console.error('重置下班签到失败:', error);
    throw error;
  }
}

/**
 * 重置今日签到记录（已废弃，保留用于兼容）
 */
export async function resetTodayAttendance(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('date', today);

  if (error) {
    console.error('重置今日签到记录失败:', error);
    throw error;
  }
}

/**
 * 获取历史签到记录（分页）
 */
export async function getAttendanceHistory(page = 1, pageSize = 10) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // 获取总数
  const { count } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true });

  // 获取分页数据
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .order('date', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('获取历史记录失败:', error);
    throw error;
  }

  return {
    data: Array.isArray(data) ? data : [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
}

/**
 * 获取本周工时统计（周一到周五）
 */
export async function getWeeklyStats() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // 计算本周一的日期
  const monday = new Date(now);
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 如果是周日，往回推6天
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  // 计算本周五的日期
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  const mondayStr = monday.toISOString().split('T')[0];
  const fridayStr = friday.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .gte('date', mondayStr)
    .lte('date', fridayStr)
    .order('date', { ascending: true });

  if (error) {
    console.error('获取周统计失败:', error);
    throw error;
  }

  const attendanceData = Array.isArray(data) ? data : [];

  // 根据当前日期动态展示统计范围
  // 周一至周四显示周一到当天
  // 周五、周六、周日显示周一到周五
  let displayDays = 5; // 默认显示5天
  if (dayOfWeek >= 1 && dayOfWeek <= 4) {
    // 周一到周四，只显示到当天
    displayDays = dayOfWeek;
  }

  // 生成数据
  const weekDays = ['周一', '周二', '周三', '周四', '周五'];
  const dailyHours = [];

  for (let i = 0; i < displayDays; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const record = attendanceData.find(r => r.date === dateStr);
    
    let hours = 0;
    if (record) {
      if (record.clock_out_time) {
        hours = record.work_hours || 0;
      } else if (record.clock_in_time) {
        // 未打下班卡，计算到当前时间
        const clockInTime = new Date(record.clock_in_time);
        const currentTime = new Date();
        hours = (currentTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
        hours = Number(hours.toFixed(2));
      }
    }

    dailyHours.push({
      date: dateStr,
      day: weekDays[i],
      hours
    });
  }

  // 计算总工时和平均工时（根据实际显示的天数计算）
  const totalHours = dailyHours.reduce((sum, day) => sum + day.hours, 0);
  const averageHours = displayDays > 0 ? totalHours / displayDays : 0;

  return {
    totalHours: Number(totalHours.toFixed(2)),
    averageHours: Number(averageHours.toFixed(2)),
    dailyHours
  };
}
