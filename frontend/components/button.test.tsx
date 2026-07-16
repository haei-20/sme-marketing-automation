// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("gọi hành động khi người dùng nhấn", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Tạo chiến dịch</Button>);

    await user.click(screen.getByRole("button", { name: "Tạo chiến dịch" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("khóa tương tác và thông báo trạng thái khi đang xử lý", () => {
    render(<Button loading loadingText="Đang tạo">Tạo</Button>);

    const button = screen.getByRole("button", { name: "Đang tạo" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
