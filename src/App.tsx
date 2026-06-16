import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // 只保留 Routes/Route，移除 Router
import routes from './routes';

const App: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Routes>
          {routes.map((route, index) => (
            <Route
              key={index}
              path={route.path}
              element={route.element}
            />
          ))}
          {/* 关键：通配符路由也基于 basename，跳转到 /work-time/ 而非根目录 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;