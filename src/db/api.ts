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

  // 生成周一到周五的完整数据
  const weekDays = ['周一', '周二', '周三', '周四', '周五'];
  const dailyHours = [];

  for (let i = 0; i < 5; i++) {
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

  // 计算总工时和平均工时
  const totalHours = dailyHours.reduce((sum, day) => sum + day.hours, 0);
  const averageHours = totalHours / 5;

  return {
    totalHours: Number(totalHours.toFixed(2)),
    averageHours: Number(averageHours.toFixed(2)),
    dailyHours
  };
}
