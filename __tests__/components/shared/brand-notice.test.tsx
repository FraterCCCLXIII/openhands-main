import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandNotice } from "#/components/shared/brand-notice";
import {
  BRAND_NOTICE_BRANDS,
  BRAND_NOTICE_OWNERS,
  brandNoticeCopyright,
  brandNoticeMarks,
} from "#/constants/brand-notice";

describe("BrandNotice", () => {
  it("names every brand with a TM sign and every owner, with the year and the date", () => {
    render(<BrandNotice />);
    const text = screen.getByTestId("brand-notice").textContent ?? "";
    BRAND_NOTICE_BRANDS.forEach((b) => expect(text).toContain(`${b}™`));
    BRAND_NOTICE_OWNERS.forEach((o) => expect(text).toContain(o));
    expect(text).toContain("© 2026");
    expect(text).toContain("October 30, 2026");
  });

  it("joins lists with commas and a final 'and'", () => {
    expect(brandNoticeMarks()).toContain("Tower™, Commons™");
    expect(brandNoticeCopyright()).toContain(
      "Modern Telepathy Inc and Automic Intelligence Holdings",
    );
  });
});
