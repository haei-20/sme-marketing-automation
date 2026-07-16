import { Component, type ErrorInfo, type PropsWithChildren } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components";

interface ErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("SMEFlow render error", error, info.componentStack);
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
        <section className="w-full max-w-lg rounded-3xl border border-rose-100 bg-white p-7 text-center shadow-xl shadow-slate-900/8 sm:p-9">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle size={26} />
          </span>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
            Giao diện vừa gặp sự cố
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Dữ liệu của bạn không bị ảnh hưởng. Hãy tải lại trang để tiếp tục.
          </p>
          {import.meta.env.DEV && (
            <details className="mt-5 rounded-xl bg-slate-50 p-3 text-left text-xs text-rose-700">
              <summary className="cursor-pointer font-bold">Chi tiết dành cho lập trình viên</summary>
              <code className="mt-2 block break-words leading-5">{this.state.error.message}</code>
            </details>
          )}
          <Button
            className="mt-6"
            leftIcon={<RotateCcw size={17} />}
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </Button>
        </section>
      </main>
    );
  }
}
