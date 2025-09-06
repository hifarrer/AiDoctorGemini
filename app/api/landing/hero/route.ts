import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLandingHero, upsertLandingHero } from "@/lib/server/landing";

export const dynamic = "force-dynamic";

export async function GET() {
	console.log('🔍 [HERO_GET] Fetching hero data...');
	const hero = await getLandingHero();
	console.log('📋 [HERO_GET] Hero data:', hero);
	console.log('📋 [HERO_GET] Hero background_color:', hero?.background_color);
	
	const response = NextResponse.json(hero ?? {}, { status: 200 });
	response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
	response.headers.set('Pragma', 'no-cache');
	response.headers.set('Expires', '0');
	return response;
}

export async function PUT(request: NextRequest) {
	console.log('🔄 [HERO_PUT] Starting hero update...');
	try {
		const session = await getServerSession(authOptions);
		console.log('📋 [HERO_PUT] Session:', { 
			hasSession: !!session, 
			userEmail: session?.user?.email, 
			isAdmin: (session as any)?.user?.isAdmin 
		});
		
		if (!session?.user?.email || !(session as any).user?.isAdmin) {
			console.log('❌ [HERO_PUT] Admin access denied');
			return NextResponse.json({ message: "Admin access required" }, { status: 403 });
		}
		
		const body = await request.json();
		console.log('📋 [HERO_PUT] Request body:', body);
		
		const updated = await upsertLandingHero({
			title: body.title,
			subtitle: body.subtitle,
			images: body.images,
			background_color: body.background_color,
		});
		
		console.log('📋 [HERO_PUT] Updated result:', updated);
		
		if (!updated) {
			console.log('❌ [HERO_PUT] Upsert returned null/undefined');
			return NextResponse.json({ message: "Failed to save" }, { status: 500 });
		}
		
		console.log('✅ [HERO_PUT] Successfully updated hero');
		return NextResponse.json(updated);
	} catch (error: unknown) {
		console.error('❌ [HERO_PUT] Error in PUT handler:', error);
		const message = error instanceof Error ? error.message : String(error);
		return NextResponse.json({ message: "Internal server error", error: message }, { status: 500 });
	}
}


