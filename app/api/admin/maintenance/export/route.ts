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

    // Helper to infer column type from data sample
    const inferType = (values: any[]): string => {
      const nonNull = values.filter(v => v !== null && typeof v !== 'undefined');
      if (nonNull.length === 0) return 'TEXT';
      const isBoolean = nonNull.every(v => typeof v === 'boolean');
      if (isBoolean) return 'BOOLEAN';
      const isNumber = nonNull.every(v => typeof v === 'number');
      if (isNumber) return 'NUMERIC';
      const isObject = nonNull.some(v => typeof v === 'object');
      if (isObject) return 'JSONB';
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const isUUID = nonNull.every(v => typeof v === 'string' && uuidRegex.test(v));
      if (isUUID) return 'UUID';
      const isTimestamp = nonNull.every(v => typeof v === 'string' && !isNaN(Date.parse(v as string)));
      if (isTimestamp) return 'TIMESTAMP WITH TIME ZONE';
      return 'TEXT';
    };

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

        // Create table structure inferred from data when available
        sqlContent += `\n-- Table structure for table '${tableName}'
DROP TABLE IF EXISTS "${tableName}" CASCADE;

`;
        if (tableData && tableData.length > 0) {
          const sample = tableData.slice(0, Math.min(200, tableData.length));
          const columns = Object.keys(sample[0]);
          const columnDefs = columns.map(col => {
            const colValues = sample.map(r => r[col]);
            const t = inferType(colValues);
            if (col === 'id' && t === 'UUID') {
              return `  "${col}" ${t} PRIMARY KEY DEFAULT gen_random_uuid()`;
            }
            return `  "${col}" ${t}`;
          });
          sqlContent += `CREATE TABLE "${tableName}" (\n${columnDefs.join(',\n')}\n);\n\n`;
        } else {
          // Fallback minimal structure if table is empty
          sqlContent += `-- Note: No sample data available; using minimal structure\nCREATE TABLE "${tableName}" (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  created_at TIMESTAMP WITH TIME ZONE,\n  updated_at TIMESTAMP WITH TIME ZONE\n);\n\n`;
        }

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
