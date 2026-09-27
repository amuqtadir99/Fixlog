import { GettingStartedSteps, SectionGuide } from "@/components/features/guide";
import { UrgencyBadge } from "@/components/ui/badges";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { STATUS_LABELS, TASK_STATUSES, type Urgency } from "@/lib/domain";

export const metadata = { title: "Help" };

const STATUS_HELP: Record<(typeof TASK_STATUSES)[number], string> = {
  pending: "Not started yet.",
  in_progress: "You're working on it.",
  waiting_parts: "Waiting for a part or supplies.",
  scheduled_pro: "A professional is booked.",
  on_hold: "Paused on purpose.",
  done: "Finished (one-off tasks). Recurring tasks go back to Pending when marked done.",
};

const URGENCY_HELP: [Urgency, string][] = [
  ["overdue", "The due date has passed."],
  ["due_soon", "Due within the next 7 days."],
  ["upcoming", "Due within the next 30 days."],
  ["later", "More than 30 days away."],
  ["unscheduled", "No due date set."],
];

const FAQ: [string, string][] = [
  [
    "What happens when I click “Mark done”?",
    "A history entry is saved with the date, cost, who did it and your notes. If the task repeats, its next due date moves forward by the interval, counted from the date you did it.",
  ],
  [
    "How is the health score worked out?",
    "It starts at 100 and drops for overdue work. Critical and high-priority tasks, and tasks that are very late, count for more. Tasks due this week count a little.",
  ],
  ["Can I add my own tasks?", "Yes. Open an item and click “Add task”. Leave “Repeat every” empty for a one-off job."],
  [
    "How do I get my data out?",
    "History → Export CSV gives a spreadsheet of every service. Calendar → Export .ics adds due dates to Google, Apple or Outlook calendar.",
  ],
  [
    "How do email reminders work?",
    "In Settings, choose an address, confirm it from the email we send, and pick daily or weekly. You'll get a summary of overdue work and anything due soon. Every email has an unsubscribe link.",
  ],
];

export default function HelpPage() {
  return (
    <>
      <PageHeader title="Help" description="How FixLog works and where to find things." />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Getting started" />
          <GettingStartedSteps />
        </Card>
        <section>
          <h2 className="text-ink mb-3 text-base font-semibold">Where things are</h2>
          <SectionGuide />
        </section>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="What the due labels mean" />
            <dl className="space-y-3 text-sm">
              {URGENCY_HELP.map(([u, text]) => (
                <div key={u} className="flex items-start gap-3">
                  <dt className="w-36 shrink-0">
                    <UrgencyBadge urgency={u} />
                  </dt>
                  <dd className="text-ink-2">{text}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card>
            <CardHeader title="Task statuses" description="Pick one from the dropdown next to any task." />
            <dl className="space-y-2 text-sm">
              {TASK_STATUSES.map((s) => (
                <div key={s} className="flex gap-3">
                  <dt className="text-ink w-36 shrink-0 font-medium">{STATUS_LABELS[s]}</dt>
                  <dd className="text-ink-2">{STATUS_HELP[s]}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
        <Card>
          <CardHeader title="Questions" />
          <div className="divide-line divide-y">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-3">
                <summary className="text-ink cursor-pointer text-sm font-medium">{q}</summary>
                <p className="text-ink-2 mt-2 text-sm">{a}</p>
              </details>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
