require('dotenv').config({ path: '../.env.local' });
const express = require('express');
const cors = require('cors');

// Import all domain agents
const zoningAgent = require('./agents/zoning');
const healthAgent = require('./agents/health');
const fireAgent = require('./agents/fire');
const buildingAgent = require('./agents/building');
const licensingAgent = require('./agents/licensing');

// Import Supabase utilities (uses SERVICE ROLE KEY — bypasses RLS)
const { saveApplication, getApplications, deleteApplication } = require('./utils/supabase');

// NOTE: Supabase client is managed in utils/supabase.js with the SERVICE ROLE KEY
// This bypasses Row Level Security so the backend can insert rows on behalf of any user.

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// =========================================
// Health Check
// =========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PermitPilot API',
    timestamp: new Date().toISOString(),
    agents: ['Zoning Authority', 'Health Department', 'Fire Marshal', 'Building Dept', 'Business Licensing'],
  });
});

// =========================================
// Main Evaluation Endpoint (FIXED ROUTE NAME)
// =========================================
app.post('/api/evaluate-permit', async (req, res) => {
  const intakeData = req.body;
  const appId = intakeData.application_id || `app-${Date.now()}`;
  const userId = intakeData.user_id || null;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[🚀] New Evaluation Request: ${appId}`);
  console.log(`[📋] Business: ${intakeData.business_info?.business_name || 'Unknown'}`);
  console.log(`[📍] Type: ${intakeData.project_type || 'Unknown'}`);
  console.log(`${'='.repeat(60)}`);

  try {
    console.log('\n[⚡] Dispatching to 5 domain agents (staggered to avoid rate limits)...');

    const agentDefs = [
      { name: 'Zoning Authority', evaluator: zoningAgent },
      { name: 'Health Department', evaluator: healthAgent },
      { name: 'Fire Marshal', evaluator: fireAgent },
      { name: 'Building Dept', evaluator: buildingAgent },
      { name: 'Business Licensing', evaluator: licensingAgent },
    ];

    const startTime = Date.now();

    const agentPromises = agentDefs.map((agent, index) => {
      return new Promise(resolve => {
        setTimeout(async () => {
          try {
            console.log(`  [🔄] Starting ${agent.name}...`);
            const result = await agent.evaluator.evaluate(intakeData);
            resolve({ status: 'fulfilled', value: result, name: agent.name });
          } catch (error) {
            resolve({ status: 'rejected', reason: error, name: agent.name });
          }
        }, index * 500);
      });
    });

    const results = await Promise.all(agentPromises);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    const agentResults = results.map((result) => {
      const agentName = result.name;
      if (result.status === 'fulfilled') {
        const status = (result.value.status || 'error').toLowerCase();
        console.log(`  [${status === 'approved' ? '✅' : status === 'conflict' ? '⚠️' : '❓'}] ${agentName}: ${status}`);
        return {
          ...result.value,
          status,
          agent: result.value.agent || agentName,
        };
      } else {
        console.log(`  [❌] ${agentName}: FAILED — ${result.reason?.message}`);
        return {
          agent: agentName,
          status: 'error',
          summary: `${agentName} evaluation failed: ${result.reason?.message}`,
          findings: [],
          conflicts: [],
          requirements: [],
        };
      }
    });

    console.log(`\n[⏱️] All agents completed in ${elapsed}s`);

    console.log('\n[🔍] Running cross-agent conflict detection...');
    const crossAgentConflicts = detectCrossAgentConflicts(agentResults);

    if (crossAgentConflicts.length > 0) {
      console.log(`  [⚠️] Found ${crossAgentConflicts.length} cross-agent conflict(s)`);
    } else {
      console.log('  [✅] No cross-agent conflicts detected');
    }

    console.log('\n[📝] Generating dependency-ordered checklist...');
    const checklist = generateChecklist(agentResults);
    const totalCost = checklist.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);

    console.log(`  [💰] Estimated total cost: $${totalCost.toLocaleString()}`);

    const hasConflict = agentResults.some(a => a.status === 'conflict');
    const hasError = agentResults.some(a => a.status === 'error');
    const overallStatus = hasConflict ? 'conflicts_detected' : hasError ? 'partial_evaluation' : 'all_clear';

    // =========================================
    // Save to Database (uses SERVICE ROLE KEY — bypasses RLS)
    // =========================================
    console.log(`[💾] Saving application ${appId} to database...`);
    const saveResult = await saveApplication(
      appId, userId, intakeData, agentResults,
      crossAgentConflicts, checklist, totalCost, overallStatus
    );
    if (saveResult === null) {
      console.error(`  [⚠️] Database save returned null (check Supabase config/keys)`);
    } else {
      console.log(`  [✅] Application securely saved to Supabase!`);
    }

    const response = {
      application_id: appId,
      overall_status: overallStatus,
      evaluation_time_seconds: parseFloat(elapsed),
      agents: agentResults,
      cross_agent_conflicts: crossAgentConflicts,
      checklist,
      total_estimated_cost: totalCost,
      evaluated_at: new Date().toISOString(),
    };

    console.log(`\n[✅] Evaluation complete. Status: ${overallStatus}`);
    console.log(`${'='.repeat(60)}\n`);

    res.json(response);
  } catch (error) {
    console.error(`[❌] Fatal evaluation error:`, error);
    res.status(500).json({
      application_id: appId,
      overall_status: 'error',
      error: error.message,
      agents: [],
      cross_agent_conflicts: [],
      checklist: [],
      total_estimated_cost: 0,
    });
  }
});

// =========================================
// Portal Endpoints
// =========================================
app.get('/api/applications', async (req, res) => {
  try {
    const userId = req.query.user_id;
    const apps = await getApplications(userId);
    res.json({ applications: apps });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/applications/:id', async (req, res) => {
  try {
    const appId = req.params.id;
    const userId = req.query.user_id;
    const success = await deleteApplication(appId, userId);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: 'Failed to delete application' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================
// Helpers
// =========================================
function detectCrossAgentConflicts(agentResults) {
  const conflicts = [];
  for (let i = 0; i < agentResults.length; i++) {
    for (let j = i + 1; j < agentResults.length; j++) {
      const a = agentResults[i];
      const b = agentResults[j];

      if (a.agent?.includes('Zoning') && b.agent?.includes('Fire') ||
        a.agent?.includes('Fire') && b.agent?.includes('Zoning')) {
        const zoningAgent = a.agent?.includes('Zoning') ? a : b;
        const fireAgent2 = a.agent?.includes('Fire') ? a : b;

        if (zoningAgent.status === 'approved' && fireAgent2.status === 'conflict') {
          conflicts.push({
            type: 'location_fuel_conflict',
            agents: [zoningAgent.agent, fireAgent2.agent],
            description: 'Zoning approved the location, but Fire Marshal has safety concerns at this site. The location may need adjustment or equipment changes.',
            severity: 'high',
            resolution_options: [
              'Switch from propane to electric cooking equipment',
              'Relocate operating zone to satisfy fire safety distance requirements',
            ],
          });
        }
      }
    }
  }
  return conflicts;
}

function generateChecklist(agentResults) {
  const allRequirements = [];
  agentResults.forEach(agent => {
    if (agent.requirements && Array.isArray(agent.requirements)) {
      agent.requirements.forEach(req => {
        allRequirements.push({
          ...req,
          source_agent: agent.agent,
          status: 'pending',
        });
      });
    }
  });

  const priorityOrder = { required: 0, recommended: 1, optional: 2 };
  const sorted = allRequirements.sort((a, b) => {
    const aHasDep = a.dependency ? 1 : 0;
    const bHasDep = b.dependency ? 1 : 0;
    if (aHasDep !== bHasDep) return aHasDep - bHasDep;
    const aPri = priorityOrder[a.priority] ?? 1;
    const bPri = priorityOrder[b.priority] ?? 1;
    return aPri - bPri;
  });

  return sorted.map((item, index) => ({
    step: index + 1,
    ...item,
  }));
}

// =========================================
// Start Server with Event Loop Anchor
// =========================================
const server = app.listen(PORT, () => {
  console.log(`\n🚀 PermitPilot API Gateway listening at http://localhost:${PORT}`);
  console.log('📋 Agents: Zoning | Health | Fire | Building | Licensing');
  console.log('⏳ Waiting for frontend payloads...\n');
});

// This explicitly warns you if Port 8080 is actually taken by an invisible app
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n[❌] FATAL ERROR: PORT ${PORT} IS ALREADY IN USE!`);
    console.error(`Another application (or copilot) is using this port. You must kill it first.\n`);
  } else {
    console.error('\n[❌] Server Error:', e);
  }
});

// ⚓ THE ANCHOR HACK: 
// This forces the Node process to stay alive permanently on Windows by keeping a timer in the event loop.
setInterval(() => { }, 1000 * 60 * 60);