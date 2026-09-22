import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusIcon } from "./StatusIcon";

describe("StatusIcon", () => {
  it("renders green check for pass status", () => {
    const { container } = render(<StatusIcon status="pass" />);
    expect(container.querySelector(".text-green-500")).toBeInTheDocument();
  });

  it("renders green check for good status", () => {
    const { container } = render(<StatusIcon status="good" />);
    expect(container.querySelector(".text-green-500")).toBeInTheDocument();
  });

  it("renders red x for fail status", () => {
    const { container } = render(<StatusIcon status="fail" />);
    expect(container.querySelector(".text-red-500")).toBeInTheDocument();
  });

  it("renders red x for error status", () => {
    const { container } = render(<StatusIcon status="error" />);
    expect(container.querySelector(".text-red-500")).toBeInTheDocument();
  });

  it("renders yellow warning for unknown status", () => {
    const { container } = render(<StatusIcon status="warn" />);
    expect(container.querySelector(".text-yellow-500")).toBeInTheDocument();
  });
});
