import { useCallback, useEffect, useState } from "react";
import { FileClock, MonitorCog, PackageCheck, RefreshCw } from "lucide-react";

import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components";

type DesktopDiagnostics = Awaited<ReturnType<SmeDesktopApi["getDiagnostics"]>>;

export function DesktopDiagnosticsPanel() {
  const desktopApi = window.smeDesktop;
  const [diagnostics, setDiagnostics] = useState<DesktopDiagnostics>();
  const [isLoading, setIsLoading] = useState(Boolean(desktopApi));
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    if (!desktopApi) return;
    setIsLoading(true);
    setError(undefined);
    try {
      setDiagnostics(await desktopApi.getDiagnostics());
    } catch {
      setError("Không đọc được nhật ký chẩn đoán từ Electron.");
    } finally {
      setIsLoading(false);
    }
  }, [desktopApi]);

  useEffect(() => {
    if (!desktopApi) return;
    let active = true;
    void desktopApi
      .getDiagnostics()
      .then((value) => {
        if (active) setDiagnostics(value);
      })
      .catch(() => {
        if (active) setError("Không đọc được nhật ký chẩn đoán từ Electron.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [desktopApi]);

  if (!desktopApi) {
    return (
      <Alert
        tone="info"
        title="Diagnostics chỉ có trong ứng dụng desktop"
        description="Mở bản .exe để xem phiên bản và nhật ký dịch vụ local."
      />
    );
  }

  const platformLabel = diagnostics?.app.platform === "win32" ? "Windows x64" : diagnostics?.app.platform;

  return (
    <Card>
      <CardHeader className="border-b border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Chẩn đoán ứng dụng</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Chỉ ghi sự kiện kỹ thuật; token, email và khóa bí mật được thay bằng `[REDACTED]`.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            loading={isLoading}
            loadingText="Đang đọc"
            leftIcon={<RefreshCw size={15} />}
            onClick={() => void refresh()}
          >
            Làm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-5 sm:pt-6">
        {error && (
          <Alert tone="danger" title="Không thể tải diagnostics" description={error} className="mb-5" />
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3.5">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              <PackageCheck size={15} /> Phiên bản
            </span>
            <p className="mt-2 font-extrabold text-slate-900">{diagnostics?.app.version ?? "Đang đọc…"}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3.5">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              <MonitorCog size={15} /> Nền tảng
            </span>
            <p className="mt-2 font-extrabold text-slate-900">{platformLabel ?? "Đang đọc…"}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3.5">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              <FileClock size={15} /> Log local
            </span>
            <p className="mt-2 truncate font-extrabold text-slate-900">
              {diagnostics?.logFileName ?? "Đang đọc…"}
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Sự kiện gần đây</p>
            <Badge tone={diagnostics?.app.packaged ? "success" : "warning"}>
              {diagnostics?.app.packaged ? "Bản đóng gói" : "Development"}
            </Badge>
          </div>
          <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto bg-white">
            {diagnostics?.recentLogs.length ? (
              diagnostics.recentLogs.slice().reverse().map((entry, index) => (
                <div key={`${entry.timestamp}-${index}`} className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_5rem_1fr] sm:gap-3">
                  <time className="text-xs text-slate-400">
                    {new Intl.DateTimeFormat("vi-VN", {
                      dateStyle: "short",
                      timeStyle: "medium",
                    }).format(new Date(entry.timestamp))}
                  </time>
                  <Badge
                    tone={entry.level === "ERROR" ? "danger" : entry.level === "WARN" ? "warning" : "info"}
                    className="w-fit"
                  >
                    {entry.level}
                  </Badge>
                  <p className="break-words text-xs leading-5 text-slate-600">
                    <strong className="text-slate-800">{entry.event}</strong> — {entry.message}
                  </p>
                </div>
              ))
            ) : (
              <p className="px-4 py-6 text-center text-sm text-slate-500">
                Chưa có sự kiện chẩn đoán nào.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
