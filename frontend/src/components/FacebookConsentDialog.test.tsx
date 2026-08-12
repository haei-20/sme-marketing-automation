// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FacebookConsentDialog } from "./FacebookConsentDialog";

afterEach(cleanup);

describe("FacebookConsentDialog", () => {
  it("khóa hành động cho tới khi người dùng xác nhận dữ liệu rời máy", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <FacebookConsentDialog
        open
        mode="connect"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const continueButton = screen.getByRole("button", { name: "Tiếp tục tới Facebook" });
    expect(continueButton).toBeDisabled();
    await user.click(screen.getByRole("checkbox"));
    expect(continueButton).toBeEnabled();
    await user.click(continueButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("nói rõ dữ liệu không được gửi và không yêu cầu nhập token", () => {
    const { container } = render(
      <FacebookConsentDialog
        open
        mode="publish"
        postTitle="Bài đã duyệt"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText(/Tài liệu doanh nghiệp, context RAG, prompt AI/i)).toBeInTheDocument();
    expect(container.querySelector('input[type="text"]')).toBeNull();
    expect(container.querySelector('input[type="password"]')).toBeNull();
  });
});
