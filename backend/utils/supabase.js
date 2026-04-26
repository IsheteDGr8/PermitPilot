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
async function saveApplication(applicationId, intakeData, agentResults, overallStatus) {
  const client = getClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('applications').upsert({
      application_id: applicationId,
      intake_data: intakeData,
      agent_results: agentResults,
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
async function getApplications() {
  const client = getClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('applications')
      .select('*')
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

module.exports = { saveApplication, getApplications };
