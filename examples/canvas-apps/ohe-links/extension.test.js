import { beforeEach, describe, expect, it, vi } from "vitest";
import { activate, cleanAddress, mountTarget } from "./extension.js";

beforeEach(() => localStorage.clear());

describe("cleanAddress", () => {
  it("accepts web addresses and adds https when no scheme is given", () => {
    expect(cleanAddress("ohe.example.com")).toBe("https://ohe.example.com/");
    expect(cleanAddress("http://10.0.0.5:3000/admin")).toBe("http://10.0.0.5:3000/admin");
  });
  it("refuses empty input and non-web schemes", () => {
    expect(cleanAddress("")).toBeNull();
    expect(cleanAddress("javascript:alert(1)")).toBeNull();
    expect(cleanAddress("file:///etc/passwd")).toBeNull();
  });
});

describe("page height", () => {
  it("fills the visible height on mount and again after a window resize", () => {
    const innerHeight = window.innerHeight;
    window.innerHeight = 900;
    try {
      const c = document.createElement("div");
      document.body.append(c);
      mountTarget(c, "ohe");
      const root = c.querySelector(".ol");
      expect(root.style.height).toBe("900px");
      window.innerHeight = 1200;
      window.dispatchEvent(new Event("resize"));
      expect(root.style.height).toBe("1200px");
    } finally {
      window.innerHeight = innerHeight;
    }
  });
});

describe("pages", () => {
  const mount = (id) => { const c = document.createElement("div"); mountTarget(c, id); return c; };
  const btn = (c, text) => [...c.querySelectorAll("button")].find((b) => b.textContent === text);

  it("starts empty with Open disabled, then saves an address per page", () => {
    const c = mount("ohe");
    expect(btn(c, "Open in new tab").disabled).toBe(true);
    c.querySelector("input").value = "ohe.example.com";
    btn(c, "Save").click();
    expect(btn(c, "Open in new tab").disabled).toBe(false);
    expect(JSON.parse(localStorage.getItem("ohe-links:v1"))).toEqual({ ohe: "https://ohe.example.com/" });
    expect(mount("superadmin").querySelector("input").value).toBe("");
  });

  it("rejects an address that is not http or https", () => {
    const c = mount("superadmin");
    c.querySelector("input").value = "javascript:alert(1)";
    btn(c, "Save").click();
    expect(c.querySelector(".err").textContent).toMatch(/http/);
    expect(localStorage.getItem("ohe-links:v1")).toBeNull();
  });

  it("opens the saved address in a new tab without an opener", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const c = mount("ohe");
    c.querySelector("input").value = "https://ohe.example.com";
    btn(c, "Save").click();
    btn(c, "Open in new tab").click();
    expect(openSpy).toHaveBeenCalledWith("https://ohe.example.com/", "_blank", "noopener,noreferrer");
  });

  it("shows the page in a sandboxed frame on request", () => {
    const c = mount("ohe");
    c.querySelector("input").value = "https://ohe.example.com";
    btn(c, "Save").click();
    btn(c, "Show here").click();
    expect(c.querySelector("iframe").getAttribute("sandbox")).toContain("allow-scripts");
  });

  it("registers an OHE page and a Superadmin page", () => {
    const registerPage = vi.fn(() => () => {});
    activate({ apiVersion: "1", registerPage });
    expect(registerPage.mock.calls.map((c) => c[0])).toEqual(["ohe", "superadmin"]);
    expect(() => activate({ apiVersion: "2" })).toThrow();
  });
});
