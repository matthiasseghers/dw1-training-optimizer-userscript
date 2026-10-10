#!/usr/bin/env node

/**
 * Gates `npm audit` results: fails on any high/critical vulnerability that is
 * not part of an explicitly ignored advisory chain (see IGNORED_GHSA below).
 *
 * Usage: npm audit --audit-level=high --json > npm-audit.json && node scripts/audit-gate.js
 */

import fs from 'fs';

// Advisory IDs we knowingly accept, with the reason:
// GHSA-c475-qrg2-pj4r — dev-only DoS in basic-ftp, reached through
// markdown-link-check's proxy stack (link-check -> proxy-agent ->
// pac-proxy-agent -> get-uri). The only fix npm offers would major-downgrade
// markdown-link-check (3.15.0 -> 3.11.2), which we reject. REMOVE this entry
// once upstream get-uri drops basic-ftp <= 6.2.0 — a routine Dependabot
// lockfile PR will clear the whole chain.
const IGNORED_GHSA = new Set(['GHSA-c475-qrg2-pj4r']);

const REPORT = 'npm-audit.json';

let raw;
try {
  raw = fs.readFileSync(REPORT, 'utf8');
} catch {
  console.error(`npm audit gate: cannot read ${REPORT} — fail closed.`);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(raw);
} catch {
  console.error(`npm audit gate: ${REPORT} is not valid JSON — fail closed.`);
  process.exit(1);
}

if (!report || typeof report !== 'object' || !report.vulnerabilities) {
  console.error(`npm audit gate: ${REPORT} has no vulnerabilities data — fail closed.`);
  process.exit(1);
}

const vulnerabilities = report.vulnerabilities;

// A package is ignored when every `via` entry is either an advisory whose url
// is in IGNORED_GHSA, or a string naming an already-ignored package. Iterate
// to a fixpoint so whole transitive chains collapse.
const ignored = new Set();
let changed = true;
while (changed) {
  changed = false;
  for (const vuln of Object.values(vulnerabilities)) {
    if (ignored.has(vuln.name)) continue;
    const via = vuln.via ?? [];
    const allIgnored =
      via.length > 0 &&
      via.every((entry) => {
        if (typeof entry === 'string') return ignored.has(entry);
        const url = entry.url ?? '';
        return [...IGNORED_GHSA].some((id) => url.includes(id));
      });
    if (allIgnored) {
      ignored.add(vuln.name);
      changed = true;
    }
  }
}

// Stale carve-out reminder: an ignored advisory that no longer appears in the
// report means the chain is fixed and the entry can be removed. On a fully
// clean audit this warning firing is correct. Advisory only — never gates.
const reportedUrls = Object.values(vulnerabilities).flatMap((vuln) =>
  (vuln.via ?? []).map((entry) => (typeof entry === 'string' ? '' : (entry.url ?? '')))
);
for (const id of IGNORED_GHSA) {
  if (!reportedUrls.some((url) => url.includes(id))) {
    console.warn(
      `npm audit gate: ignored advisory ${id} no longer appears in the report - the carve-out is no longer needed, consider removing it from IGNORED_GHSA`
    );
  }
}

const findings = Object.values(vulnerabilities).filter((vuln) => {
  const severity = String(vuln.severity ?? '').toLowerCase();
  return (severity === 'high' || severity === 'critical') && !ignored.has(vuln.name);
});

if (findings.length > 0) {
  for (const vuln of findings) {
    const sources = (vuln.via ?? [])
      .map((entry) => (typeof entry === 'string' ? entry : (entry.url ?? entry.name ?? 'unknown')))
      .join(', ');
    console.error(`${vuln.name}: ${vuln.severity} — ${sources}`);
  }
  process.exit(1);
}

console.log('npm audit: no unignored high/critical vulnerabilities');
