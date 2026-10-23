#!/usr/bin/env node
// Secret-hygiene gate: everything VITE_* — and anything vite.config.ts puts in
// `define` — is compiled into the public bundle, so tracked env files, VITE_*
// values and `define` entries must look like public configuration.
// Node built-ins only. Usage: node scripts/check-env-hygiene.mjs [dir]
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// An optional directory argument lets the self-checks point at temp fixtures.
const customRoot = process.argv[2];
const root = customRoot
  ? resolve(customRoot)
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];

/**
 * Enum-like values a VITE_* setting may hold. This repo's .env.example has
 * none — VITE_API_BASE_URL and VITE_API_PROXY_TARGET are both URLs, empty in
 * the example — so the set is empty. Add a value only when a new setting
 * really needs it; an open-ended token pattern would also accept keys like
 * `sk_live_abc123`.
 */
const ALLOWED_ENUM_VALUES = new Set([]);
const ALLOWED_BOOLEANS = new Set(['true', 'false', '0', '1']);
const ALLOWED_URL = /^(?:(?:https?|wss?):\/\/[^\s/?#]+[^\s]*|\/\S*)$/;

/** True for a URL (absolute or protocol-relative) whose authority carries `user[:password]@`. */
function hasUserinfo(value) {
  return /^(?:(?:https?|wss?):)?\/\/[^/?#\s]*@/.test(value);
}

/** Empty, a credential-free URL or relative path, a known enum value, or a boolean flag. */
function isAllowedValue(raw) {
  const value = raw.trim().replace(/^(['"])(.*)\1$/, '$2');
  if (value === '' || ALLOWED_ENUM_VALUES.has(value) || ALLOWED_BOOLEANS.has(value)) return true;
  return ALLOWED_URL.test(value) && !hasUserinfo(value);
}

// 1. No tracked .env* file other than .env.example, anywhere in the repository
//    (`:/` widens `git ls-files` from this app folder to the whole repo).
let tracked = [];
try {
  tracked = execFileSync('git', ['ls-files', '-z', '--', ':/'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', customRoot ? 'ignore' : 'inherit'],
  })
    .split('\0')
    .filter(Boolean);
} catch (error) {
  if (!customRoot) throw error;
}
for (const file of tracked) {
  const name = basename(file);
  if (name.startsWith('.env') && name !== '.env.example') {
    problems.push(`${file} is tracked by git; only .env.example may be committed.`);
  }
}

// 2. Every VITE_* value in .env.example is public-looking.
const examplePath = resolve(root, '.env.example');
if (existsSync(examplePath)) {
  readFileSync(examplePath, 'utf8')
    .split(/\r?\n/)
    .forEach((line, index) => {
      const match = /^\s*(?:export\s+)?(VITE_[A-Za-z0-9_]*)\s*=(.*)$/.exec(line);
      if (match && !isAllowedValue(match[2])) {
        problems.push(
          `.env.example:${index + 1}: ${match[1]} has a value that is not an empty value, a credential-free URL, a boolean or a known enum value.`,
        );
      }
    });
}

// 3. vite.config.ts `define` entries may only read VITE_* environment keys.
//    `define` inlines values into client code whatever their name, so it is
//    the one way an unprefixed server secret (e.g. CLOZR_ISSUE_KEY) can reach
//    the bundle.
const configPath = resolve(root, 'vite.config.ts');
if (existsSync(configPath)) {
  const source = readFileSync(configPath, 'utf8');
  const start = /\bdefine\s*:\s*\{/.exec(source);
  if (start) {
    let depth = 1;
    let i = start.index + start[0].length;
    const bodyStart = i;
    for (; i < source.length && depth > 0; i += 1) {
      if (source[i] === '{') depth += 1;
      else if (source[i] === '}') depth -= 1;
    }
    const body = source.slice(bodyStart, i - 1);
    const reads = body.matchAll(
      /\b(?:process\.env|env)\s*(?:\.\s*([A-Za-z_]\w*)|\[\s*['"]([^'"]+)['"]\s*\])/g,
    );
    // A whole-environment reference ships every value: bare `process.env`, or
    // `env` spread, used as a value (including shorthand `{ env }`), or passed
    // to JSON.stringify / Object.*. Passing `env` to a local helper is allowed.
    const wholeEnv =
      /\bprocess\.env\b(?!\s*[.[])/.test(body) ||
      /(?:\.\.\.\s*|:\s*|\b(?:JSON\.stringify|Object\.\w+)\(\s*)env\b(?!\s*[.[])/.test(body) ||
      /(?:^|[{,])\s*env\s*(?=[,}]|$)/.test(body);
    if (wholeEnv) {
      problems.push(
        'vite.config.ts define uses the whole environment object; read VITE_* keys one by one.',
      );
    }
    for (const read of reads) {
      const key = read[1] ?? read[2];
      if (!key.startsWith('VITE_')) {
        problems.push(`vite.config.ts define reads ${key}, which does not start with VITE_.`);
      }
    }
  }
}

// 4. `envPrefix` widens what Vite exposes to client code, and a third argument
//    to `loadEnv` widens what the config loads (`''` loads everything). Both
//    must stay at the default `VITE_`.
if (existsSync(configPath)) {
  // Comments are blanked first so prose that mentions `envPrefix` or `loadEnv(` is not parsed.
  const source = readFileSync(configPath, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|\s)\/\/[^\n]*/g, (m, lead) => lead + ' '.repeat(m.length - lead.length));
  /** Text of the balanced (...) / [...] / {...} group opening at `open`. */
  const balanced = (open) => {
    let depth = 0;
    let quote = null;
    for (let i = open; i < source.length; i += 1) {
      const ch = source[i];
      if (quote) {
        if (ch === '\\') i += 1;
        else if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'" || ch === '`') quote = ch;
      else if ('([{'.includes(ch)) depth += 1;
      else if (')]}'.includes(ch)) {
        depth -= 1;
        if (depth === 0) return source.slice(open + 1, i);
      }
    }
    return source.slice(open + 1);
  };
  /** Number of top-level, comma-separated arguments in `text`. */
  const countArgs = (text) => {
    let depth = 0;
    let quote = null;
    let count = text.trim() === '' ? 0 : 1;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (quote) {
        if (ch === '\\') i += 1;
        else if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'" || ch === '`') quote = ch;
      else if ('([{'.includes(ch)) depth += 1;
      else if (')]}'.includes(ch)) depth -= 1;
      else if (ch === ',' && depth === 0 && text.slice(i + 1).trim() !== '') count += 1;
    }
    return count;
  };

  for (const match of source.matchAll(/\benvPrefix\b(?!\s*[.[])\s*(:\s*)?/g)) {
    const rest = source.slice(match.index + match[0].length);
    let value = null;
    if (match[1]) {
      if (/^[[]/.test(rest)) value = balanced(match.index + match[0].length);
      else value = /^(['"`])[^'"`]*\1/.exec(rest)?.[0] ?? null;
    }
    const literals = value === null ? null : [...value.matchAll(/(['"`])([^'"`]*)\1/g)].map((m) => m[2]);
    const onlyLiterals = value !== null && value.replace(/(['"`])[^'"`]*\1|[\s,[\]]/g, '') === '';
    if (!onlyLiterals || literals.length === 0 || literals.some((l) => l !== 'VITE_')) {
      problems.push("vite.config.ts sets envPrefix to something other than 'VITE_'; any other prefix can expose server secrets to client code.");
    }
  }

  for (const match of source.matchAll(/\bloadEnv\s*\(/g)) {
    const args = balanced(match.index + match[0].length - 1);
    if (countArgs(args) > 2) {
      problems.push("vite.config.ts calls loadEnv with a third (prefix) argument; keep the default 'VITE_' prefix.");
    }
  }
}

if (problems.length > 0) {
  console.error('Env hygiene check failed:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log('Env hygiene check passed.');
