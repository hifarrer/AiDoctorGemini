import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLandingChatbot, upsertLandingChatbot } from "@/lib/server/landing";

export const dynamic = "force-dynamic";

export async function GET() {
	const data = await getLandingChatbot();
	return NextResponse.json(data ?? {}, { status: 200 });
}

export async function PUT(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.email || !(session as any).user?.isAdmin) {
		return NextResponse.json({ message: "Admin access required" }, { status: 403 });
	}
	const body = await request.json();
	const updated = await upsertLandingChatbot({
		title: body.title,
		subtitle: body.subtitle,
	});
	if (!updated) return NextResponse.json({ message: "Failed to save" }, { status: 500 });
	return NextResponse.json(updated);
}


