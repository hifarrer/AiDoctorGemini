import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('landing_showcase')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching showcase images:', error);
      return NextResponse.json({ error: 'Failed to fetch showcase images' }, { status: 500 });
    }

    return NextResponse.json(data || {});
  } catch (error) {
    console.error('Error in showcase GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const { image1, image2, image3 } = body;
    console.log('📋 [SHOWCASE_PUT] Received data:', { image1, image2, image3 });

    const supabase = getSupabaseServerClient();

    // Check if record exists
    console.log('🔍 [SHOWCASE_PUT] Checking for existing record...');
    const { data: existing, error: checkError } = await supabase
      .from('landing_showcase')
      .select('id')
      .limit(1)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ [SHOWCASE_PUT] Error checking existing record:', checkError);
      return NextResponse.json({ error: 'Failed to check existing record' }, { status: 500 });
    }

    console.log('📋 [SHOWCASE_PUT] Existing record:', existing);

    if (existing) {
      // Update existing record
      console.log('🔄 [SHOWCASE_PUT] Updating existing record...');
      const { error } = await supabase
        .from('landing_showcase')
        .update({ 
          image1: image1 || null,
          image2: image2 || null,
          image3: image3 || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        console.error('❌ [SHOWCASE_PUT] Error updating showcase images:', error);
        return NextResponse.json({ error: 'Failed to update showcase images' }, { status: 500 });
      }
      console.log('✅ [SHOWCASE_PUT] Record updated successfully');
    } else {
      // Create new record
      console.log('🆕 [SHOWCASE_PUT] Creating new record...');
      const { error } = await supabase
        .from('landing_showcase')
        .insert({ 
          image1: image1 || null,
          image2: image2 || null,
          image3: image3 || null
        });

      if (error) {
        console.error('❌ [SHOWCASE_PUT] Error creating showcase images:', error);
        return NextResponse.json({ error: 'Failed to create showcase images' }, { status: 500 });
      }
      console.log('✅ [SHOWCASE_PUT] Record created successfully');
    }

    console.log('✅ [SHOWCASE_PUT] Operation completed successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [SHOWCASE_PUT] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
