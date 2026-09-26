import { afterEach, describe, expect, it, vi } from "vitest";
import { getAuthMode, missingConfig } from "@/lib/auth-mode";

const base = {
  NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
  CLERK_SECRET_KEY: "",
  DEMO_MODE: "",
  SUPABASE_SECRET_KEY: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
};
const setEnv = (env: Record<string, string>) => {
  for (const [k, v] of Object.entries({ ...base, ...env })) vi.stubEnv(k, v);
};

afterEach(() => vi.unstubAllEnvs());

describe("auth mode", () => {
  it("fails closed when nothing is configured", () => {
    setEnv({});
    expect(getAuthMode()).toBe("unconfigured");
    expect(missingConfig().some((m) => m.includes("CLERK_SECRET_KEY"))).toBe(true);
  });

  it("uses demo mode only when explicitly enabled", () => {
    setEnv({ DEMO_MODE: "1" });
    expect(getAuthMode()).toBe("unconfigured");
    setEnv({ DEMO_MODE: "true", SUPABASE_SERVICE_ROLE_KEY: "service" });
    expect(getAuthMode()).toBe("demo");
    expect(missingConfig()).toEqual([]);
  });

  it("demo mode needs the Supabase secret key", () => {
    setEnv({ DEMO_MODE: "true" });
    expect(missingConfig()).toEqual([expect.stringContaining("SUPABASE_SECRET_KEY")]);
  });

  it("Clerk always wins over demo mode", () => {
    setEnv({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk", CLERK_SECRET_KEY: "sk", DEMO_MODE: "true" });
    expect(getAuthMode()).toBe("clerk");
  });

  it("accepts the legacy anon key name", () => {
    setEnv({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk",
      CLERK_SECRET_KEY: "sk",
    });
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    expect(missingConfig()).toEqual([]);
  });
});
