import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addFeatureItem, deleteFeatureItem, getLandingFeatures, listAllFeatureItems, updateFeatureItem, upsertLandingFeaturesSection } from "@/lib/server/landing";

export const dynamic = "force-dynamic";

export async function GET() {
	const data = await getLandingFeatures();
	return NextResponse.json(data ?? { section: null, items: [] }, { status: 200 });
}

export async function PUT(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.email || !(session as any).user?.isAdmin) {
		return NextResponse.json({ message: "Admin access required" }, { status: 403 });
	}
	const body = await request.json();
	const updated = await upsertLandingFeaturesSection({ title: body.title, subtitle: body.subtitle, background_color: body.background_color });
	if (!updated) return NextResponse.json({ message: "Failed to save" }, { status: 500 });
	return NextResponse.json(updated);
}

export async function POST(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.email || !(session as any).user?.isAdmin) {
		return NextResponse.json({ message: "Admin access required" }, { status: 403 });
	}
	const body = await request.json();
	const created = await addFeatureItem({ title: body.title, description: body.description, icon: body.icon, order_index: body.order_index, is_active: body.is_active });
	if (!created) return NextResponse.json({ message: "Failed to create" }, { status: 500 });
	return NextResponse.json(created, { status: 201 });
}

export async function PATCH(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.email || !(session as any).user?.isAdmin) {
		return NextResponse.json({ message: "Admin access required" }, { status: 403 });
	}
	const body = await request.json();
	const updated = await updateFeatureItem(body.id, { title: body.title, description: body.description, icon: body.icon, order_index: body.order_index, is_active: body.is_active });
	if (!updated) return NextResponse.json({ message: "Failed to update" }, { status: 500 });
	return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.email || !(session as any).user?.isAdmin) {
		return NextResponse.json({ message: "Admin access required" }, { status: 403 });
	}
	const { searchParams } = new URL(request.url);
	const id = searchParams.get('id');
	if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 });
	const ok = await deleteFeatureItem(id);
	if (!ok) return NextResponse.json({ message: "Failed to delete" }, { status: 500 });
	return NextResponse.json({ success: true });
}


