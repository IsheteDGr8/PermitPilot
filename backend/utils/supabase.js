const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getClient() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || url.includes('your_supabase')) {
      console.warn('[Supabase] No valid SUPABASE_URL found. Database features disabled.');
      return null;
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

/**
 * Save an application to the database.
 */
async function saveApplication(applicationId, userId, intakeData, agentResults, crossAgentConflicts, checklist, totalCost, overallStatus) {
  const client = getClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('applications').upsert({
      application_id: applicationId,
      user_id: userId || null,
      intake_data: intakeData,
      agent_results: agentResults,
      cross_agent_conflicts: crossAgentConflicts,
      checklist: checklist,
      total_estimated_cost: totalCost,
      overall_status: overallStatus,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[Supabase] Save error:', error.message);
      return null;
    }
    return data;
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

module.exports = { saveApplication, getApplications, deleteApplication };
