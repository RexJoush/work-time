import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, LogIn, LogOut, TrendingUp, RotateCcw } from 'lucide-react';
import { clockIn, clockOut, getTodayAttendance, getWeeklyStats, resetClockIn, resetClockOut } from '@/db/api';
import type { Attendance, WeeklyStats } from '@/types';
import AttendanceHistory from '@/components/AttendanceHistory';

export default function WorkHoursTracker() {
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  // 加载数据
  const loadData = async () => {
    try {
      const [today, weekly] = await Promise.all([
        getTodayAttendance(),
        getWeeklyStats()
      ]);
      setTodayAttendance(today);
      setWeeklyStats(weekly);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载工时数据，请刷新页面重试',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    loadData();
    
    // 每分钟更新一次当前时间
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // 处理上班签到
  const handleClockIn = async () => {
    setLoading(true);
    try {
      await clockIn();
      await loadData();
      toast({
        title: '签到成功',
        description: '上班签到已记录',
      });
    } catch (error) {
      toast({
        title: '签到失败',
        description: error instanceof Error ? error.message : '上班签到失败',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理下班签到
  const handleClockOut = async () => {
    setLoading(true);
    try {
      await clockOut();
      await loadData();
      toast({
        title: '签到成功',
        description: '下班签到已记录',
      });
    } catch (error) {
      toast({
        title: '签到失败',
        description: error instanceof Error ? error.message : '下班签到失败',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理重置上班签到
  const handleResetClockIn = async () => {
    setLoading(true);
    try {
      await resetClockIn();
      await loadData();
      toast({
        title: '重置成功',
        description: '上班签到时间已清除',
      });
    } catch (error) {
      toast({
        title: '重置失败',
        description: error instanceof Error ? error.message : '重置上班签到失败',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理重置下班签到
  const handleResetClockOut = async () => {
    setLoading(true);
    try {
      await resetClockOut();
      await loadData();
      toast({
        title: '重置成功',
        description: '下班签到时间已清除',
      });
    } catch (error) {
      toast({
        title: '重置失败',
        description: error instanceof Error ? error.message : '重置下班签到失败',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 格式化时间显示
  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  // 计算当前工时（用于未打下班卡的情况）
  const getCurrentWorkHours = () => {
    if (!todayAttendance?.clock_in_time) return 0;
    if (todayAttendance.clock_out_time) return todayAttendance.work_hours;
    
    const clockInTime = new Date(todayAttendance.clock_in_time);
    const hours = (currentTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
    return Number(hours.toFixed(2));
  };

  return (
    <div className="min-h-screen bg-background p-4 xl:p-8">
      <Toaster />
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl xl:text-4xl font-bold text-foreground">牛马拉磨统计</h1>
        </div>

        {/* 标签页 */}
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="today">今日统计</TabsTrigger>
            <TabsTrigger value="history">历史记录</TabsTrigger>
          </TabsList>

          {/* 今日统计标签页 */}
          <TabsContent value="today" className="space-y-6 mt-6">
            {/* 签到卡片 */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  今日签到
                </CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('zh-CN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {/* 上班签到 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">上班时间</p>
                        <p className="text-2xl font-bold text-foreground">
                          {formatTime(todayAttendance?.clock_in_time || null)}
                        </p>
                      </div>
                      <LogIn className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleClockIn}
                        disabled={loading || !!todayAttendance?.clock_in_time}
                        className="flex-1"
                        size="lg"
                      >
                        {todayAttendance?.clock_in_time ? '已签到' : '上班签到'}
                      </Button>
                      {todayAttendance?.clock_in_time && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="lg"
                              className="text-muted-foreground hover:text-destructive"
                              disabled={loading}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认重置上班签到？</AlertDialogTitle>
                              <AlertDialogDescription>
                                此操作将清除今日的上班签到时间。此操作不可恢复，请谨慎操作。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction onClick={handleResetClockIn}>
                                确认重置
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>

                  {/* 下班签到 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">下班时间</p>
                        <p className="text-2xl font-bold text-foreground">
                          {formatTime(todayAttendance?.clock_out_time || null)}
                        </p>
                      </div>
                      <LogOut className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleClockOut}
                        disabled={loading || !todayAttendance?.clock_in_time || !!todayAttendance?.clock_out_time}
                        className="flex-1"
                        size="lg"
                      >
                        {todayAttendance?.clock_out_time ? '已签到' : '下班签到'}
                      </Button>
                      {todayAttendance?.clock_out_time && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="lg"
                              className="text-muted-foreground hover:text-destructive"
                              disabled={loading}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认重置下班签到？</AlertDialogTitle>
                              <AlertDialogDescription>
                                此操作将清除今日的下班签到时间。此操作不可恢复，请谨慎操作。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction onClick={handleResetClockOut}>
                                确认重置
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>

                {/* 今日工时 */}
                <div className="mt-6 p-4 bg-primary/10 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-1">今日工时</p>
                  <p className="text-3xl font-bold text-primary">
                    {getCurrentWorkHours().toFixed(2)} 小时
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 本周统计 */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  本周统计
                </CardTitle>
                <CardDescription>周一至周五工时数据</CardDescription>
              </CardHeader>
              <CardContent>
                {/* 统计数据 */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-secondary/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">本周总工时</p>
                    <p className="text-2xl font-bold text-foreground">
                      {weeklyStats?.totalHours.toFixed(2) || '0.00'} 小时
                    </p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">日均工时</p>
                    <p className="text-2xl font-bold text-foreground">
                      {weeklyStats?.averageHours.toFixed(2) || '0.00'} 小时
                    </p>
                  </div>
                </div>

                {/* 柱状图 */}
                <div className="w-full h-64 xl:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyStats?.dailyHours || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="day" 
                        stroke="hsl(var(--muted-foreground))"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        style={{ fontSize: '12px' }}
                        label={{ value: '工时（小时）', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`${value.toFixed(2)} 小时`, '工时']}
                      />
                      <Bar 
                        dataKey="hours" 
                        fill="hsl(var(--primary))" 
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 历史记录标签页 */}
          <TabsContent value="history" className="mt-6">
            <AttendanceHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
