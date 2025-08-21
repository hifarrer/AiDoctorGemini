import { NextResponse } from "next/server";
import { getPublicFaqs } from "@/lib/server/faq";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const faqs = await getPublicFaqs();
		return NextResponse.json(faqs, { status: 200 });
	} catch (error) {
		console.error("FAQ GET error:", error);
		return NextResponse.json([], { status: 200 });
	}
}


