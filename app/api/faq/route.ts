import { NextResponse } from "next/server";
import { getPublicFaqs } from "@/lib/server/faq";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		console.log("🔍 [FAQ_GET] Fetching public FAQs from Supabase...");
		const faqs = await getPublicFaqs();
		console.log("📋 [FAQ_GET] Retrieved FAQs:", faqs.length, "items");
		console.log("📝 [FAQ_GET] FAQ details:", faqs.map(f => ({ id: f.id, question: f.question.substring(0, 50) + "..." })));
		return NextResponse.json(faqs, { status: 200 });
	} catch (error) {
		console.error("❌ [FAQ_GET] FAQ GET error:", error);
		return NextResponse.json([], { status: 200 });
	}
}


