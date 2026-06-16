import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom"; // 唯一的 Router 入口
import "./index.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* 唯一的 Router，配置 basename="/work-time" 锁定路径 */}
    <Router basename="/work-time">
      <AppWrapper>
        <App />
      </AppWrapper>
    </Router>
  </StrictMode>
);