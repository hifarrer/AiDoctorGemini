import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getLandingHero, upsertLandingHero } from "@/lib/server/landing";

export const dynamic = "force-dynamic";

export async function GET() {
	const hero = await getLandingHero();
	return NextResponse.json(hero ?? {}, { status: 200 });
}

export async function PUT(request: NextRequest) {
	const session = await getServerSession();
	if (!session?.user?.email || session.user.email !== "admin@ai-doctor.info") {
		return NextResponse.json({ message: "Admin access required" }, { status: 403 });
	}
	const body = await request.json();
	const updated = await upsertLandingHero({
		title: body.title,
		subtitle: body.subtitle,
		images: body.images,
	});
	if (!updated) return NextResponse.json({ message: "Failed to save" }, { status: 500 });
	return NextResponse.json(updated);
}


