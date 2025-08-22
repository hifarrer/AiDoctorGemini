import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addFaq, deleteFaq, getAllFaqs, updateFaq } from "@/lib/server/faq";

export const dynamic = "force-dynamic";

export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.email || !(session as any).user?.isAdmin) {
		return NextResponse.json({ message: "Admin access required" }, { status: 403 });
	}
	const faqs = await getAllFaqs();
	return NextResponse.json(faqs);
}

export async function POST(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.email || !(session as any).user?.isAdmin) {
		return NextResponse.json({ message: "Admin access required" }, { status: 403 });
	}
	const body = await request.json();
	const created = await addFaq({
		question: body.question,
		answer: body.answer,
		is_active: body.is_active,
		order_index: body.order_index,
	});
	if (!created) return NextResponse.json({ message: "Failed to create" }, { status: 500 });
	return NextResponse.json(created, { status: 201 });
}

export async function PUT(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.email || !(session as any).user?.isAdmin) {
		return NextResponse.json({ message: "Admin access required" }, { status: 403 });
	}
	const body = await request.json();
	const updated = await updateFaq(body.id, {
		question: body.question,
		answer: body.answer,
		order_index: body.order_index,
		is_active: body.is_active,
	});
	if (!updated) return NextResponse.json({ message: "Failed to update" }, { status: 500 });
	return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.email || !(session as any).user?.isAdmin) {
		return NextResponse.json({ message: "Admin access required" }, { status: 403 });
	}
	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");
	if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });
	const ok = await deleteFaq(id);
	if (!ok) return NextResponse.json({ message: "Failed to delete" }, { status: 500 });
	return NextResponse.json({ success: true });
}


