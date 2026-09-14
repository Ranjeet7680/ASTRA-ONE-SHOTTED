// ASTRA: ONE SHOTTED // Admin Dashboard & ML Ops Client

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initTabs();
  initRefresh();
  initAimLab();
  initWeaponFilters();
  initIncidentFilters();
  initAIPlatform();

  // Initial data load
  loadOverview();
  loadWeapons();
  loadModels();
  loadIncidents();
  loadPlayers();
  loadAIStatus();
});

// Live UTC clock
function initClock() {
  const clockEl = document.getElementById('systemClock');
  setInterval(() => {
    const now = new Date();
    clockEl.textContent = now.toUTCString().slice(17, 25) + ' UTC';
  }, 1000);
}

// Navigation Tabs
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = `tab-${btn.getAttribute('data-tab')}`;
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

function initRefresh() {
  const btn = document.getElementById('btnRefresh');
  btn.addEventListener('click', () => {
    btn.textContent = 'SYNCING...';
    Promise.all([
      loadOverview(),
      loadWeapons(),
      loadModels(),
      loadIncidents(),
      loadPlayers()
    ]).finally(() => {
      setTimeout(() => { btn.innerHTML = 'SYNC'; }, 400);
    });
  });
}

// 1. OVERVIEW
async function loadOverview() {
  try {
    const res = await fetch('/admin/api/overview');
    if (!res.ok) return;
    const data = await res.json();

    document.getElementById('kpiDau').textContent = data.dau || 0;
    document.getElementById('kpiMau').textContent = data.mau || 0;
    document.getElementById('kpiMatches').textContent = data.total_matches || 0;
    document.getElementById('kpiActiveMatches').textContent = data.active_matches || 0;
    document.getElementById('kpiIncidents').textContent = data.open_anti_cheat_incidents || 0;
    document.getElementById('incidentBadge').textContent = data.open_anti_cheat_incidents || 0;
    document.getElementById('catalogWeaponsCount').textContent = `${data.weapons_in_catalog || 52} Weapons Armed`;
  } catch (err) {
    console.error('Failed to load overview:', err);
  }
}

// 2. WEAPONS META
let allWeapons = [];

async function loadWeapons() {
  try {
    const res = await fetch('/ml/balance/all');
    if (!res.ok) return;
    allWeapons = await res.json();
    renderWeapons();
  } catch (err) {
    console.error('Failed to load weapons:', err);
  }
}

function initWeaponFilters() {
  const searchInput = document.getElementById('weaponSearch');
  const catSelect = document.getElementById('weaponCatFilter');

  if (searchInput) searchInput.addEventListener('input', renderWeapons);
  if (catSelect) catSelect.addEventListener('change', renderWeapons);
}

function renderWeapons() {
  const tbody = document.getElementById('weaponsTbody');
  const search = (document.getElementById('weaponSearch')?.value || '').toLowerCase();
  const cat = document.getElementById('weaponCatFilter')?.value || 'ALL';

  const filtered = allWeapons.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search) || w.weapon_id.toLowerCase().includes(search);
    const matchCat = cat === 'ALL' || w.category === cat;
    return matchSearch && matchCat;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">No weapons matching criteria</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(w => {
    let statusClass = 'text-success';
    if (w.balance_status === 'OVERPOWERED') statusClass = 'text-danger';
    if (w.balance_status === 'UNDERPOWERED') statusClass = 'text-warning';

    const recommendation = w.tuning_recommendations && w.tuning_recommendations[0] 
      ? w.tuning_recommendations[0] 
      : 'Within optimal TTK boundaries.';

    return `
      <tr>
        <td><strong>${w.name}</strong> <span class="text-muted">(${w.weapon_id})</span></td>
        <td>${w.category}</td>
        <td><span class="badge badge-green">${w.tier}</span></td>
        <td>${(w.win_rate * 100).toFixed(1)}%</td>
        <td>${(w.pick_rate * 100).toFixed(1)}%</td>
        <td>${w.kd_ratio}</td>
        <td><strong class="${statusClass}">${w.balance_status}</strong></td>
        <td class="text-secondary" style="font-size: 11px;">${recommendation}</td>
      </tr>
    `;
  }).join('');
}

// 3. ML MODEL REGISTRY & ROLLBACK
async function loadModels() {
  try {
    const res = await fetch('/admin/api/models');
    if (!res.ok) return;
    const data = await res.json();
    const models = data.models || {};
    const container = document.getElementById('modelsContainer');

    const cards = Object.keys(models).map(key => {
      const m = models[key];
      let metricsText = '';
      if (m.r2_score !== undefined) metricsText = `R2 Score: ${m.r2_score} | MAE: ${m.mae}`;
      else if (m.accuracy !== undefined) metricsText = `Accuracy: ${(m.accuracy * 100).toFixed(1)}% | F1: ${m.f1_score}`;
      else if (m.anomaly_precision !== undefined) metricsText = `Precision: ${(m.anomaly_precision * 100).toFixed(1)}%`;
      else metricsText = `Affinity Matrix Clusters`;

      return `
        <div class="model-card">
          <div>
            <div class="model-header">
              <div class="model-title">${m.model_id.toUpperCase()}</div>
              <span class="badge ${m.status === 'ACTIVE' ? 'badge-green' : ''}">${m.status}</span>
            </div>
            <div class="model-meta">
              <div><strong>Version:</strong> ${m.active_version}</div>
              <div><strong>Algorithm:</strong> ${m.algorithm}</div>
              <div><strong>Metrics:</strong> ${metricsText}</div>
              <div><strong>Artifact:</strong> ${m.file_name}</div>
              <div><strong>Trained:</strong> ${new Date(m.last_trained).toLocaleString()}</div>
            </div>
          </div>
          <div class="model-footer">
            <span class="text-muted">Rollback Available: ${m.rollback_versions ? m.rollback_versions.join(', ') : 'v1.0.0'}</span>
            <button class="btn-action-sm" onclick="rollbackModel('${m.model_id}', 'v1.0.0')">RE-APPLY v1.0.0</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = cards.join('');
  } catch (err) {
    console.error('Failed to load models:', err);
  }
}

window.rollbackModel = async function(modelId, version) {
  if (!confirm(`Confirm rollback of ${modelId} to version ${version}?`)) return;
  try {
    const res = await fetch('/admin/api/models/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_id: modelId, target_version: version })
    });
    const result = await res.json();
    alert(`Rollback status: ${result.message || result.status}`);
    loadModels();
  } catch (err) {
    alert(`Rollback failed: ${err.message}`);
  }
};

// 4. ANTI-CHEAT DESK
async function loadIncidents() {
  const status = document.getElementById('incidentStatusFilter')?.value || 'ALL';
  try {
    const res = await fetch(`/admin/api/incidents?status=${status}`);
    if (!res.ok) return;
    const incidents = await res.json();
    const tbody = document.getElementById('incidentsTbody');

    if (incidents.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-success">Clean Telemetry - No open incidents in queue!</td></tr>';
      return;
    }

    tbody.innerHTML = incidents.map(inc => {
      return `
        <tr>
          <td><span class="text-accent">${inc.incident_id.slice(0, 10)}</span></td>
          <td>${inc.player_id}</td>
          <td><strong class="text-danger">${inc.violation_type}</strong></td>
          <td><span class="badge">${inc.severity}</span></td>
          <td style="font-size: 11px;">${inc.details}</td>
          <td><strong>${inc.status}</strong></td>
          <td>
            <button class="btn-action-sm" onclick="handleIncident('${inc.incident_id}', 'DISMISS')">DISMISS</button>
            <button class="btn-action-sm" onclick="handleIncident('${inc.incident_id}', 'RESOLVE')">RESOLVE</button>
            <button class="btn-action-sm btn-danger" onclick="handleIncident('${inc.incident_id}', 'SHADOWBAN')">SHADOWBAN</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load incidents:', err);
  }
}

function initIncidentFilters() {
  const select = document.getElementById('incidentStatusFilter');
  if (select) select.addEventListener('change', loadIncidents);
}

window.handleIncident = async function(incidentId, action) {
  try {
    const res = await fetch(`/admin/api/incidents/${incidentId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: action, notes: `Actioned from Admin Portal` })
    });
    if (res.ok) {
      loadIncidents();
      loadOverview();
    }
  } catch (err) {
    console.error('Action failed:', err);
  }
};

// 5. PLAYERS TELEMETRY
async function loadPlayers() {
  try {
    const res = await fetch('/admin/api/players');
    if (!res.ok) return;
    const players = await res.json();
    const tbody = document.getElementById('playersTbody');

    if (players.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center">No player profiles found</td></tr>';
      return;
    }

    tbody.innerHTML = players.map(p => {
      const statusBadge = p.is_banned 
        ? '<span class="badge">BANNED</span>' 
        : '<span class="badge badge-green">ACTIVE</span>';

      return `
        <tr>
          <td><span class="text-accent">${p.player_id}</span></td>
          <td><strong>${p.username}</strong></td>
          <td>${p.rank}</td>
          <td>${p.rank_score}</td>
          <td>Lvl ${p.level}</td>
          <td>${p.kills}</td>
          <td>${p.deaths}</td>
          <td>${p.matches}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load players:', err);
  }
}

// 6. AIM TELEMETRY LAB
function initAimLab() {
  const sliders = [
    { id: 'labAcc', label: 'labAccVal', fmt: v => `${Math.round(v * 100)}%` },
    { id: 'labRecoil', label: 'labRecoilVal', fmt: v => `${v}` },
    { id: 'labReact', label: 'labReactVal', fmt: v => `${v} ms` },
    { id: 'labFlick', label: 'labFlickVal', fmt: v => `${v}` },
    { id: 'labCross', label: 'labCrossVal', fmt: v => `${v}` }
  ];

  sliders.forEach(s => {
    const el = document.getElementById(s.id);
    const lbl = document.getElementById(s.label);
    if (el && lbl) {
      el.addEventListener('input', () => {
        lbl.textContent = s.fmt(parseFloat(el.value));
      });
    }
  });

  const testBtn = document.getElementById('btnTestInference');
  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      testBtn.textContent = 'EVALUATING ML...';
      const acc = parseFloat(document.getElementById('labAcc').value);
      const recoil = parseFloat(document.getElementById('labRecoil').value);
      const react = parseFloat(document.getElementById('labReact').value);
      const flick = parseFloat(document.getElementById('labFlick').value);
      const cross = parseFloat(document.getElementById('labCross').value);

      try {
        const [aimRes, anomRes] = await Promise.all([
          fetch('/ml/aim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accuracy: acc,
              recoil_control: recoil,
              reaction_time_ms: react,
              flick_consistency: flick,
              crosshair_placement: cross
            })
          }).then(r => r.json()),
          fetch('/ml/skill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accuracy: acc,
              recoil_control: recoil,
              reaction_time_ms: react,
              kills: 10,
              deaths: 4,
              damage: 1100,
              score: 1200
            })
          }).then(r => r.json())
        ]);

        const resultContainer = document.getElementById('aimLabResult');
        resultContainer.innerHTML = `
          <div class="kpi-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 16px;">
            <div class="kpi-card">
              <div class="kpi-label">OVERALL AIM RATING</div>
              <div class="kpi-value text-accent">${aimRes.overall_aim_rating} / 100</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">PREDICTED SKILL ELO</div>
              <div class="kpi-value text-success">${anomRes.predicted_skill_rating}</div>
              <div class="kpi-sub">Tier: ${anomRes.tier_bracket} (${anomRes.skill_percentile}th %)</div>
            </div>
          </div>

          <div class="stat-row">
            <span>Accuracy Index:</span>
            <span class="val">${aimRes.accuracy_score} / 100</span>
          </div>
          <div class="stat-row">
            <span>Recoil Control Index:</span>
            <span class="val">${aimRes.recoil_control_score} / 100</span>
          </div>
          <div class="stat-row">
            <span>Twitch Reaction Index:</span>
            <span class="val">${aimRes.reaction_time_score} / 100 (${aimRes.reaction_time_ms}ms)</span>
          </div>
          <div class="stat-row">
            <span>Flick Shot Rating:</span>
            <span class="val">${aimRes.flick_consistency_score} / 100</span>
          </div>

          <div style="margin-top: 14px; padding: 10px; background: rgba(0, 229, 255, 0.05); border-left: 3px solid var(--accent-cyan); border-radius: 4px;">
            <strong style="font-size: 12px; color: var(--accent-cyan);">COACHING INSIGHTS:</strong>
            <ul style="margin: 6px 0 0 16px; font-size: 12px; line-height: 1.5;">
              ${(aimRes.insights || []).map(i => `<li>${i}</li>`).join('')}
            </ul>
          </div>
        `;
      } catch (err) {
        console.error('Inference error:', err);
      } finally {
        testBtn.textContent = 'EXECUTE ML INFERENCE';
      }
    });
  }
}

// 7. AI PLATFORM & RL BOTS
async function loadAIStatus() {
  try {
    const res = await fetch('/ai/models/status');
    if (!res.ok) return;
    const data = await res.json();
    if (data.metrics) {
      const latEl = document.getElementById('aiLatencyKpi');
      if (latEl) latEl.textContent = `${data.metrics.avg_latency_ms} ms`;

      const fallEl = document.getElementById('aiFallbacksKpi');
      if (fallEl) fallEl.textContent = `${data.metrics.fallbacks_triggered} Triggered`;
    }
    if (data.curriculum) {
      const curKpi = document.getElementById('aiCurriculumKpi');
      if (curKpi) curKpi.textContent = `Level ${data.curriculum.active_level} / ${data.curriculum.stages_total}`;
      const curStage = document.getElementById('aiCurriculumStage');
      if (curStage) curStage.textContent = data.curriculum.stage_name;
    }
  } catch (err) {
    console.error('Failed to load AI status:', err);
  }
}

function initAIPlatform() {
  const btnInfer = document.getElementById('btnRunBotInference');
  const btnRec = document.getElementById('btnRunLoadoutRec');
  const resBox = document.getElementById('aiInferenceResult');

  if (btnInfer && resBox) {
    btnInfer.addEventListener('click', async () => {
      btnInfer.textContent = 'RUNNING INFERENCE...';
      try {
        const diff = document.getElementById('botDiffSelect').value;
        const hp = parseFloat(document.getElementById('botHpInput').value) || 100;
        const enemyVis = document.getElementById('botEnemyVisible').checked;
        const forceFall = document.getElementById('botForceFallback').checked;

        const res = await fetch('/ai/bot/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            health: hp,
            ammo: hp < 30 ? 0 : 25,
            enemy_visible: enemyVis,
            enemy_rel_pos: [2.5, 0.0, 18.0],
            difficulty: diff,
            force_fallback: forceFall
          })
        });

        const data = await res.json();
        resBox.innerHTML = `[SUCCESS] Inference Completed in ${data.latency_ms} ms\n` +
          `Source:       ${data.source}\n` +
          `Action:       ${data.action}\n` +
          `Aim Pitch:    ${data.aim_pitch}°  | Aim Yaw: ${data.aim_yaw}°\n` +
          `Fire Trigger: ${data.fire ? 'ENGAGED [FIRING]' : 'HOLD'}\n` +
          `Move Heading: [${data.move_vector.map(v => v.toFixed(3)).join(', ')}]\n` +
          `Difficulty:   ${data.difficulty_tier || diff}\n` +
          `Safeguard:    ${data.source.includes('FALLBACK') ? 'SAFEGUARD ENGAGED' : 'NEURAL POLICY ACTIVE'}`;

        loadAIStatus();
      } catch (err) {
        resBox.textContent = `[ERROR] Failed to infer bot action: ${err.message}`;
      } finally {
        btnInfer.textContent = 'INFER BOT ACTION';
      }
    });
  }

  if (btnRec && resBox) {
    btnRec.addEventListener('click', async () => {
      btnRec.textContent = 'COMPUTING RECOMMENDATION...';
      try {
        const res = await fetch('/ai/recommend/loadout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kills: 9,
            deaths: 3,
            accuracy: 0.44,
            movement_speed: 5.2,
            reaction_latency_ms: 195.0
          })
        });

        const data = await res.json();
        let out = `[AI RECOMMENDER RESULT]\nArchetype: ${data.player_archetype}\nRationale: ${data.playstyle_rationale}\n\nTOP 5 WEAPON AFFINITIES:\n`;
        (data.top_weapons || []).forEach((w, i) => {
          out += `  ${i+1}. ${w.weapon} (${w.category}) — Confidence: ${(w.confidence_score * 100).toFixed(1)}%\n`;
        });
        if (data.recommended_loadout) {
          const l = data.recommended_loadout;
          out += `\nRECOMMENDED LOADOUT:\n  Primary:   ${l.primary}\n  Secondary: ${l.secondary}\n  Muzzle:    ${l.muzzle}\n  Optic:     ${l.optic}\n  Perk:      ${l.perk}\n  Lethal:    ${l.lethal}`;
        }
        resBox.textContent = out;
      } catch (err) {
        resBox.textContent = `[ERROR] Recommendation failed: ${err.message}`;
      } finally {
        btnRec.textContent = 'RECOMMEND LOADOUT';
      }
    });
  }
}
