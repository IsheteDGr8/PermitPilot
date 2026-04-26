require('dotenv').config({ path: '../.env.local' });
const express = require('express');
const cors = require('cors');

// Import all domain agents
const zoningAgent = require('./agents/zoning');
const healthAgent = require('./agents/health');
const fireAgent = require('./agents/fire');
const buildingAgent = require('./agents/building');
const licensingAgent = require('./agents/licensing');

// Import utilities
const { saveApplication, getApplications } = require('./utils/supabase');

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
// Main Evaluation Endpoint
// =========================================
app.post('/api/evaluate', async (req, res) => {
  const intakeData = req.body;
  const appId = intakeData.application_id || `app-${Date.now()}`;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[🚀] New Evaluation Request: ${appId}`);
  console.log(`[📋] Business: ${intakeData.business_info?.business_name || 'Unknown'}`);
  console.log(`[📍] Type: ${intakeData.project_type || 'Unknown'}`);
  console.log(`${'='.repeat(60)}`);

  try {
    // =========================================
    // PHASE 1: Parallel Agent Dispatch
    // =========================================
    console.log('\n[⚡] Dispatching to 5 domain agents (staggered to avoid rate limits)...');

    // Stagger calls with slight delays to avoid hitting per-minute rate limits
    const agentDefs = [
      { name: 'Zoning Authority', evaluator: zoningAgent },
      { name: 'Health Department', evaluator: healthAgent },
      { name: 'Fire Marshal', evaluator: fireAgent },
      { name: 'Building Dept', evaluator: buildingAgent },
      { name: 'Business Licensing', evaluator: licensingAgent },
    ];

    const startTime = Date.now();
    
    // Launch agents with staggered delays (500ms apart) to spread rate limit load
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
        }, index * 500); // 0ms, 500ms, 1000ms, 1500ms, 2000ms
      });
    });

    const results = await Promise.all(agentPromises);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Process results
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

    // =========================================
    // PHASE 2: Orchestrator — Conflict Detection
    // =========================================
    console.log('\n[🔍] Running cross-agent conflict detection...');

    const crossAgentConflicts = detectCrossAgentConflicts(agentResults);

    if (crossAgentConflicts.length > 0) {
      console.log(`  [⚠️] Found ${crossAgentConflicts.length} cross-agent conflict(s)`);
      crossAgentConflicts.forEach(c => {
        console.log(`    → ${c.agents.join(' ↔ ')}: ${c.description}`);
      });
    } else {
      console.log('  [✅] No cross-agent conflicts detected');
    }

    // =========================================
    // PHASE 3: Generate Unified Checklist
    // =========================================
    console.log('\n[📝] Generating dependency-ordered checklist...');

    const checklist = generateChecklist(agentResults);
    const totalCost = checklist.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);

    console.log(`  [💰] Estimated total cost: $${totalCost.toLocaleString()}`);
    console.log(`  [📋] Checklist items: ${checklist.length}`);

    // =========================================
    // PHASE 4: Determine Overall Status
    // =========================================
    const hasConflict = agentResults.some(a => a.status === 'conflict');
    const hasError = agentResults.some(a => a.status === 'error');
    const overallStatus = hasConflict ? 'conflicts_detected' : hasError ? 'partial_evaluation' : 'all_clear';

    // =========================================
    // PHASE 5: Save to Database
    // =========================================
    console.log('\n[💾] Saving to database...');
    await saveApplication(appId, intakeData, agentResults, overallStatus);
    console.log('  [✅] Saved successfully');

    // =========================================
    // Return unified response
    // =========================================
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
// Admin: Get past applications
// =========================================
app.get('/api/applications', async (req, res) => {
  try {
    const apps = await getApplications();
    res.json({ applications: apps });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================
// Cross-Agent Conflict Detection
// =========================================
function detectCrossAgentConflicts(agentResults) {
  const conflicts = [];

  // Check all pairs of agents for overlapping rule subjects
  for (let i = 0; i < agentResults.length; i++) {
    for (let j = i + 1; j < agentResults.length; j++) {
      const a = agentResults[i];
      const b = agentResults[j];

      // Common conflict patterns:
      // 1. Zoning approves location but Fire has proximity issues
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
              'Install additional fire suppression equipment to meet code at current location',
            ],
          });
        }
      }

      // 2. Building approves but Health requires additional plumbing
      if (a.agent?.includes('Building') && b.agent?.includes('Health') ||
          a.agent?.includes('Health') && b.agent?.includes('Building')) {
        const buildAgent = a.agent?.includes('Building') ? a : b;
        const healthAg = a.agent?.includes('Health') ? a : b;

        if (buildAgent.status === 'conflict' && healthAg.status === 'approved') {
          conflicts.push({
            type: 'building_health_conflict',
            agents: [buildAgent.agent, healthAg.agent],
            description: 'Health Department approved food preparation plans, but Building Dept requires structural modifications that may impact the kitchen layout.',
            severity: 'medium',
            resolution_options: [
              'Coordinate with both departments simultaneously on the kitchen design',
              'Get a preliminary building review before finalizing health department plans',
              'Consider a location that requires fewer structural modifications',
            ],
          });
        }
      }

      // 3. Both have conflicts — compound issue
      if (a.status === 'conflict' && b.status === 'conflict') {
        // Check if their conflicts relate to the same subject (location, equipment, etc.)
        const aConflictText = JSON.stringify(a.conflicts || []).toLowerCase();
        const bConflictText = JSON.stringify(b.conflicts || []).toLowerCase();

        const sharedTerms = ['propane', 'location', 'ventilation', 'electrical', 'plumbing', 'kitchen'];
        const overlap = sharedTerms.filter(t => aConflictText.includes(t) && bConflictText.includes(t));

        if (overlap.length > 0) {
          conflicts.push({
            type: 'compound_conflict',
            agents: [a.agent, b.agent],
            description: `Both ${a.agent} and ${b.agent} flagged conflicts related to: ${overlap.join(', ')}. These may need to be resolved together.`,
            severity: 'high',
            resolution_options: [
              `Address ${overlap.join(' and ')} requirements from both departments before proceeding`,
              'Request a joint review meeting with both departments',
              'Consult with a licensed contractor who can satisfy both sets of requirements',
            ],
          });
        }
      }
    }
  }

  return conflicts;
}

// =========================================
// Dependency-Ordered Checklist Generator
// =========================================
function generateChecklist(agentResults) {
  const allRequirements = [];

  // Collect requirements from all agents
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

  // Sort by dependency and priority
  const priorityOrder = { required: 0, recommended: 1, optional: 2 };
  const sorted = allRequirements.sort((a, b) => {
    // Items with no dependencies first
    const aHasDep = a.dependency ? 1 : 0;
    const bHasDep = b.dependency ? 1 : 0;
    if (aHasDep !== bHasDep) return aHasDep - bHasDep;

    // Then by priority
    const aPri = priorityOrder[a.priority] ?? 1;
    const bPri = priorityOrder[b.priority] ?? 1;
    return aPri - bPri;
  });

  // Add step numbers
  return sorted.map((item, index) => ({
    step: index + 1,
    ...item,
  }));
}

// =========================================
// Start Server
// =========================================
app.listen(PORT, () => {
  console.log(`\n🚀 PermitPilot API Gateway listening at http://localhost:${PORT}`);
  console.log('📋 Agents: Zoning | Health | Fire | Building | Licensing');
  console.log('⏳ Waiting for frontend payloads...\n');
});
