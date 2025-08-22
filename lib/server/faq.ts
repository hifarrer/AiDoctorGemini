import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface FaqItem {
	id: string;
	question: string;
	answer: string;
	order_index: number;
	is_active: boolean;
	updated_at: string | null;
}

export async function getPublicFaqs(): Promise<FaqItem[]> {
	console.log("🔍 [GET_PUBLIC_FAQS] Starting FAQ fetch from Supabase...");
	const supabase = getSupabaseServerClient();
	const { data, error } = await supabase
		.from("faqs")
		.select("id, question, answer, order_index, is_active, updated_at")
		.eq("is_active", true)
		.order("order_index", { ascending: true });
	if (error) {
		console.error("❌ [GET_PUBLIC_FAQS] Error fetching active FAQs:", error);
		return [];
	}
	console.log("📋 [GET_PUBLIC_FAQS] Active FAQs found:", data?.length || 0);
	if (data && data.length > 0) {
		console.log("✅ [GET_PUBLIC_FAQS] Returning active FAQs");
		return data;
	}
	// Fallback: if no active FAQs, return all (ordered)
	console.log("⚠️ [GET_PUBLIC_FAQS] No active FAQs found, fetching all FAQs as fallback...");
	const { data: allData, error: allErr } = await supabase
		.from("faqs")
		.select("id, question, answer, order_index, is_active, updated_at")
		.order("order_index", { ascending: true });
	if (allErr) {
		console.error("❌ [GET_PUBLIC_FAQS] Fallback error:", allErr);
		return [];
	}
	console.log("📋 [GET_PUBLIC_FAQS] All FAQs found:", allData?.length || 0);
	return allData || [];
}

export async function getAllFaqs(): Promise<FaqItem[]> {
	const supabase = getSupabaseServerClient();
	const { data, error } = await supabase
		.from("faqs")
		.select("id, question, answer, order_index, is_active, updated_at")
		.order("order_index", { ascending: true });
	if (error) {
		console.error("getAllFaqs error:", error);
		return [];
	}
	return data || [];
}

export async function addFaq(input: { question: string; answer: string; is_active?: boolean; order_index?: number; }): Promise<FaqItem | null> {
	const supabase = getSupabaseServerClient();
	// Determine next order index if not provided
	let orderIndex = input.order_index;
	if (orderIndex === undefined || orderIndex === null) {
		const { data: maxData } = await supabase
			.from("faqs")
			.select("order_index")
			.order("order_index", { ascending: false })
			.limit(1);
		orderIndex = (maxData && maxData[0]?.order_index ? maxData[0].order_index : 0) + 1;
	}
	const { data, error } = await supabase
		.from("faqs")
		.insert({
			question: input.question,
			answer: input.answer,
			is_active: input.is_active ?? true,
			order_index: orderIndex,
		})
		.select("id, question, answer, order_index, is_active, updated_at")
		.single();
	if (error) {
		console.error("addFaq error:", error);
		return null;
	}
	return data as FaqItem;
}

export async function updateFaq(id: string, updates: Partial<Pick<FaqItem, "question" | "answer" | "order_index" | "is_active">>): Promise<FaqItem | null> {
	const supabase = getSupabaseServerClient();
	const { data, error } = await supabase
		.from("faqs")
		.update({
			...(updates.question !== undefined ? { question: updates.question } : {}),
			...(updates.answer !== undefined ? { answer: updates.answer } : {}),
			...(updates.order_index !== undefined ? { order_index: updates.order_index } : {}),
			...(updates.is_active !== undefined ? { is_active: updates.is_active } : {}),
			updated_at: new Date().toISOString(),
		})
		.eq("id", id)
		.select("id, question, answer, order_index, is_active, updated_at")
		.single();
	if (error) {
		console.error("updateFaq error:", error);
		return null;
	}
	return data as FaqItem;
}

export async function deleteFaq(id: string): Promise<boolean> {
	const supabase = getSupabaseServerClient();
	const { error } = await supabase.from("faqs").delete().eq("id", id);
	if (error) {
		console.error("deleteFaq error:", error);
		return false;
	}
	return true;
}


