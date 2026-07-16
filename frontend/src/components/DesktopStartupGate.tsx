import type { ReactNode } from "react";

import { useDesktopServiceHealth } from "../desktop/service-health";
import { BrandMark } from "./BrandMark";
import { ServiceStatusPanel } from "./ServiceStatusPanel";

export function DesktopStartupGate({ children }: { children: ReactNode }) {
  const health = useDesktopServiceHealth();

  if (!health.isDesktop || health.isReady) return children;

  return (
    <main className="min-h-screen bg-[#f5f7f4] px-4 py-6 text-slate-950 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 w-fit rounded-2xl bg-[#10251f] px-4 py-3">
          <BrandMark />
        </div>
        <ServiceStatusPanel
          services={health.services}
          isLoading={health.isLoading}
          error={health.error}
          onRefresh={health.refresh}
          showIntroduction
        />
      </div>
    </main>
  );
}
