// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { describe, expect, it } from "vitest";

import { IntegrationsPage } from "./IntegrationsPage";

describe("IntegrationsPage", () => {
  it("chỉ hiển thị Ollama local và Facebook opt-in", async () => {
    const user = userEvent.setup();
    render(<HelmetProvider><IntegrationsPage /></HelmetProvider>);

    expect(screen.getByText("Ollama Local LLM")).toBeInTheDocument();
    expect(screen.getByText("Facebook Pages")).toBeInTheDocument();
    expect(screen.queryByText("Amazon S3")).not.toBeInTheDocument();
    expect(screen.queryByText("Google Sheets")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Kết nối lại an toàn" }));
    expect(screen.getByRole("dialog", { name: "Xác nhận kết nối Facebook Page" })).toBeInTheDocument();
  });
});
