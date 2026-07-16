import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { DesktopStartupGate } from "./components/DesktopStartupGate";
import { AppShell } from "./layouts/AppShell";
import { ProtectedRoute } from "./routes/ProtectedRoute";

const CampaignPlanPage = lazy(() => import("./pages/CampaignPlanPage").then((module) => ({ default: module.CampaignPlanPage })));
const CampaignsPage = lazy(() => import("./pages/CampaignsPage").then((module) => ({ default: module.CampaignsPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const IntegrationsPage = lazy(() => import("./pages/IntegrationsPage").then((module) => ({ default: module.IntegrationsPage })));
const KnowledgeBasePage = lazy(() => import("./pages/KnowledgeBasePage").then((module) => ({ default: module.KnowledgeBasePage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));
const PostEditorPage = lazy(() => import("./pages/PostEditorPage").then((module) => ({ default: module.PostEditorPage })));
const PostsPage = lazy(() => import("./pages/PostsPage").then((module) => ({ default: module.PostsPage })));
const PublishingLogsPage = lazy(() => import("./pages/PublishingLogsPage").then((module) => ({ default: module.PublishingLogsPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const ReportsPage = lazy(() => import("./pages/ReportsPage").then((module) => ({ default: module.ReportsPage })));
const SchedulePage = lazy(() => import("./pages/SchedulePage").then((module) => ({ default: module.SchedulePage })));
const SystemStatusPage = lazy(() => import("./pages/SystemStatusPage").then((module) => ({ default: module.SystemStatusPage })));

function RouteFallback() {
  return (
    <div className="grid min-h-[40vh] place-items-center" role="status" aria-label="Đang tải trang">
      <span className="size-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
    </div>
  );
}

export function App() {
  return (
    <DesktopStartupGate>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="knowledge-base" element={<KnowledgeBasePage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="campaigns/:campaignId/plans" element={<CampaignPlanPage />} />
              <Route path="posts" element={<PostsPage />} />
              <Route path="posts/:postId/edit" element={<PostEditorPage />} />
              <Route path="posts/:postId/review" element={<PostEditorPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="publishing/logs" element={<PublishingLogsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="integrations" element={<IntegrationsPage />} />
              <Route path="system-status" element={<SystemStatusPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </DesktopStartupGate>
  );
}
