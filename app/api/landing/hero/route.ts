import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLandingHero, upsertLandingHero } from "@/lib/server/landing";

export const dynamic = "force-dynamic";

export async function GET() {
	console.log('🔍 [HERO_GET] Fetching hero data...');
	const hero = await getLandingHero();
	console.log('📋 [HERO_GET] Hero data:', hero);
	return NextResponse.json(hero ?? {}, { status: 200 });
}

export async function PUT(request: NextRequest) {
	console.log('🔄 [HERO_PUT] Starting hero update...');
	const session = await getServerSession(authOptions);
	if (!session?.user?.email || !(session as any).user?.isAdmin) {
		return NextResponse.json({ message: "Admin access required" }, { status: 403 });
	}
	const body = await request.json();
	console.log('📋 [HERO_PUT] Request body:', body);
	const updated = await upsertLandingHero({
		title: body.title,
		subtitle: body.subtitle,
		images: body.images,
	});
	console.log('📋 [HERO_PUT] Updated result:', updated);
	if (!updated) return NextResponse.json({ message: "Failed to save" }, { status: 500 });
	return NextResponse.json(updated);
}


