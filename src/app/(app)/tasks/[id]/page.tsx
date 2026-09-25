import { Trash2 } from "lucide-react";
import Link from "next/link";
import { CommentForm } from "@/components/features/comment-form";
import { CompleteTaskButton } from "@/components/features/complete-task";
import { HistoryList } from "@/components/features/history-list";
import { StatusSelect } from "@/components/features/status-select";
import { EditTaskButton } from "@/components/features/task-form";
import { CategoryChip, PriorityBadge, UrgencyBadge } from "@/components/ui/badges";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { describeInterval, formatDate, getUrgency, relativeDue } from "@/lib/domain";
import { deleteComment, deleteTask } from "@/server/actions/tasks";
import { getTaskDetail } from "@/server/queries";
import { getToday } from "@/server/today";
import { format, parseISO } from "date-fns";

export default async function TaskPage({ params }: PageProps<"/tasks/[id]">) {
  const { id } = await params;
  const [{ task, comments, logs }, today] = await Promise.all([getTaskDetail(id), getToday()]);
  const urgency = getUrgency(task, today);

  return (
    <>
      <nav className="text-muted mb-2 text-sm">
        <Link href="/items" className="hover:underline">
          Items
        </Link>{" "}
        /{" "}
        <Link href={`/items/${task.asset.id}`} className="hover:underline">
          {task.asset.name}
        </Link>{" "}
        / {task.title}
      </nav>
      <PageHeader
        title={task.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <UrgencyBadge urgency={urgency} />
            <PriorityBadge priority={task.priority} />
            <CategoryChip category={task.asset.category} />
          </span>
        }
        action={
          <>
            <StatusSelect id={task.id} status={task.status} className="h-10" />
            <CompleteTaskButton taskId={task.id} taskTitle={task.title} today={today} variant="primary" />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Comments" description="Notes, quotes, part numbers, who you called." />
            {comments.length ? (
              <ul className="mb-4 space-y-3">
                {comments.map((c) => (
                  <li key={c.id} className="group bg-surface-2 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-ink text-sm whitespace-pre-wrap">{c.body}</p>
                      <ConfirmButton
                        variant="ghost"
                        className="px-2 opacity-60 group-hover:opacity-100"
                        action={deleteComment.bind(null, c.id)}
                        confirmText="Delete this comment?"
                      >
                        <Trash2 className="size-3.5" aria-label="Delete comment" />
                      </ConfirmButton>
                    </div>
                    <p className="text-muted mt-1 text-xs">
                      <time dateTime={c.created_at}>{format(parseISO(c.created_at), "MMM d, yyyy · h:mm a")}</time>
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
            <CommentForm taskId={task.id} />
          </Card>
          <Card>
            <CardHeader title="Completion history" />
            <HistoryList logs={logs} />
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Schedule" action={<EditTaskButton task={task} />} />
          <dl className="space-y-2 text-sm">
            {[
              ["Repeats", describeInterval(task.interval_value, task.interval_unit)],
              [
                "Next due",
                task.next_due_on ? `${formatDate(task.next_due_on)} · ${relativeDue(task.next_due_on, today)}` : "—",
              ],
              ["Last done", formatDate(task.last_completed_on)],
              ["Times done", String(logs.length)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted">{k}</dt>
                <dd className="text-ink text-right">{v}</dd>
              </div>
            ))}
          </dl>
          {task.description ? <p className="text-ink-2 mt-4 text-sm whitespace-pre-wrap">{task.description}</p> : null}
          <div className="border-line mt-6 border-t pt-4">
            <ConfirmButton
              action={deleteTask.bind(null, task.id, `/items/${task.asset.id}`)}
              confirmText="Delete this task and its comments? Service history is kept."
            >
              <Trash2 className="size-4" aria-hidden /> Delete task
            </ConfirmButton>
          </div>
        </Card>
      </div>
    </>
  );
}
