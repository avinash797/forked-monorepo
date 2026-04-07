import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin/auth";
import { getPendingReportCount } from "@/lib/admin/report-queries";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await getPendingReportCount();
  return NextResponse.json({ count });
}
