import { useCallback, useEffect, useMemo, useState } from "react";

export type LocalServiceName = "backend" | "ai" | "ollama" | "mysql";
export type LocalServiceStatus = "UP" | "DOWN" | "UNKNOWN";

export interface ServiceHealth {
  name: LocalServiceName;
  status: LocalServiceStatus;
  checkedAt: string;
  message?: string;
}

const serviceOrder: LocalServiceName[] = ["mysql", "ollama", "backend", "ai"];

export function sortServiceHealth(services: ServiceHealth[]): ServiceHealth[] {
  return [...services].sort(
    (left, right) => serviceOrder.indexOf(left.name) - serviceOrder.indexOf(right.name),
  );
}

export function areLocalServicesReady(services: ServiceHealth[]): boolean {
  return (
    services.length === serviceOrder.length &&
    serviceOrder.every((name) =>
      services.some((service) => service.name === name && service.status === "UP"),
    )
  );
}

export function useDesktopServiceHealth() {
  const desktopApi = window.smeDesktop;
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(desktopApi));
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    if (!desktopApi) return;

    setIsLoading(true);
    setError(undefined);
    try {
      setServices(sortServiceHealth(await desktopApi.getServiceHealth()));
    } catch {
      setError("Không đọc được trạng thái dịch vụ từ ứng dụng desktop.");
    } finally {
      setIsLoading(false);
    }
  }, [desktopApi]);

  useEffect(() => {
    if (!desktopApi) return;

    let active = true;
    void desktopApi
      .getServiceHealth()
      .then((nextServices) => {
        if (!active) return;
        setServices(sortServiceHealth(nextServices));
        setError(undefined);
      })
      .catch(() => {
        if (active) setError("Không đọc được trạng thái dịch vụ từ ứng dụng desktop.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    const unsubscribe = desktopApi.onServiceHealthChanged((nextServices) => {
      setServices(sortServiceHealth(nextServices));
      setError(undefined);
      setIsLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [desktopApi]);

  return useMemo(
    () => ({
      services,
      isLoading,
      error,
      isDesktop: Boolean(desktopApi),
      isReady: !desktopApi || areLocalServicesReady(services),
      refresh,
    }),
    [desktopApi, error, isLoading, refresh, services],
  );
}
