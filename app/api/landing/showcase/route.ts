import { NextRequest, NextResponse } from "next/server";
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
    const body = await request.json();
    const { image1, image2, image3 } = body;

    const supabase = getSupabaseServerClient();

    // Check if record exists
    const { data: existing } = await supabase
      .from('landing_showcase')
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      // Update existing record
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
        console.error('Error updating showcase images:', error);
        return NextResponse.json({ error: 'Failed to update showcase images' }, { status: 500 });
      }
    } else {
      // Create new record
      const { error } = await supabase
        .from('landing_showcase')
        .insert({ 
          image1: image1 || null,
          image2: image2 || null,
          image3: image3 || null
        });

      if (error) {
        console.error('Error creating showcase images:', error);
        return NextResponse.json({ error: 'Failed to create showcase images' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in showcase PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
