import { useId, useState } from "react";
import { CheckCircle2, LockKeyhole, Send, ShieldCheck, X } from "lucide-react";

import { Alert, Badge, Button } from "@/components";

interface FacebookConsentDialogProps {
  open: boolean;
  mode: "connect" | "publish";
  postTitle?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function FacebookConsentDialog({
  open,
  mode,
  postTitle,
  isSubmitting = false,
  onClose,
  onConfirm,
}: FacebookConsentDialogProps) {
  const titleId = useId();
  const [acknowledged, setAcknowledged] = useState(false);

  if (!open) return null;

  const isConnect = mode === "connect";

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
        aria-label="Đóng xác nhận"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start gap-4 border-b border-slate-100 p-5 sm:p-6">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700">
            {isConnect ? <ShieldCheck size={22} /> : <Send size={21} />}
          </span>
          <div className="min-w-0 flex-1">
            <Badge tone="warning">Dữ liệu sắp rời máy</Badge>
            <h2 id={titleId} className="mt-2 text-xl font-black text-slate-950">
              {isConnect ? "Xác nhận kết nối Facebook Page" : "Xác nhận thử đăng lại"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {isConnect
                ? "Bạn sẽ được chuyển tới Facebook để cấp quyền cho Backend local."
                : `Nội dung “${postTitle ?? "đã duyệt"}” sẽ được Backend gửi lại tới Facebook.`}
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              Dữ liệu được phép gửi
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {(isConnect
                ? [
                    "Tên và ID Facebook Page",
                    "Quyền đăng và đọc trạng thái Page",
                    "Nội dung đã APPROVED/SCHEDULED",
                    "Ảnh và thời điểm đăng đã chọn",
                  ]
                : [
                    "Tiêu đề và nội dung đã duyệt",
                    "Ảnh gắn với bài viết",
                    "Facebook Page đã kết nối",
                    "Mã yêu cầu chống đăng trùng",
                  ]).map((item) => (
                <li key={item} className="flex gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Alert
            tone="success"
            title="Dữ liệu vẫn ở lại máy"
            description="Tài liệu doanh nghiệp, context RAG, prompt AI, bản nháp chưa duyệt và log nội bộ không được gửi tới Facebook. Token do Backend/credential store giữ và không trả về giao diện."
          />

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-300">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="mt-0.5 size-5 accent-emerald-600"
            />
            <span>
              <span className="block text-sm font-bold text-slate-900">
                Tôi hiểu và đồng ý với lần truyền dữ liệu này
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Consent phiên bản 2026-08 được gửi tới Backend để ghi audit, không lưu token trong renderer.
              </span>
            </span>
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Hủy</Button>
            <Button
              disabled={!acknowledged}
              loading={isSubmitting}
              loadingText={isConnect ? "Đang chuẩn bị" : "Đang đưa vào hàng đợi"}
              leftIcon={<LockKeyhole size={16} />}
              onClick={() => void onConfirm()}
            >
              {isConnect ? "Tiếp tục tới Facebook" : "Xác nhận thử lại"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
