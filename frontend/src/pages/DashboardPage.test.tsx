// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { mockSession, sessionStore } from "@/lib";

import { AuthProvider } from "../contexts/AuthContext";
import { DashboardPage } from "./DashboardPage";

describe("DashboardPage", () => {
  it("render được bài PENDING mà không làm trắng trang", () => {
    sessionStore.setSession(mockSession);
    render(
      <HelmetProvider>
        <MemoryRouter>
          <AuthProvider>
            <DashboardPage />
          </AuthProvider>
        </MemoryRouter>
      </HelmetProvider>,
    );

    expect(screen.getByText(/hôm nay mình tạo gì/i)).toBeInTheDocument();
    expect(screen.getAllByText("Chờ duyệt").length).toBeGreaterThan(0);
  });
});
