import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
	try {
		const session = await getServerSession(authOptions as any);
		if (!session || !(session as any)?.user?.email || !(session as any)?.user?.isAdmin) {
			return NextResponse.json({ message: "Admin access required" }, { status: 403 });
		}

		const form = await request.formData();
		const file = form.get("file") as unknown as File | null;
		const filename = (form.get("filename") as string | null) || (file && (file as any).name) || "upload.bin";
		if (!file) {
			return NextResponse.json({ message: "No file provided" }, { status: 400 });
		}

		const ext = filename.includes(".") ? filename.split(".").pop() : "bin";
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const supabase = getSupabaseServerClient();
		const bucket = process.env.SUPABASE_STORAGE_BUCKET || "landing";
		const folder = (form.get("folder") as string) || "showcase";
		const objectPath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

		const { error: uploadError } = await supabase.storage
			.from(bucket)
			.upload(objectPath, buffer, { contentType: (file as any).type || "application/octet-stream", upsert: false });

		if (uploadError) {
			console.error("Upload error:", uploadError);
			return NextResponse.json({ message: "Upload failed", error: uploadError.message }, { status: 500 });
		}

		const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
		return NextResponse.json({ url: publicUrlData.publicUrl }, { status: 200 });
	} catch (e) {
		console.error("Upload handler error:", e);
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}


