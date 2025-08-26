import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!(session as any).user?.isAdmin) {
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Define known tables in the application with their structure
    const tableStructures = {
      'users': {
        columns: [
          'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
          'email TEXT UNIQUE NOT NULL',
          'name TEXT',
          'isAdmin BOOLEAN DEFAULT false',
          'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
          'updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        ]
      },
      'plans': {
        columns: [
          'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
          'title TEXT NOT NULL',
          'description TEXT',
          'features JSONB',
          'monthlyPrice DECIMAL(10,2)',
          'yearlyPrice DECIMAL(10,2)',
          'isActive BOOLEAN DEFAULT true',
          'isPopular BOOLEAN DEFAULT false',
          'interactionsLimit INTEGER',
          'stripePriceIds JSONB',
          'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
          'updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        ]
      },
      'faqs': {
        columns: [
          'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
          'question TEXT NOT NULL',
          'answer TEXT NOT NULL',
          'order_index INTEGER DEFAULT 0',
          'isActive BOOLEAN DEFAULT true',
          'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
          'updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        ]
      },
      'landing_hero': {
        columns: [
          'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
          'title TEXT NOT NULL',
          'subtitle TEXT',
          'cta_text TEXT',
          'cta_link TEXT',
          'image_url TEXT',
          'isActive BOOLEAN DEFAULT true',
          'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
          'updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        ]
      },
      'landing_features': {
        columns: [
          'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
          'title TEXT NOT NULL',
          'description TEXT',
          'icon TEXT',
          'order_index INTEGER DEFAULT 0',
          'isActive BOOLEAN DEFAULT true',
          'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
          'updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        ]
      },
      'settings': {
        columns: [
          'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
          'site_name TEXT NOT NULL',
          'logo_url TEXT',
          'theme JSONB',
          'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
          'updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        ]
      },
      'accounts': {
        columns: [
          'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
          'user_id UUID REFERENCES users(id) ON DELETE CASCADE',
          'type TEXT NOT NULL',
          'provider TEXT NOT NULL',
          'provider_account_id TEXT NOT NULL',
          'refresh_token TEXT',
          'access_token TEXT',
          'expires_at BIGINT',
          'token_type TEXT',
          'scope TEXT',
          'id_token TEXT',
          'session_state TEXT',
          'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
          'updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        ]
      },
      'sessions': {
        columns: [
          'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
          'session_token TEXT UNIQUE NOT NULL',
          'user_id UUID REFERENCES users(id) ON DELETE CASCADE',
          'expires TIMESTAMP WITH TIME ZONE NOT NULL',
          'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
          'updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        ]
      },
      'verification_tokens': {
        columns: [
          'identifier TEXT NOT NULL',
          'token TEXT UNIQUE NOT NULL',
          'expires TIMESTAMP WITH TIME ZONE NOT NULL',
          'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        ]
      },
      'user_interactions': {
        columns: [
          'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
          'user_id UUID REFERENCES users(id) ON DELETE CASCADE',
          'plan_id UUID REFERENCES plans(id) ON DELETE CASCADE',
          'interaction_type TEXT NOT NULL',
          'month TEXT NOT NULL',
          'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        ]
      }
    };

    let sqlContent = `-- Database Structure Export
-- Generated on: ${new Date().toISOString()}
-- Database: HealthConsultant
-- Export Type: Structure Only (No Data)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- Disable triggers during import
SET session_replication_role = replica;

`;

    // Export each table structure
    for (const [tableName, structure] of Object.entries(tableStructures)) {
      sqlContent += `\n-- Table structure for table '${tableName}'
DROP TABLE IF EXISTS "${tableName}" CASCADE;

CREATE TABLE "${tableName}" (
  ${structure.columns.join(',\n  ')}
);

`;

      // Add indexes for common patterns
      if (tableName === 'users') {
        sqlContent += `-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_admin ON users(is_admin);

`;
      } else if (tableName === 'plans') {
        sqlContent += `-- Indexes for plans table
CREATE INDEX idx_plans_is_active ON plans(is_active);
CREATE INDEX idx_plans_is_popular ON plans(is_popular);

`;
      } else if (tableName === 'faqs') {
        sqlContent += `-- Indexes for faqs table
CREATE INDEX idx_faqs_order_index ON faqs(order_index);
CREATE INDEX idx_faqs_is_active ON faqs(is_active);

`;
      } else if (tableName === 'accounts') {
        sqlContent += `-- Indexes for accounts table
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_provider ON accounts(provider);

`;
             } else if (tableName === 'sessions') {
         sqlContent += `-- Indexes for sessions table
 CREATE INDEX idx_sessions_user_id ON sessions(user_id);
 CREATE INDEX idx_sessions_expires ON sessions(expires);

 `;
       } else if (tableName === 'user_interactions') {
         sqlContent += `-- Indexes for user_interactions table
 CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
 CREATE INDEX idx_user_interactions_plan_id ON user_interactions(plan_id);
 CREATE INDEX idx_user_interactions_month ON user_interactions(month);
 CREATE INDEX idx_user_interactions_user_plan_month ON user_interactions(user_id, plan_id, month);

 `;
       }
    }

    // Re-enable triggers
    sqlContent += `\n-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- End of structure export
`;

    // Return the SQL file
    return new NextResponse(sqlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="database-structure-${new Date().toISOString().split('T')[0]}.sql"`,
      },
    });

  } catch (error) {
    console.error('Database structure export error:', error);
    return NextResponse.json(
      { message: "Internal server error during structure export" },
      { status: 500 }
    );
  }
}
