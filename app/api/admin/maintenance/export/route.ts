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

    // Define known tables in the application
    const knownTables = [
      'users',
      'plans', 
      'faqs',
      'landing_hero',
      'landing_features',
      'settings',
      'accounts',
      'sessions',
      'verification_tokens',
      'user_interactions'
    ];

    let sqlContent = `-- Database Export
-- Generated on: ${new Date().toISOString()}
-- Database: HealthConsultant

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

    // Export each known table
    for (const tableName of knownTables) {
      try {
        // Get table data
        const { data: tableData, error: dataError } = await supabase
          .from(tableName)
          .select('*');

        if (dataError) {
          console.error(`Error fetching data for ${tableName}:`, dataError);
          continue;
        }

        // Create basic table structure (we'll use a simplified approach)
        sqlContent += `\n-- Table structure for table '${tableName}'
DROP TABLE IF EXISTS "${tableName}" CASCADE;

-- Note: Table structure is simplified. You may need to adjust column types and constraints.
CREATE TABLE "${tableName}" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

`;

        // Insert data if exists
        if (tableData && tableData.length > 0) {
          sqlContent += `\n-- Data for table '${tableName}'\n`;
          
          // Get column names from the first row
          const firstRow = tableData[0];
          const columnNames = Object.keys(firstRow).map(col => `"${col}"`);
          
          // Insert data in batches to avoid memory issues
          const batchSize = 100;
          for (let i = 0; i < tableData.length; i += batchSize) {
            const batch = tableData.slice(i, i + batchSize);
            
            sqlContent += `INSERT INTO "${tableName}" (${columnNames.join(', ')}) VALUES\n`;
            
            const values = batch.map(row => {
              const rowValues = columnNames.map(colName => {
                const value = row[colName.replace(/"/g, '')];
                if (value === null) return 'NULL';
                if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
                if (typeof value === 'boolean') return value ? 'true' : 'false';
                if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
                return value;
              });
              return `  (${rowValues.join(', ')})`;
            });
            
            sqlContent += values.join(',\n') + ';\n\n';
          }
        }
      } catch (error) {
        console.error(`Error processing table ${tableName}:`, error);
        continue;
      }
    }

    // Re-enable triggers
    sqlContent += `\n-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- End of export
`;

    // Return the SQL file
    return new NextResponse(sqlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="database-export-${new Date().toISOString().split('T')[0]}.sql"`,
      },
    });

  } catch (error) {
    console.error('Database export error:', error);
    return NextResponse.json(
      { message: "Internal server error during export" },
      { status: 500 }
    );
  }
}
