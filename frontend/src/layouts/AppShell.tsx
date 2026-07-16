import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpenText,
  CalendarClock,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Megaphone,
  PlugZap,
  Search,
  ScrollText,
  ServerCog,
  X,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { Avatar, Badge, Button, cn } from "@/components";
import { appEnv, mockBusiness } from "@/lib";

import { BrandMark } from "../components/BrandMark";
import { useAuth } from "../contexts/AuthContext";

const navigation = [
  { label: "Tổng quan", to: "/dashboard", icon: LayoutDashboard },
  { label: "Kho tri thức", to: "/knowledge-base", icon: BookOpenText },
  { label: "Chiến dịch", to: "/campaigns", icon: Megaphone },
  { label: "Nội dung", to: "/posts", icon: FileText },
  { label: "Lịch đăng", to: "/schedule", icon: CalendarClock },
  { label: "Nhật ký đăng", to: "/publishing/logs", icon: ScrollText },
  { label: "Đánh giá", to: "/reports", icon: BarChart3 },
];

const secondaryNavigation = [
  { label: "Trạng thái hệ thống", to: "/system-status", icon: ServerCog },
  { label: "Tích hợp", to: "/integrations", icon: PlugZap },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  useEffect(() => onNavigate?.(), [location.pathname, onNavigate]);

  const navItem = ({ label, to, icon: Icon }: (typeof navigation)[number]) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
          isActive
            ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/20"
            : "text-slate-300 hover:bg-white/7 hover:text-white",
        )
      }
    >
      <Icon size={19} strokeWidth={2} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="flex h-full flex-col bg-[#10251f] px-4 py-5">
      <div className="px-1">
        <BrandMark />
      </div>
      <div className="mt-8 flex-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Không gian làm việc
        </p>
        <nav className="mt-3 space-y-1" aria-label="Điều hướng chính">
          {navigation.map(navItem)}
        </nav>
        <p className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Cấu hình
        </p>
        <nav className="mt-3 space-y-1" aria-label="Điều hướng cấu hình">
          {secondaryNavigation.map(navItem)}
        </nav>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-300">Local AI</span>
          <Badge tone="success" dot className="border-0 bg-emerald-400/15 text-emerald-300 ring-0">
            Sẵn sàng
          </Badge>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-slate-500">
          Dữ liệu doanh nghiệp được xử lý trong hạ tầng riêng.
        </p>
      </div>
    </div>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f5f7f4] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[268px] lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-[286px] max-w-[86vw] shadow-2xl">
            <button
              type="button"
              aria-label="Đóng menu"
              className="absolute right-3 top-4 z-10 grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <X size={20} />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-[268px]">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f5f7f4]/90 backdrop-blur-xl">
          <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              aria-label="Mở menu"
              onClick={() => setMobileOpen(true)}
              className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="relative hidden max-w-md flex-1 md:block">
              <Search
                aria-hidden="true"
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                aria-label="Tìm kiếm"
                placeholder="Tìm chiến dịch, bài viết, tài liệu..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white/80 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              {appEnv.useMocks && (
                <Badge tone="warning" className="hidden sm:inline-flex">
                  Chế độ demo
                </Badge>
              )}
              <button
                type="button"
                aria-label="Thông báo"
                className="relative grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                <Bell size={18} />
                <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  aria-expanded={profileOpen}
                  onClick={() => setProfileOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-xl p-1.5 pr-2 transition hover:bg-white"
                >
                  <Avatar name={session?.user.fullName ?? "Nguyên"} size="sm" status="online" />
                  <span className="hidden text-left xl:block">
                    <span className="block max-w-36 truncate text-xs font-bold text-slate-800">
                      {session?.user.fullName}
                    </span>
                    <span className="block max-w-36 truncate text-[10px] text-slate-500">
                      {mockBusiness.name}
                    </span>
                  </span>
                  <ChevronDown size={14} className="hidden text-slate-400 sm:block" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                    <div className="border-b border-slate-100 px-3 py-2.5">
                      <p className="truncate text-sm font-bold">{session?.user.fullName}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{session?.user.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      fullWidth
                      className="mt-1 justify-start text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      leftIcon={<LogOut size={17} />}
                      onClick={handleLogout}
                    >
                      Đăng xuất
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-72px)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1480px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
