import { supabase } from '../supabase';

// Type for query results
type QueryResult = Record<string, any>;

/**
 * Execute a SELECT query using Supabase
 * This is a compatibility layer that mimics the MySQL query API
 * For complex queries, it uses Supabase's raw SQL via pg extension
 */
export async function query<T = QueryResult>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  try {
    // Parse the SQL to extract table name and build Supabase query
    const sqlLower = sql.toLowerCase().trim();
    
    // For simple SELECT queries, we can parse and use the query builder
    // For complex queries with JOINs, subqueries, etc., we need raw SQL
    
    // Convert MySQL placeholders to values inline (Supabase doesn't support parameterized raw SQL easily)
    let processedSql = sql;
    if (params && params.length > 0) {
      let paramIndex = 0;
      processedSql = sql.replace(/\?/g, () => {
        const value = params[paramIndex++];
        if (value === null) return 'NULL';
        if (typeof value === 'number') return String(value);
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
        // Escape single quotes in strings
        return `'${String(value).replace(/'/g, "''")}'`;
      });
    }
    
    // Replace MySQL backticks with double quotes for PostgreSQL
    processedSql = processedSql.replace(/`/g, '"');
    
    // Replace NOW() with CURRENT_TIMESTAMP
    processedSql = processedSql.replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');
    
    // Use Supabase's raw query via the REST API
    // Note: This uses the underlying Postgres connection
    const { data, error } = await supabase.rpc('raw_sql', { 
      query_text: processedSql 
    });
    
    if (error) {
      // If raw_sql doesn't exist, throw a more helpful error
      if (error.code === 'PGRST202' || error.message.includes('function') || error.message.includes('does not exist')) {
        throw new Error(
          'raw_sql function not found. Please add it to your Supabase database. ' +
          'See supabase_functions.sql for the function definition.'
        );
      }
      throw error;
    }
    
    return (data as T[]) || [];
  } catch (error: any) {
    console.error('Query error:', error);
    throw new Error(`Database query failed: ${error.message}`);
  }
}

/**
 * Execute an INSERT, UPDATE, or DELETE query
 */
export async function execute(
  sql: string,
  params?: any[]
): Promise<{ insertId?: number; affectedRows?: number }> {
  try {
    // Convert MySQL placeholders to values inline
    let processedSql = sql;
    if (params && params.length > 0) {
      let paramIndex = 0;
      processedSql = sql.replace(/\?/g, () => {
        const value = params[paramIndex++];
        if (value === null) return 'NULL';
        if (typeof value === 'number') return String(value);
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
        if (value instanceof Buffer) {
          // Convert buffer to hex for BYTEA
          return `'\\x${value.toString('hex')}'`;
        }
        return `'${String(value).replace(/'/g, "''")}'`;
      });
    }
    
    // Replace MySQL backticks with double quotes
    processedSql = processedSql.replace(/`/g, '"');
    
    // Replace NOW() with CURRENT_TIMESTAMP
    processedSql = processedSql.replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');
    
    // Add RETURNING clause for INSERT to get the ID
    const isInsert = processedSql.trim().toUpperCase().startsWith('INSERT');
    if (isInsert && !processedSql.toUpperCase().includes('RETURNING')) {
      processedSql = processedSql.replace(/;?\s*$/, ' RETURNING *');
    }
    
    const { data, error } = await supabase.rpc('raw_sql', { 
      query_text: processedSql 
    });
    
    if (error) {
      if (error.code === 'PGRST202' || error.message.includes('function') || error.message.includes('does not exist')) {
        throw new Error(
          'raw_sql function not found. Please add it to your Supabase database. ' +
          'See supabase_functions.sql for the function definition.'
        );
      }
      throw error;
    }
    
    const result: { insertId?: number; affectedRows?: number } = {};
    
    if (isInsert && data && Array.isArray(data) && data.length > 0) {
      const firstRow = data[0];
      const idKey = Object.keys(firstRow).find(key => key.endsWith('_id'));
      if (idKey) {
        result.insertId = firstRow[idKey];
      }
    }
    
    result.affectedRows = Array.isArray(data) ? data.length : 0;
    return result;
  } catch (error: any) {
    console.error('Execute error:', error);
    throw new Error(`Database execute failed: ${error.message}`);
  }
}

/**
 * Execute a query and return the first row or null
 */
export async function queryOne<T = QueryResult>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Check if a record exists using Supabase query builder
 */
export async function exists(
  table: string,
  column: string,
  value: any
): Promise<boolean> {
  const { data, error } = await supabase
    .from(table)
    .select('1', { count: 'exact', head: true })
    .eq(column, value);
  
  if (error) {
    console.error('Exists check error:', error);
    throw new Error(`Exists check failed: ${error.message}`);
  }
  
  return (data?.length ?? 0) > 0;
}
