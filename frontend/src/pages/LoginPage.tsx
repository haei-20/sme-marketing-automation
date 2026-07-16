import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { Alert, Button, Input } from "@/components";
import { appEnv } from "@/lib";

import { useAuth } from "../contexts/AuthContext";
import { AuthLayout } from "../layouts/AuthLayout";

export function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("nguyen@annhien.vn");
  const [password, setPassword] = useState("Demo@123456");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await login({ email, password });
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? "/dashboard", { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể đăng nhập. Vui lòng thử lại.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Đăng nhập | SMEFlow AI</title>
        <meta name="description" content="Đăng nhập không gian marketing AI riêng tư của doanh nghiệp." />
      </Helmet>
      <AuthLayout
        eyebrow="Chào mừng trở lại"
        title="Tiếp tục vận hành marketing"
        description="Đăng nhập để quản lý tri thức, chiến dịch và nội dung của doanh nghiệp."
      >
        {appEnv.useMocks && (
          <Alert
            tone="info"
            className="mb-5"
            title="Bản demo độc lập"
            description="Tài khoản đã được điền sẵn. Nhấn đăng nhập để trải nghiệm toàn bộ luồng khi backend chưa kết nối."
          />
        )}
        {error && <Alert tone="danger" className="mb-5" title="Đăng nhập thất bại" description={error} />}
        <form className="space-y-5" onSubmit={submit}>
          <Input
            type="email"
            label="Email công việc"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nguyen@doanhnghiep.vn"
            leading={<Mail size={17} />}
          />
          <Input
            type={showPassword ? "text" : "password"}
            label="Mật khẩu"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            leading={<LockKeyhole size={17} />}
            trailing={
              <button
                type="button"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="rounded p-1 hover:text-slate-700"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            }
          />
          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input type="checkbox" className="size-4 rounded border-slate-300 accent-emerald-600" />
              Ghi nhớ email
            </label>
            <button type="button" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Quên mật khẩu?
            </button>
          </div>
          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={isLoading}
            loadingText="Đang xác thực..."
            rightIcon={<Sparkles size={18} />}
          >
            Đăng nhập
          </Button>
        </form>
        <p className="mt-7 text-center text-sm text-slate-500">
          Chưa có không gian làm việc?{" "}
          <Link to="/register" className="font-bold text-emerald-700 hover:text-emerald-800">
            Tạo tài khoản
          </Link>
        </p>
      </AuthLayout>
    </>
  );
}
