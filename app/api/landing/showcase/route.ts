import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log('🔍 [SHOWCASE_GET] Fetching showcase images...');
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('landing_showcase')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ [SHOWCASE_GET] Error fetching showcase images:', error);
      return new NextResponse(JSON.stringify({ error: 'Failed to fetch showcase images' }), { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }

    console.log('📋 [SHOWCASE_GET] Database result:', data);
    console.log('📋 [SHOWCASE_GET] Data type:', typeof data);
    console.log('📋 [SHOWCASE_GET] Data keys:', data ? Object.keys(data) : 'null');
    const result = data || {};
    console.log('✅ [SHOWCASE_GET] Final result:', result);
    console.log('✅ [SHOWCASE_GET] Result keys:', Object.keys(result));
    return new NextResponse(JSON.stringify(result), { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('❌ [SHOWCASE_GET] Unexpected error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 [SHOWCASE_PUT] Starting showcase update...');

    const session = await getServerSession(authOptions as any);
    console.log('👤 [SHOWCASE_PUT] Session:', { 
      hasSession: !!session, 
      userEmail: (session as any)?.user?.email,
      isAdmin: (session as any)?.user?.isAdmin 
    });

    if (!session || !(session as any)?.user?.email || !(session as any)?.user?.isAdmin) {
      console.log('❌ [SHOWCASE_PUT] Admin access denied');
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    console.log('📋 [SHOWCASE_PUT] Raw body:', body);
    const { image1, image2, image3, id } = body;
    console.log('📋 [SHOWCASE_PUT] Extracted data:', { image1, image2, image3, id });

    const supabase = getSupabaseServerClient();

    // Check if record exists
    console.log('🔍 [SHOWCASE_PUT] Checking for existing record...');
    const { data: existing, error: checkError } = await supabase
      .from('landing_showcase')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ [SHOWCASE_PUT] Error checking existing record:', checkError);
      return NextResponse.json({ error: 'Failed to check existing record' }, { status: 500 });
    }

    console.log('📋 [SHOWCASE_PUT] Existing record:', existing);

    if (existing) {
      // Update existing record
      console.log('🔄 [SHOWCASE_PUT] Updating existing record with ID:', existing.id);
      console.log('🔄 [SHOWCASE_PUT] Update data:', { 
        image1: image1 || null,
        image2: image2 || null,
        image3: image3 || null,
        updated_at: new Date().toISOString()
      });
      
      const { data: updateResult, error } = await supabase
        .from('landing_showcase')
        .update({ 
          image1: image1 || null,
          image2: image2 || null,
          image3: image3 || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select();

      if (error) {
        console.error('❌ [SHOWCASE_PUT] Error updating showcase images:', error);
        return NextResponse.json({ error: 'Failed to update showcase images' }, { status: 500 });
      }
      console.log('✅ [SHOWCASE_PUT] Record updated successfully:', updateResult);
      return NextResponse.json(updateResult?.[0] ?? { success: true });
    } else {
      // Create new record
      console.log('🆕 [SHOWCASE_PUT] Creating new record...');
      const { data: insertResult, error } = await supabase
        .from('landing_showcase')
        .insert({ 
          image1: image1 || null,
          image2: image2 || null,
          image3: image3 || null
        })
        .select();

      if (error) {
        console.error('❌ [SHOWCASE_PUT] Error creating showcase images:', error);
        return NextResponse.json({ error: 'Failed to create showcase images' }, { status: 500 });
      }
      console.log('✅ [SHOWCASE_PUT] Record created successfully');
      return NextResponse.json(insertResult?.[0] ?? { success: true });
    }
  } catch (error) {
    console.error('❌ [SHOWCASE_PUT] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
