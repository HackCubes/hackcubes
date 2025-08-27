/*
  Import Hirelyst CSV (questions_rows.csv, flags_rows.csv) into HackCubes.
  - Preserves IDs
  - Maps columns to HackCubes schema
  - Seeds sample assessment/sections if empty
  Usage: node scripts/import-hirelyst.js
*/

const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE (or SUPABASE_SERVICE_ROLE_KEY) are set in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const IMPORT_DIR = path.resolve(process.cwd(), 'import', 'hirelyst');
const Q_CSV = path.join(IMPORT_DIR, 'questions_rows.csv');
const F_CSV = path.join(IMPORT_DIR, 'flags_rows.csv');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map(v => v === '' ? null : v);
}

async function readCSV(file) {
  console.log(`Reading CSV: ${path.relative(process.cwd(), file)}`);
  if (!fs.existsSync(file)) { console.warn('File not found:', file); return { headers: [], rows: [] }; }
  const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
  const rows = [];
  let headers = [];
  let first = true;
  for await (const line of rl) {
    if (first) { headers = parseCSVLine(line); first = false; continue; }
    if (!line.trim()) continue;
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx]; });
    rows.push(row);
  }
  console.log(`Loaded ${rows.length} rows from ${path.basename(file)}`);
  return { headers, rows };
}

function toJsonArray(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return String(value).split('|').map(s => s.trim()).filter(Boolean);
}

async function getSectionsByName(assessmentId) {
  const secAvailable = await detectAvailableColumns('sections', ['order_index']);
  let query = supabase.from('sections').select('id, name').eq('assessment_id', assessmentId);
  if (secAvailable.has('order_index')) query = query.order('order_index');
  const { data, error } = await query;
  if (error) throw error;
  const map = new Map();
  (data || []).forEach(s => map.set(s.name, s.id));
  return map;
}

// HackCubes schema columns - based on actual database structure
const QUESTION_COLS = ['name','description','type','category','difficulty','score','no_of_flags','hints','solution','learning_notes','tags','instance_id','template_id','docker_image','vm_template','network_config','is_active','order_index','created_by_id','created_at','updated_at'];
const FLAG_COLS = ['type','hash','value','score','description','hint','is_active','created_at'];

async function detectAvailableColumns(table, cols) {
  const available = new Set();
  for (const col of cols) {
    try {
      const { error } = await supabase.from(table).select(`id, ${col}`).limit(1);
      if (!error) available.add(col);
    } catch (e) { /* ignore */ }
  }
  return available;
}

async function ensureSampleAssessment() {
  console.log('Ensuring sample assessment exists...');
  const { data: existing, error: exErr } = await supabase.from('assessments').select('id').limit(1);
  if (exErr) throw exErr;
  if (existing && existing.length > 0) {
    const id = existing[0].id;
    console.log('Found existing assessment:', id);
    await ensureDefaultSections(id);
    return id;
  }
  // Detect optional assessment columns
  const aAvail = await detectAvailableColumns('assessments', ['description','status','difficulty','duration_in_minutes']);
  const base = { name: 'Sample CTF' };
  if (aAvail.has('description')) base.description = 'Imported from Hirelyst';
  if (aAvail.has('status')) base.status = 'ACTIVE';
  if (aAvail.has('difficulty')) base.difficulty = 'MEDIUM';
  if (aAvail.has('duration_in_minutes')) base.duration_in_minutes = 90;
  const { data: a, error } = await supabase.from('assessments').insert(base).select().single();
  if (error) throw error;
  console.log('Created assessment:', a.id);
  await ensureDefaultSections(a.id);
  return a.id;
}

async function ensureDefaultSections(assessmentId) {
  const defaults = [
    { name: 'Web Security', description: 'Web vulns', order_index: 0 },
    { name: 'Network Security', description: 'Infra vulns', order_index: 1 },
    { name: 'Misc', description: 'Other', order_index: 2 },
  ];
  const { data: existing, error } = await supabase.from('sections').select('id, name').eq('assessment_id', assessmentId);
  if (error) throw error;
  const names = new Set((existing || []).map(s => s.name));
  const toCreate = defaults.filter(s => !names.has(s.name));
  if (toCreate.length === 0) return;
  const secAvail = await detectAvailableColumns('sections', ['description','order_index']);
  for (const s of toCreate) {
    const payload = { assessment_id: assessmentId, name: s.name };
    if (secAvail.has('description')) payload.description = s.description;
    if (secAvail.has('order_index')) payload.order_index = s.order_index;
    const { error: se } = await supabase.from('sections').insert(payload);
    if (se) throw se;
  }
}

async function upsertQuestions(rows, sectionMap) {
  console.log(`Upserting ${rows.length} questions...`);
  const available = await detectAvailableColumns('questions', QUESTION_COLS);

  let orderCounters = {};
  for (const [_, sectionId] of sectionMap) {
    const { count, error } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('section_id', sectionId);
    if (error) throw error;
    orderCounters[sectionId] = count || 0;
  }

  let idx = 0;
  for (const r of rows) {
    idx++;
    const category = (r.category || '').trim();
    const targetSectionId = sectionMap.get(category) || sectionMap.get('Misc');
    const order_index = (orderCounters[targetSectionId] || 0);
    orderCounters[targetSectionId] = order_index + 1;

    const payload = { id: r.id, section_id: targetSectionId };

    // Map Hirelyst CSV columns to HackCubes schema
    if (available.has('name')) payload.name = r.name;
    if (available.has('description')) payload.description = r.description || null;
    if (available.has('type')) payload.type = (r.type || 'web').toLowerCase();
    if (available.has('category')) payload.category = r.category || 'Web Security';
    if (available.has('difficulty')) payload.difficulty = (r.difficulty || 'MEDIUM').toUpperCase();
    if (available.has('score')) payload.score = parseInt(r.score || '100', 10) || 100;
    if (available.has('no_of_flags')) payload.no_of_flags = parseInt(r.no_of_flags || '1', 10) || 1;
    if (available.has('tags')) payload.tags = toJsonArray(r.tags);
    if (available.has('hints')) payload.hints = toJsonArray(r.hints);
    if (available.has('solution')) payload.solution = r.content || null;
    if (available.has('learning_notes')) payload.learning_notes = r.writeup_url || null;
    if (available.has('instance_id')) payload.instance_id = r.instance_id || null;
    if (available.has('template_id')) payload.template_id = r.template_id || null;
    if (available.has('docker_image')) payload.docker_image = r.docker_image || null;
    if (available.has('vm_template')) payload.vm_template = r.vm_template || null;
    if (available.has('network_config')) payload.network_config = r.network_config || null;
    if (available.has('is_active')) payload.is_active = true;
    if (available.has('order_index')) payload.order_index = order_index;
    if (available.has('created_at')) payload.created_at = r.created_at || null;
    if (available.has('updated_at')) payload.updated_at = r.updated_at || null;

    const { error } = await supabase.from('questions').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Question upsert failed for id:', r.id, error.message);
      throw error;
    }
    if (idx % 5 === 0) console.log(`...upserted ${idx}/${rows.length}`);
  }
}

async function upsertFlags(rows) {
  console.log(`Upserting ${rows.length} flags...`);
  const available = await detectAvailableColumns('flags', FLAG_COLS);
  let idx = 0;
  for (const r of rows) {
    idx++;
    const payload = {
      id: r.id,
      question_id: r.question_id,
    };
    
    // Map Hirelyst CSV columns to HackCubes schema
    if (available.has('type')) payload.type = r.type || 'USER';
    if (available.has('hash')) payload.hash = r.hash;
    if (available.has('value')) payload.value = r.hash; // In Hirelyst, hash column contains the flag value
    if (available.has('score')) payload.score = parseInt(r.score || '0', 10) || 0;
    if (available.has('description')) payload.description = r.description || null;
    if (available.has('hint')) payload.hint = r.hint || null;
    if (available.has('is_active')) payload.is_active = true;
    if (available.has('created_at')) payload.created_at = r.created_at || null;

    const { error } = await supabase.from('flags').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Flag upsert failed for id:', r.id, error.message);
      throw error;
    }
    if (idx % 10 === 0) console.log(`...upserted ${idx}/${rows.length}`);
  }
}

async function recalcTotals(assessmentId) {
  console.log('Recalculating totals...');
  const { data: sections, error: se } = await supabase.from('sections').select('id').eq('assessment_id', assessmentId);
  if (se) throw se;
  const sectionIds = (sections || []).map(s => s.id);
  if (sectionIds.length === 0) return;

  // Use 'score' column for HackCubes schema
  const { data: qs, error: qe } = await supabase.from('questions').select('id, score').in('section_id', sectionIds);
  if (qe) throw qe;
  const totalQ = (qs || []).length;
  const totalScore = (qs || []).reduce((sum, q) => sum + (q.score ?? 0), 0);

  // Detect assessment total columns
  const aAvail = await detectAvailableColumns('assessments', ['no_of_questions','max_score']);
  const updatePayload = {};
  if (aAvail.has('no_of_questions')) updatePayload.no_of_questions = totalQ;
  if (aAvail.has('max_score')) updatePayload.max_score = totalScore;
  if (Object.keys(updatePayload).length > 0) {
    const { error: ue } = await supabase.from('assessments').update(updatePayload).eq('id', assessmentId);
    if (ue) throw ue;
    console.log('Totals updated:', { totalQ, totalScore });
  } else {
    console.log('Totals columns not present, skipping update');
  }
}

async function main() {
  console.log('Starting Hirelyst import...');
  const { rows: qRows } = await readCSV(Q_CSV);
  const { rows: fRows } = await readCSV(F_CSV);

  if (!qRows.length) {
    console.error('No questions_rows.csv found or empty.');
    process.exit(1);
  }

  const assessmentId = await ensureSampleAssessment();
  const sectionMap = await getSectionsByName(assessmentId);

  await upsertQuestions(qRows, sectionMap);
  if (fRows.length) await upsertFlags(fRows);

  await recalcTotals(assessmentId);
  console.log('Import complete.');
}

main().catch(err => { console.error('Import failed:', err); process.exit(1); });
