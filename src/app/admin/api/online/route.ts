import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth/server";
import { getNewLeadsCount, getOnlineCount } from "@/lib/admin/queries";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [online, newLeads] = await Promise.all([getOnlineCount(), getNewLeadsCount()]);
  return NextResponse.json({ online, newLeads }, { headers: { "cache-control": "no-store" } });
}
