import { afterEach, describe, expect, it, vi } from "vitest";
import { classifyDbError } from "@/lib/db-errors";
import { sendEmail, unsubscribeHeaders } from "@/lib/email/resend";
import { digestEmail, escapeHtml, verificationEmail, type DigestTask } from "@/lib/email/templates";
import { hashToken, isDigestDue, newToken } from "@/server/notifications";

const task = (over: Partial<DigestTask>): DigestTask => ({
  id: "00000000-0000-0000-0000-000000000001",
  title: "Oil change",
  assetName: "Civic",
  dueOn: "2026-09-30",
  urgency: "due_soon",
  ...over,
});

describe("digest email", () => {
  const base = {
    today: "2026-09-27",
    leadDays: 7,
    appUrl: "https://app.example",
    unsubscribeUrl: "https://app.example/unsubscribe?token=abc",
  };

  it("escapes user-provided text (no HTML injection)", () => {
    const { html } = digestEmail({
      ...base,
      tasks: [task({ title: `<img src=x onerror="alert(1)">`, assetName: "A & B" })],
    });
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("A &amp; B");
  });

  it("groups overdue first and summarises in the subject", () => {
    const out = digestEmail({
      ...base,
      tasks: [task({ urgency: "overdue", dueOn: "2026-09-01", title: "Late one" }), task({ title: "Soon one" })],
    });
    expect(out.subject).toBe("1 overdue · 1 coming up — FixLog");
    expect(out.html.indexOf("Late one")).toBeLessThan(out.html.indexOf("Soon one"));
    expect(out.text).toContain("OVERDUE");
    expect(out.text).toContain("26 days overdue");
    expect(out.html).toContain("https://app.example/tasks/00000000-0000-0000-0000-000000000001");
    expect(out.html).toContain(escapeHtml(base.unsubscribeUrl));
  });

  it("verification email carries the link", () => {
    const { html, text } = verificationEmail({ verifyUrl: "https://app.example/api/notifications/verify?token=t&x=1" });
    expect(html).toContain("token=t&amp;x=1");
    expect(text).toContain("token=t&x=1");
  });

  it("escapeHtml covers quotes", () => {
    expect(escapeHtml(`'"<>&`)).toBe("&#39;&quot;&lt;&gt;&amp;");
  });
});

describe("digest schedule", () => {
  const now = new Date("2026-09-27T08:00:00Z");
  it("sends first digest immediately and respects frequency", () => {
    expect(isDigestDue({ frequency: "weekly", last_sent_at: null }, now)).toBe(true);
    expect(isDigestDue({ frequency: "daily", last_sent_at: "2026-09-26T08:05:00Z" }, now)).toBe(true);
    expect(isDigestDue({ frequency: "daily", last_sent_at: "2026-09-27T01:00:00Z" }, now)).toBe(false);
    expect(isDigestDue({ frequency: "weekly", last_sent_at: "2026-09-22T08:00:00Z" }, now)).toBe(false);
    expect(isDigestDue({ frequency: "weekly", last_sent_at: "2026-09-20T08:10:00Z" }, now)).toBe(true);
  });
});

describe("tokens", () => {
  it("are 256-bit url-safe and stored hashed", () => {
    const t = newToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(newToken()).not.toBe(t);
    expect(hashToken(t)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(t)).not.toContain(t);
  });
});

describe("resend client", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("posts to Resend with auth, sender and unsubscribe headers", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "FixLog <hi@example.com>");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "email_1" }), { status: 200 }));
    const res = await sendEmail(
      "a@example.com",
      { subject: "S", html: "<p>h</p>", text: "t" },
      {
        headers: unsubscribeHeaders("https://x/u"),
        idempotencyKey: "k1",
      },
      fetchMock as unknown as typeof fetch,
    );
    expect(res).toEqual({ ok: true, id: "email_1" });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    expect((init.headers as Record<string, string>)["Idempotency-Key"]).toBe("k1");
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ from: "FixLog <hi@example.com>", to: ["a@example.com"], subject: "S" });
    expect(body.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });

  it("reports failures without throwing, and refuses without a key", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fail = vi.fn(
      async () => new Response(JSON.stringify({ name: "validation_error", message: "bad from" }), { status: 422 }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      await sendEmail("a@example.com", { subject: "", html: "", text: "" }, {}, fail as unknown as typeof fetch),
    ).toEqual({ ok: false, error: "bad from" });
    vi.stubEnv("RESEND_API_KEY", "");
    expect((await sendEmail("a@example.com", { subject: "", html: "", text: "" })).ok).toBe(false);
  });
});

describe("classifyDbError", () => {
  it.each([
    [{ code: "PGRST205", message: "Could not find the table 'public.assets' in the schema cache" }, "missing_tables"],
    [{ code: "42P01", message: 'relation "assets" does not exist' }, "missing_tables"],
    [{ code: "PGRST301", message: "No suitable key or wrong key type" }, "auth_integration"],
    [{ code: "42501", message: "permission denied for table assets" }, "auth_integration"],
    [{ code: "", message: "JWSError JWSInvalidSignature" }, "auth_integration"],
    [{ code: "23505", message: "duplicate key" }, null],
  ] as const)("%j → %s", (err, expected) => {
    expect(classifyDbError(err)).toBe(expected);
  });
});
