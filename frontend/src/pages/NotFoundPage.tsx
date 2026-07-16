import { ArrowLeft, Compass } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { Button } from "@/components";

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#10251f] px-5 text-center text-white">
      <Helmet><title>Không tìm thấy trang | SMEFlow AI</title></Helmet>
      <div>
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-400 text-slate-950"><Compass size={30} /></span>
        <p className="mt-7 text-sm font-black uppercase tracking-[0.24em] text-emerald-300">Lỗi 404</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Trang này chưa có trong kế hoạch.</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-400">Đường dẫn có thể đã thay đổi hoặc nội dung chưa được tạo.</p>
        <Link to="/dashboard" className="mt-7 inline-block">
          <Button className="bg-emerald-400 text-slate-950 hover:bg-emerald-300" leftIcon={<ArrowLeft size={17} />}>Về tổng quan</Button>
        </Link>
      </div>
    </main>
  );
}
