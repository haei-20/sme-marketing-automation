// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { PublishingLogsPage } from "./PublishingLogsPage";

describe("PublishingLogsPage", () => {
  it("yêu cầu consent rồi khóa retry lặp bằng trạng thái RETRYING", async () => {
    const user = userEvent.setup();
    render(
      <HelmetProvider>
        <MemoryRouter><PublishingLogsPage /></MemoryRouter>
      </HelmetProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Thử lại có xác nhận" }));
    expect(screen.getByRole("dialog", { name: "Xác nhận thử đăng lại" })).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: "Xác nhận thử lại" });
    expect(retryButton).toBeDisabled();
    await user.click(screen.getByRole("checkbox"));
    await user.click(retryButton);

    expect(await screen.findByText("Đang thử lại")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Thử lại có xác nhận" })).not.toBeInTheDocument();
    expect(screen.getByText("Đã khóa nhấp lặp")).toBeInTheDocument();
  });
});
