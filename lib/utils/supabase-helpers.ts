import { supabase } from '../supabase';

/**
 * Execute a raw SQL query and return the results
 * This is used for complex queries that can't be done with the Supabase query builder
 */
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  // Replace MySQL placeholders (?) with PostgreSQL placeholders ($1, $2, etc.)
  let pgSql = sql;
  let paramIndex = 0;
  pgSql = pgSql.replace(/\?/g, () => `$${++paramIndex}`);
  
  // Replace MySQL backticks with double quotes for identifiers
  pgSql = pgSql.replace(/`/g, '"');
  
  // Execute the query using Supabase's rpc or raw SQL
  const { data, error } = await supabase.rpc('exec_sql', {
    query: pgSql,
    params: params || []
  }).single();
  
  if (error) {
    // If the rpc function doesn't exist, try using the REST API with raw SQL
    // Note: This requires enabling the pg_graphql extension or using a custom function
    console.error('Query error:', error);
    throw error;
  }
  
  return (data as T[]) || [];
}

/**
 * Execute an INSERT, UPDATE, or DELETE query
 * Returns the result with insertId for INSERT operations
 */
export async function execute(
  sql: string,
  params?: any[]
): Promise<{ insertId?: number; affectedRows?: number }> {
  // Convert MySQL syntax to PostgreSQL
  let pgSql = sql;
  let paramIndex = 0;
  pgSql = pgSql.replace(/\?/g, () => `$${++paramIndex}`);
  pgSql = pgSql.replace(/`/g, '"');
  
  // Add RETURNING clause for INSERT to get the ID
  const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
  if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
    pgSql = pgSql.replace(/;?\s*$/, ' RETURNING *');
  }
  
  const { data, error } = await supabase.rpc('exec_sql', {
    query: pgSql,
    params: params || []
  });
  
  if (error) {
    console.error('Execute error:', error);
    throw error;
  }
  
  // Extract insertId from the returned data
  const result: { insertId?: number; affectedRows?: number } = {};
  if (isInsert && data && Array.isArray(data) && data.length > 0) {
    // Find the primary key column (ends with _id)
    const firstRow = data[0];
    const idKey = Object.keys(firstRow).find(key => key.endsWith('_id'));
    if (idKey) {
      result.insertId = firstRow[idKey];
    }
  }
  result.affectedRows = Array.isArray(data) ? data.length : 0;
  
  return result;
}

/**
 * Execute a query and return the first row or null
 */
export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Check if a record exists
 */
export async function exists(
  table: string,
  column: string,
  value: any
): Promise<boolean> {
  const { data, error } = await supabase
    .from(table)
    .select('1')
    .eq(column, value)
    .limit(1);
  
  if (error) {
    console.error('Exists check error:', error);
    throw error;
  }
  
  return (data?.length ?? 0) > 0;
}

// ============================================
// Supabase Query Builder Helpers
// These provide a more type-safe way to interact with Supabase
// ============================================

/**
 * Get records from a table with optional filters
 */
export async function getRecords<T = any>(
  table: string,
  options?: {
    select?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  }
): Promise<T[]> {
  let query = supabase.from(table).select(options?.select || '*');
  
  if (options?.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      query = query.eq(key, value);
    }
  }
  
  if (options?.orderBy) {
    query = query.order(options.orderBy.column, { 
      ascending: options.orderBy.ascending ?? true 
    });
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('GetRecords error:', error);
    throw error;
  }
  
  return (data as T[]) || [];
}

/**
 * Insert a record into a table
 */
export async function insertRecord<T = any>(
  table: string,
  data: Record<string, any>
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();
  
  if (error) {
    console.error('InsertRecord error:', error);
    throw error;
  }
  
  return result as T;
}

/**
 * Update records in a table
 */
export async function updateRecord<T = any>(
  table: string,
  data: Record<string, any>,
  filters: Record<string, any>
): Promise<T[]> {
  let query = supabase.from(table).update(data);
  
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  
  const { data: result, error } = await query.select();
  
  if (error) {
    console.error('UpdateRecord error:', error);
    throw error;
  }
  
  return (result as T[]) || [];
}

/**
 * Delete records from a table
 */
export async function deleteRecord(
  table: string,
  filters: Record<string, any>
): Promise<void> {
  let query = supabase.from(table).delete();
  
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  
  const { error } = await query;
  
  if (error) {
    console.error('DeleteRecord error:', error);
    throw error;
  }
}
