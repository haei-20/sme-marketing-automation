import { useState, type FormEvent } from "react";
import { Building2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { Alert, Button, Input, Select, Textarea } from "@/components";

import { useAuth } from "../contexts/AuthContext";
import { AuthLayout } from "../layouts/AuthLayout";

export function RegisterPage() {
  const { register, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password"));
    const confirmPassword = String(data.get("confirmPassword"));
    if (password.length < 8) {
      setError("Mật khẩu cần có ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận chưa trùng khớp.");
      return;
    }
    try {
      await register({
        email: String(data.get("email")),
        password,
        fullName: String(data.get("fullName")),
        businessName: String(data.get("businessName")),
        industry: String(data.get("industry")),
        businessDescription: String(data.get("businessDescription")),
      });
      navigate("/dashboard", { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tạo tài khoản.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Tạo tài khoản | SMEFlow AI</title>
      </Helmet>
      <AuthLayout
        eyebrow="Bắt đầu trong vài phút"
        title="Tạo không gian cho doanh nghiệp"
        description="Thông tin này giúp AI lập kế hoạch và viết nội dung phù hợp với bối cảnh kinh doanh."
      >
        {error && <Alert tone="danger" className="mb-5" title="Chưa thể tạo tài khoản" description={error} />}
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="fullName" label="Họ và tên" required leading={<UserRound size={17} />} />
            <Input name="email" type="email" label="Email" required leading={<Mail size={17} />} />
          </div>
          <Input name="businessName" label="Tên doanh nghiệp" required leading={<Building2 size={17} />} />
          <Select name="industry" label="Lĩnh vực" required defaultValue="">
            <option value="" disabled>Chọn lĩnh vực</option>
            <option>Thiết bị gia dụng</option>
            <option>Bán lẻ</option>
            <option>Thực phẩm & đồ uống</option>
            <option>Giáo dục</option>
            <option>Dịch vụ chuyên nghiệp</option>
            <option>Khác</option>
          </Select>
          <Textarea
            name="businessDescription"
            label="Mô tả ngắn"
            rows={3}
            placeholder="Sản phẩm, khách hàng mục tiêu và điểm khác biệt..."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="password" type="password" label="Mật khẩu" required leading={<LockKeyhole size={17} />} />
            <Input name="confirmPassword" type="password" label="Xác nhận" required leading={<LockKeyhole size={17} />} />
          </div>
          <label className="flex items-start gap-2.5 text-xs leading-5 text-slate-500">
            <input required type="checkbox" className="mt-0.5 size-4 rounded accent-emerald-600" />
            Tôi đồng ý sử dụng dữ liệu đúng mục đích và tuân thủ chính sách của các nền tảng phân phối nội dung.
          </label>
          <Button type="submit" size="lg" fullWidth loading={isLoading} loadingText="Đang khởi tạo...">
            Tạo không gian làm việc
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-bold text-emerald-700">Đăng nhập</Link>
        </p>
      </AuthLayout>
    </>
  );
}
