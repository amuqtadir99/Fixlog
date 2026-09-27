/**
 * Email bodies. Pure functions (unit tested). All dynamic text is escaped —
 * item and task names are user input.
 */
import { formatDate, relativeDue, type Urgency } from "../domain";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

function layout(title: string, body: string, footer: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f9f9f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0b0b0b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fcfcfb;border:1px solid #e1e0d9;border-radius:16px;padding:24px">
<tr><td style="font-weight:600;font-size:16px;padding-bottom:16px">🔧 FixLog</td></tr>
<tr><td>${body}</td></tr>
</table>
<p style="max-width:560px;font-size:12px;color:#6f6d68;line-height:1.5;margin:16px auto 0">${footer}</p>
</td></tr></table></body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:#2a78d6;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:8px">${escapeHtml(label)}</a>`;
}

export interface DigestTask {
  id: string;
  title: string;
  assetName: string;
  dueOn: string;
  urgency: Urgency;
}

export function digestEmail(opts: {
  tasks: DigestTask[];
  today: string;
  leadDays: number;
  appUrl: string;
  unsubscribeUrl: string;
}): EmailContent {
  const overdue = opts.tasks.filter((t) => t.urgency === "overdue");
  const upcoming = opts.tasks.filter((t) => t.urgency !== "overdue");
  const subject =
    overdue.length > 0
      ? `${overdue.length} overdue · ${upcoming.length} coming up — FixLog`
      : `${upcoming.length} maintenance task${upcoming.length === 1 ? "" : "s"} coming up — FixLog`;

  const section = (heading: string, color: string, list: DigestTask[]) =>
    list.length === 0
      ? ""
      : `<h2 style="font-size:14px;margin:20px 0 8px;color:${color}">${escapeHtml(heading)}</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${list
          .map(
            (t) => `<tr><td style="padding:8px 0;border-top:1px solid #e1e0d9">
<a href="${escapeHtml(`${opts.appUrl}/tasks/${t.id}`)}" style="color:#0b0b0b;font-weight:600;text-decoration:none">${escapeHtml(t.title)}</a>
<div style="font-size:12px;color:#52514e">${escapeHtml(t.assetName)} · ${escapeHtml(formatDate(t.dueOn))} (${escapeHtml(relativeDue(t.dueOn, opts.today))})</div>
</td></tr>`,
          )
          .join("")}</table>`;

  const html = layout(
    subject,
    `<p style="margin:0 0 4px;font-size:15px">Here's what needs attention around the house.</p>
${section("⚠ Overdue", "#b42828", overdue)}
${section(`Due in the next ${opts.leadDays} days`, "#0b0b0b", upcoming)}
<p style="margin:24px 0 0">${button(`${opts.appUrl}/dashboard`, "Open dashboard")}</p>`,
    `You're getting this because you turned on reminders in FixLog. <a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:#6f6d68">Unsubscribe</a> · <a href="${escapeHtml(`${opts.appUrl}/settings`)}" style="color:#6f6d68">Change settings</a>`,
  );

  const line = (t: DigestTask) =>
    `- ${t.title} (${t.assetName}): ${formatDate(t.dueOn)}, ${relativeDue(t.dueOn, opts.today)}`;
  const text = [
    "Here's what needs attention around the house.",
    overdue.length ? `\nOVERDUE\n${overdue.map(line).join("\n")}` : "",
    upcoming.length ? `\nDUE IN THE NEXT ${opts.leadDays} DAYS\n${upcoming.map(line).join("\n")}` : "",
    `\nOpen dashboard: ${opts.appUrl}/dashboard`,
    `Unsubscribe: ${opts.unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}

export function verificationEmail(opts: { verifyUrl: string }): EmailContent {
  const subject = "Confirm your email for FixLog reminders";
  return {
    subject,
    html: layout(
      subject,
      `<p style="margin:0 0 16px;font-size:15px">Confirm this address to start getting maintenance reminders from FixLog.</p>
<p style="margin:0 0 16px">${button(opts.verifyUrl, "Confirm email")}</p>
<p style="margin:0;font-size:12px;color:#52514e">The link expires in 24 hours.</p>`,
      "If you didn't ask for this, you can ignore this email and nothing will be sent to you.",
    ),
    text: `Confirm this address to start getting maintenance reminders from FixLog:\n${opts.verifyUrl}\n\nThe link expires in 24 hours. If you didn't ask for this, ignore this email.`,
  };
}

export function testEmail(opts: { appUrl: string; unsubscribeUrl: string }): EmailContent {
  const subject = "FixLog test email";
  return {
    subject,
    html: layout(
      subject,
      `<p style="margin:0 0 16px;font-size:15px">Email reminders are working. You'll get a summary of overdue and upcoming maintenance on the schedule you picked.</p>
<p style="margin:0">${button(`${opts.appUrl}/settings`, "Reminder settings")}</p>`,
      `<a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:#6f6d68">Unsubscribe</a>`,
    ),
    text: `Email reminders are working.\nSettings: ${opts.appUrl}/settings\nUnsubscribe: ${opts.unsubscribeUrl}`,
  };
}
