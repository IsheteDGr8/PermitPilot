const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getClient() {
  if (!supabase) {
    // Try both env var naming conventions
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    // Prefer SERVICE ROLE KEY (bypasses RLS) — critical for backend inserts on behalf of users
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const key = serviceKey || anonKey;

    if (!url || url.includes('your_supabase')) {
      console.warn('[Supabase] No valid SUPABASE_URL found. Database features disabled.');
      return null;
    }
    if (!key) {
      console.warn('[Supabase] No Supabase key found. Database features disabled.');
      return null;
    }

    console.log(`[Supabase] Initialized with ${serviceKey ? 'SERVICE ROLE' : 'ANON'} key`);
    supabase = createClient(url, key);
  }
  return supabase;
}

/**
 * Save an application to the database.
 */
async function saveApplication(applicationId, userId, intakeData, agentResults, crossAgentConflicts, checklist, totalCost, overallStatus) {
  const client = getClient();
  if (!client) {
    console.warn('[Supabase] Client not available — skipping save.');
    return null;
  }

  try {
    console.log(`[Supabase] Saving app=${applicationId} user=${userId || 'anonymous'}`);
    const { data, error } = await client.from('applications').upsert({
      application_id: applicationId,
      user_id: userId || null,
      project_type: intakeData?.project_type || null,
      intake_data: intakeData,
      agent_results: agentResults,
      cross_agent_conflicts: crossAgentConflicts,
      checklist: checklist,
      total_estimated_cost: totalCost,
      overall_status: overallStatus,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[Supabase] Save error:', error.message, error.details || '');
      return null;
    }
    return data || { success: true };
  } catch (e) {
    console.error('[Supabase] Exception:', e.message);
    return null;
  }
}

/**
 * Get all applications from the database.
 */
async function getApplications(userId = null) {
  const client = getClient();
  if (!client) return [];

  try {
    let query = client.from('applications').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[Supabase] Fetch error:', error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('[Supabase] Exception:', e.message);
    return [];
  }
}

/**
 * Delete an application.
 */
async function deleteApplication(applicationId, userId) {
  const client = getClient();
  if (!client) return false;

  try {
    let query = client.from('applications').delete().eq('application_id', applicationId);
    if (userId) {
      query = query.eq('user_id', userId); // Ensure the user owns it before deleting
    }
    const { error } = await query;
    if (error) {
      console.error('[Supabase] Delete error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Supabase] Delete Exception:', e.message);
    return false;
  }
}

module.exports = { saveApplication, getApplications, deleteApplication, getClient };
