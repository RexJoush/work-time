import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import { getAttendanceHistory } from '@/db/api';
import type { Attendance, PaginatedResponse } from '@/types';

export default function AttendanceHistory() {
  const [historyData, setHistoryData] = useState<PaginatedResponse<Attendance> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // 加载历史数据
  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getAttendanceHistory(currentPage, pageSize);
      setHistoryData(data);
    } catch (error) {
      console.error('加载历史数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentPage, pageSize]);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    });
  };

  // 格式化时间
  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 处理页码变化
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (historyData?.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  // 处理每页条数变化
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1); // 重置到第一页
  };

  // 生成页码按钮
  const renderPageButtons = () => {
    const totalPages = historyData?.totalPages || 1;
    const buttons = [];
    const maxButtons = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={i === currentPage ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePageChange(i)}
          disabled={loading}
        >
          {i}
        </Button>
      );
    }

    return buttons;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          签到历史
        </CardTitle>
        <CardDescription>查看所有签到记录</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 每页条数选择 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">每页显示</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">条</span>
          </div>
          <div className="text-sm text-muted-foreground">
            共 {historyData?.total || 0} 条记录
          </div>
        </div>

        {/* 表格 */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">日期</TableHead>
                <TableHead className="w-28">上班时间</TableHead>
                <TableHead className="w-28">下班时间</TableHead>
                <TableHead className="w-24 text-right">工时（小时）</TableHead>
                <TableHead className="w-20 text-center">状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : historyData?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    暂无签到记录
                  </TableCell>
                </TableRow>
              ) : (
                historyData?.data.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {formatDate(record.date)}
                    </TableCell>
                    <TableCell>
                      {formatTime(record.clock_in_time)}
                    </TableCell>
                    <TableCell>
                      {formatTime(record.clock_out_time)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {record.work_hours.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {!record.clock_in_time ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          未签到
                        </span>
                      ) : !record.clock_out_time ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          进行中
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground">
                          已完成
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 分页控件 */}
        {historyData && historyData.totalPages > 1 && (
          <div className="flex flex-col xl:flex-row items-center justify-between gap-4 mt-4">
            <div className="text-sm text-muted-foreground">
              第 {currentPage} 页，共 {historyData.totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4" />
                上一页
              </Button>
              <div className="flex gap-1">
                {renderPageButtons()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === historyData.totalPages || loading}
              >
                下一页
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
