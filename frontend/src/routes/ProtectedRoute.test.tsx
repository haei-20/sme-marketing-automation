// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { mockSession, sessionStore } from "@/lib";

import { AuthProvider } from "../contexts/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";

function TestRoutes() {
  return (
    <AuthProvider>
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route path="/login" element={<p>Trang đăng nhập</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/private" element={<p>Nội dung được bảo vệ</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => sessionStore.clear());

  it("chuyển người chưa đăng nhập về trang đăng nhập", () => {
    render(<TestRoutes />);
    expect(screen.getByText("Trang đăng nhập")).toBeInTheDocument();
  });

  it("cho phép phiên hợp lệ truy cập route bảo vệ", () => {
    sessionStore.setSession(mockSession);
    render(<TestRoutes />);
    expect(screen.getByText("Nội dung được bảo vệ")).toBeInTheDocument();
  });
});
