import { NextRequest, NextResponse } from "next/server";
import { runDailyReminderJob } from "@/lib/reminders";

/** Triggered daily (see vercel.json cron) to send auto reminders at days 15/30/45 overdue. */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await runDailyReminderJob();
  return NextResponse.json(result);
}
