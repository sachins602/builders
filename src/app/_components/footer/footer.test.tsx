import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Footer from "./footer";

describe("Footer", () => {
  it("renders the footer element", () => {
    render(<Footer />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
  });

  it("displays copyright text with current year", () => {
    const currentYear = new Date().getFullYear();
    render(<Footer />);

    // Check that the footer contains all the expected text parts
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent(
      `© ${currentYear} BT @ Conestoga College. All rights reserved.`,
    );
  });

  it("has correct styling classes", () => {
    render(<Footer />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveClass(
      "flex",
      "h-8",
      "w-full",
      "items-center",
      "justify-end",
      "p-2",
      "text-black",
    );

    const copyrightText = footer.querySelector("div");
    expect(copyrightText).toHaveClass("text-[10px]");
  });
});
