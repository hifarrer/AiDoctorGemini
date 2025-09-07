import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface LandingHero {
  id: number;
  title: string;
  subtitle: string | null;
  images: string[];
  background_color: string | null;
  title_accent1?: string | null;
  title_accent2?: string | null;
  updated_at: string | null;
}

export async function getLandingHero(): Promise<LandingHero | null> {
	console.log('🔍 [getLandingHero] Fetching hero data from database...');
	const supabase = getSupabaseServerClient();
	const { data, error } = await supabase
		.from("landing_hero")
		.select("id, title, subtitle, images, background_color, title_accent1, title_accent2, updated_at")
		.eq("id", 1)
		.single();
	if (error) {
		console.error("❌ [getLandingHero] Error:", error);
		return null;
	}
	console.log('📋 [getLandingHero] Database result:', data);
	console.log('📋 [getLandingHero] Background color from DB:', data?.background_color);
	return data as LandingHero;
}

export async function upsertLandingHero(input: Partial<LandingHero>): Promise<LandingHero | null> {
	console.log('🔄 [upsertLandingHero] Starting upsert with input:', input);
	const supabase = getSupabaseServerClient();
	// Load current to safely merge undefined fields
	const { data: current } = await supabase
		.from("landing_hero")
		.select("id, title, subtitle, images, background_color, title_accent1, title_accent2, updated_at")
		.eq("id", 1)
		.single();

	console.log('📋 [upsertLandingHero] Current data:', current);

	const payload: any = {
		id: 1,
		title: input.title ?? current?.title ?? "",
		subtitle: input.subtitle ?? (current ? current.subtitle : null) ?? null,
		images: Array.isArray(input.images) ? input.images : (current?.images ?? []),
		background_color: input.background_color ?? current?.background_color ?? "gradient-blue",
		title_accent1: input.title_accent1 ?? (current as any)?.title_accent1 ?? "#a855f7",
		title_accent2: input.title_accent2 ?? (current as any)?.title_accent2 ?? "#14b8a6",
		updated_at: new Date().toISOString() as any,
	};
	
	console.log('📋 [upsertLandingHero] Payload with background_color:', payload);

	console.log('📋 [upsertLandingHero] Payload to upsert:', payload);

	const { data, error } = await supabase
		.from("landing_hero")
		.upsert(payload, { onConflict: "id" })
		.select("id, title, subtitle, images, background_color, title_accent1, title_accent2, updated_at")
		.single();
	if (error) {
		console.error("❌ [upsertLandingHero] Error:", error);
		return null;
	}
	console.log('✅ [upsertLandingHero] Successfully upserted:', data);
	return data as LandingHero;
}

export interface LandingChatbot {
	id: number;
	title: string;
	subtitle: string | null;
	updated_at: string | null;
}

export async function getLandingChatbot(): Promise<LandingChatbot | null> {
	const supabase = getSupabaseServerClient();
	const { data, error } = await supabase
		.from("landing_chatbot")
		.select("id, title, subtitle, updated_at")
		.eq("id", 1)
		.single();
	if (error) {
		console.error("getLandingChatbot error:", error);
		return null;
	}
	return data as LandingChatbot;
}

export async function upsertLandingChatbot(input: Partial<LandingChatbot>): Promise<LandingChatbot | null> {
	const supabase = getSupabaseServerClient();
	const { data: current } = await supabase
		.from("landing_chatbot")
		.select("id, title, subtitle, updated_at")
		.eq("id", 1)
		.single();

	const payload: Partial<LandingChatbot> & { id: number } = {
		id: 1,
		title: input.title ?? current?.title ?? "",
		subtitle: input.subtitle ?? (current ? current.subtitle : null) ?? null,
		updated_at: new Date().toISOString() as any,
	};

	const { data, error } = await supabase
		.from("landing_chatbot")
		.upsert(payload as any, { onConflict: "id" })
		.select("id, title, subtitle, updated_at")
		.single();
	if (error) {
		console.error("upsertLandingChatbot error:", error);
		return null;
	}
	return data as LandingChatbot;
}

export interface LandingFeaturesSection {
  id: number;
  title: string;
  subtitle: string | null;
  background_color?: string | null;
  title_accent1?: string | null;
  title_accent2?: string | null;
  updated_at: string | null;
}

export interface LandingFeatureItem {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  order_index: number;
  is_active: boolean;
  updated_at: string | null;
}

export async function getLandingFeatures(): Promise<{ section: LandingFeaturesSection | null; items: LandingFeatureItem[]; }> {
  const supabase = getSupabaseServerClient();
  const [{ data: section }, { data: items }] = await Promise.all([
    supabase.from('landing_features_section').select('id, title, subtitle, background_color, title_accent1, title_accent2, updated_at').eq('id', 1).single(),
    supabase.from('landing_features_items').select('id, title, description, icon, order_index, is_active, updated_at').eq('is_active', true).order('order_index', { ascending: true }),
  ]);
  return { section: (section as any) || null, items: (items as any) || [] };
}

export async function upsertLandingFeaturesSection(input: Partial<LandingFeaturesSection>): Promise<LandingFeaturesSection | null> {
  const supabase = getSupabaseServerClient();
  const { data: current } = await supabase.from('landing_features_section').select('id, title, subtitle, background_color, title_accent1, title_accent2, updated_at').eq('id', 1).single();
  const payload = {
    id: 1,
    title: input.title ?? current?.title ?? "",
    subtitle: input.subtitle ?? (current ? current.subtitle : null) ?? null,
    background_color: input.background_color ?? (current ? (current as any).background_color : null) ?? 'solid-blue',
    title_accent1: input.title_accent1 ?? (current ? (current as any).title_accent1 : null) ?? '#a855f7',
    title_accent2: input.title_accent2 ?? (current ? (current as any).title_accent2 : null) ?? '#14b8a6',
    updated_at: new Date().toISOString() as any,
  };
  const { data, error } = await supabase
    .from('landing_features_section')
    .upsert(payload as any, { onConflict: 'id' })
    .select('id, title, subtitle, background_color, title_accent1, title_accent2, updated_at')
    .single();
  if (error) {
    console.error('upsertLandingFeaturesSection error:', error);
    return null;
  }
  return data as LandingFeaturesSection;
}

export async function listAllFeatureItems(): Promise<LandingFeatureItem[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('landing_features_items')
    .select('id, title, description, icon, order_index, is_active, updated_at')
    .order('order_index', { ascending: true });
  if (error) {
    console.error('listAllFeatureItems error:', error);
    return [];
  }
  return (data as any) || [];
}

export async function addFeatureItem(input: { title: string; description?: string; icon?: string; order_index?: number; is_active?: boolean; }): Promise<LandingFeatureItem | null> {
  const supabase = getSupabaseServerClient();
  let orderIndex = input.order_index;
  if (orderIndex === undefined || orderIndex === null) {
    const { data: maxData } = await supabase.from('landing_features_items').select('order_index').order('order_index', { ascending: false }).limit(1);
    orderIndex = (maxData && (maxData as any)[0]?.order_index ? (maxData as any)[0].order_index : 0) + 1;
  }
  const { data, error } = await supabase
    .from('landing_features_items')
    .insert({ title: input.title, description: input.description ?? null, icon: input.icon ?? null, order_index: orderIndex, is_active: input.is_active ?? true })
    .select('id, title, description, icon, order_index, is_active, updated_at')
    .single();
  if (error) {
    console.error('addFeatureItem error:', error);
    return null;
  }
  return data as LandingFeatureItem;
}

export async function updateFeatureItem(id: string, updates: Partial<Pick<LandingFeatureItem, 'title' | 'description' | 'icon' | 'order_index' | 'is_active'>>): Promise<LandingFeatureItem | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('landing_features_items')
    .update({
      ...(updates.title !== undefined ? { title: updates.title } : {}),
      ...(updates.description !== undefined ? { description: updates.description } : {}),
      ...(updates.icon !== undefined ? { icon: updates.icon } : {}),
      ...(updates.order_index !== undefined ? { order_index: updates.order_index } : {}),
      ...(updates.is_active !== undefined ? { is_active: updates.is_active } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, title, description, icon, order_index, is_active, updated_at')
    .single();
  if (error) {
    console.error('updateFeatureItem error:', error);
    return null;
  }
  return data as LandingFeatureItem;
}

export async function deleteFeatureItem(id: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('landing_features_items').delete().eq('id', id);
  if (error) {
    console.error('deleteFeatureItem error:', error);
    return false;
  }
  return true;
}

