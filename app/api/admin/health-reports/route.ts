import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!(session as any).user?.isAdmin) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const supabase = getSupabaseServerClient();

    // If userId is provided, get health reports for that specific user
    if (userId) {
      const { data: healthReports, error } = await supabase
        .from('health_reports')
        .select(`
          id,
          title,
          report_type,
          original_filename,
          ai_summary,
          key_findings,
          recommendations,
          risk_level,
          created_at,
          updated_at,
          image_data,
          image_filename,
          image_mime_type,
          analysis_type
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching health reports:', error);
        return NextResponse.json(
          { message: "Failed to fetch health reports" },
          { status: 500 }
        );
      }

      return NextResponse.json({ healthReports: healthReports || [] });
    }

    // Otherwise, get all users with their health reports count
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, plan')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { message: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Get health reports count for each user
    const usersWithReports = await Promise.all(
      (users || []).map(async (user) => {
        const { count } = await supabase
          .from('health_reports')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        return {
          id: user.id,
          email: user.email,
          plan: user.plan || 'Free',
          reportsCount: count || 0,
        };
      })
    );

    return NextResponse.json({ users: usersWithReports });
  } catch (error) {
    console.error("Error in admin health reports GET:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

