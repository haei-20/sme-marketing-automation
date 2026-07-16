import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Globe2,
  ListFilter,
  MessagesSquare,
  Plus,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import {
  Badge,
  Button,
  Card,
  CardContent,
  PageHeader,
  Select,
  StatusBadge,
  cn,
} from "@/components";
import { mockPosts } from "@/lib";

const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const calendarDays = [
  { day: 29, outside: true },
  { day: 30, outside: true },
  ...Array.from({ length: 31 }, (_, index) => ({ day: index + 1, outside: false })),
  { day: 1, outside: true },
  { day: 2, outside: true },
  { day: 3, outside: true },
  { day: 4, outside: true },
];

const channelMeta = {
  FACEBOOK: { label: "Facebook", icon: MessagesSquare, className: "bg-blue-50 text-blue-700 ring-blue-200" },
  BLOG: { label: "Blog", icon: Globe2, className: "bg-violet-50 text-violet-700 ring-violet-200" },
  WEBSITE: { label: "Website", icon: Globe2, className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  INSTAGRAM: { label: "Instagram", icon: Globe2, className: "bg-pink-50 text-pink-700 ring-pink-200" },
};

function postDay(iso?: string) {
  return iso ? new Date(iso).getDate() : null;
}

export function SchedulePage() {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [channel, setChannel] = useState("ALL");
  const scheduledPosts = useMemo(
    () =>
      mockPosts.filter(
        (post) =>
          post.scheduleAt &&
          (channel === "ALL" || post.channel === channel),
      ),
    [channel],
  );

  return (
    <>
      <Helmet>
        <title>Lịch đăng | SMEFlow AI</title>
        <meta name="description" content="Quản lý lịch phân phối nội dung theo múi giờ doanh nghiệp." />
      </Helmet>
      <PageHeader
        eyebrow="Phân phối nội dung"
        title="Lịch đăng bài"
        description="Theo dõi lịch đã duyệt theo múi giờ Asia/Bangkok (UTC+7). Thao tác đăng thực tế do backend scheduler đảm nhiệm."
        actions={
          <Link to="/posts">
            <Button leftIcon={<Plus size={17} />}>Lên lịch bài viết</Button>
          </Link>
        }
        meta={<Badge tone="info" leadingIcon={<Clock3 size={12} />}>UTC+7 • Asia/Bangkok</Badge>}
      />

      <Card variant="elevated" className="mt-7 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Tháng trước"><ChevronLeft size={18} /></Button>
            <div className="min-w-44 text-center">
              <p className="text-base font-black tracking-tight text-slate-950">Tháng 7, 2026</p>
              <p className="text-[11px] text-slate-500">3 nội dung trong lịch</p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Tháng sau"><ChevronRight size={18} /></Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              aria-label="Lọc theo kênh"
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
              className="min-w-36"
              fieldSize="sm"
            >
              <option value="ALL">Tất cả kênh</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="BLOG">Blog</option>
              <option value="WEBSITE">Website</option>
            </Select>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                aria-label="Xem dạng lịch"
                onClick={() => setView("calendar")}
                className={cn("grid size-8 place-items-center rounded-lg", view === "calendar" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-400")}
              ><CalendarDays size={16} /></button>
              <button
                type="button"
                aria-label="Xem dạng danh sách"
                onClick={() => setView("list")}
                className={cn("grid size-8 place-items-center rounded-lg", view === "list" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-400")}
              ><ListFilter size={16} /></button>
            </div>
          </div>
        </div>

        {view === "calendar" ? (
          <CardContent className="p-0 sm:p-0">
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70">
              {dayNames.map((name) => (
                <div key={name} className="px-2 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">{name}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map(({ day, outside }, index) => {
                const dayPosts = outside ? [] : scheduledPosts.filter((post) => postDay(post.scheduleAt) === day);
                const isToday = !outside && day === 15;
                return (
                  <div
                    key={`${day}-${index}`}
                    className={cn(
                      "min-h-24 border-b border-r border-slate-100 p-1.5 sm:min-h-32 sm:p-2",
                      outside && "bg-slate-50/60 text-slate-300",
                      isToday && "bg-emerald-50/40",
                    )}
                  >
                    <span className={cn(
                      "grid size-7 place-items-center rounded-full text-xs font-bold",
                      isToday ? "bg-emerald-600 text-white" : "text-slate-600",
                    )}>{day}</span>
                    <div className="mt-1.5 space-y-1">
                      {dayPosts.map((post) => {
                        const meta = channelMeta[post.channel ?? "WEBSITE"];
                        return (
                          <Link
                            key={post.id}
                            to={`/posts/${post.id}/edit`}
                            title={post.title}
                            className={cn("block truncate rounded-lg px-2 py-1.5 text-[10px] font-bold ring-1 ring-inset sm:text-[11px]", meta.className)}
                          >
                            {new Date(post.scheduleAt!).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} {post.title}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        ) : (
          <CardContent className="space-y-3 pt-5">
            {scheduledPosts.map((post) => {
              const meta = channelMeta[post.channel ?? "WEBSITE"];
              const Icon = meta.icon;
              return (
                <Link key={post.id} to={`/posts/${post.id}/edit`} className="flex flex-col gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-emerald-200 sm:flex-row sm:items-center">
                  <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl ring-1 ring-inset", meta.className)}><Icon size={19} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{post.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeStyle: "short" }).format(new Date(post.scheduleAt!))}
                    </span>
                  </span>
                  <StatusBadge status={post.status === "PUBLISHED" ? "published" : "scheduled"} />
                </Link>
              );
            })}
          </CardContent>
        )}
      </Card>
    </>
  );
}
