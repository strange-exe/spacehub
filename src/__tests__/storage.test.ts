import { beforeEach, describe, expect, it, vi } from "vitest";
import { readJSON, subscribe, writeJSON } from "@/lib/storage";

describe("namespaced storage", () => {
  beforeEach(() => localStorage.clear());

  it("never touches keys owned by other apps on the same origin", () => {
    localStorage.setItem("someOtherApp", "keep-me");
    writeJSON("favorites", [1, 2]);
    expect(localStorage.getItem("someOtherApp")).toBe("keep-me");
    expect(localStorage.getItem("spacehub:favorites")).toBe("[1,2]");
  });
  it("falls back on corrupt JSON instead of throwing", () => {
    localStorage.setItem("spacehub:favorites", "{oops");
    expect(readJSON("favorites", [])).toEqual([]);
  });
  it("notifies same-tab subscribers", () => {
    const fn = vi.fn();
    const off = subscribe("favorites", fn);
    writeJSON("favorites", []);
    off();
    writeJSON("favorites", []);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
