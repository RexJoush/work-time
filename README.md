# 签到前端

一个用于记录上下班签到和查看工时统计的前端应用。项目基于 Vite、React 和 TypeScript 开发，通过后端接口获取今日签到、历史记录和周工时统计数据。

## 功能

- 今日上班签到和下班签到
- 查看今日签到时间和当前工时
- 重置今日上班或下班签到时间
- 查看历史签到记录
- 查看本周工时统计图表

## 技术栈

- Vite
- React
- TypeScript
- Tailwind CSS
- Radix UI
- Recharts

## 本地开发

### 环境要求

- Node.js >= 20
- npm >= 10

### 安装依赖

```bash
npm install
```

### 配置环境变量

项目会从 `VITE_API_BASE_URL` 读取后端接口地址。可以在项目根目录创建 `.env`：

```env
VITE_API_BASE_URL=http://localhost:3000
```

如果前端和后端同源部署，也可以不配置该变量，默认使用当前域名请求接口。

### 启动开发服务

```bash
npm run dev
```

默认会启动在：

```text
http://127.0.0.1:5173
```

### 构建生产版本

```bash
npm run build
```

## 接口约定

前端当前使用以下接口：

- `GET /attendance/today`：获取今日签到记录
- `POST /attendance/clock-in`：上班签到
- `POST /attendance/clock-out`：下班签到
- `POST /attendance/reset-clock-in`：重置今日上班签到
- `POST /attendance/reset-clock-out`：重置今日下班签到
- `GET /attendance/history?page=1&pageSize=10`：获取历史签到记录
- `GET /attendance/weekly-stats`：获取本周工时统计

接口响应格式约定：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

## 项目结构

```text
├── README.md
├── index.html
├── package.json
├── vite.config.ts
├── src
│   ├── App.tsx
│   ├── main.tsx
│   ├── routes.tsx
│   ├── pages
│   │   └── WorkHoursTracker.tsx
│   ├── components
│   ├── db
│   │   └── api.ts
│   ├── hooks
│   ├── lib
│   ├── types
│   │   └── index.ts
│   └── index.css
└── public
```