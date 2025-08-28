#!/usr/bin/env node
import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

interface Flags {
  ai: boolean;
  json: boolean;
  out?: string;
  help: boolean;
  version: boolean;
}

interface PlanAndCode {
  plan: string[];
  code: string;
}

function parseArgs(argv: string[]): { flags: Flags; prompt: string } {
  const flags: Flags = { ai: false, json: false, help: false, version: false } as Flags;
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--ai') flags.ai = true;
    else if (arg === '--json') flags.json = true;
    else if (arg === '--help' || arg === '-h') flags.help = true;
    else if (arg === '--version' || arg === '-v') flags.version = true;
    else if (arg === '--out' && argv[i + 1] && !argv[i + 1].startsWith('--')) { flags.out = argv[++i]; }
    else if (arg.startsWith('--out=')) flags.out = arg.slice(6);
    else rest.push(arg);
  }
  return { flags, prompt: rest.join(' ').trim() };
}

function printHelp() {
  console.log(`\nTraycer-Lite — show a planning layer + final TypeScript code\n\n` +
`Usage:\n  traycer-lite [options] <prompt>\n\n` +
`Options:\n  --ai            Use Hugging Face (optional) if HUGGINGFACE_API_KEY is set\n  --json          Output raw JSON { plan: string[], code: string }\n  --out <file>    Save the generated code to a file\n  -h, --help      Show help\n  -v, --version   Show version\n\n` +
`Examples:\n  traycer-lite "write a function to reverse a string"\n  traycer-lite --out reverse.ts "reverse a string in TypeScript"\n  traycer-lite --ai "implement debounce(fn, wait)"\n`);
}

function guessType(prompt: string): 'function' | 'component' | 'script' | 'api' {
  const p = prompt.toLowerCase();
  if (
    /function/.test(p) ||
    /(check|compute|calculate|determine|find|prime|factorial|fibonacci|reverse)/.test(p)
  ) {
    return 'function';
  }
  if (/(react|component|jsx|tsx)/.test(p)) return 'component';
  if (/(endpoint|api|http|express|fetch)/.test(p)) return 'api';
  if (/(script|cli|command|utility)/.test(p)) return 'script';
  return 'function';
}

function toCamelCase(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('');
}

function guessName(prompt: string, type: ReturnType<typeof guessType>): string {
  const mFn = /function\s+([a-zA-Z_][a-zA-Z0-9_]*)/.exec(prompt);
  if (mFn) return mFn[1];
  const mName = /(?:called|named)\s+([a-zA-Z_][a-zA-Z0-9_]*)/.exec(prompt);
  if (mName) return mName[1];
  const base = toCamelCase(prompt).slice(0, 24) || (type === 'component' ? 'MyComponent' : 'doWork');
  if (/reverse/.test(prompt.toLowerCase())) return 'reverseString';
  if (/fibonacci|fib/.test(prompt.toLowerCase())) return 'fibonacci';
  if (/factorial/.test(prompt.toLowerCase())) return 'factorial';
  if (/debounce/.test(prompt.toLowerCase())) return 'debounce';
  if (/throttle/.test(prompt.toLowerCase())) return 'throttle';
  if (/prime/.test(prompt.toLowerCase())) return 'isPrime';
  return base;
}

function makePlan(prompt: string, type: ReturnType<typeof guessType>, name: string): string[] {
  const steps: string[] = [];
  steps.push(`Restate goal: ${prompt}`);
  steps.push('Identify inputs and outputs.');
  steps.push('List edge cases and constraints.');
  if (type === 'function') steps.push('Design function signature and return type.');
  if (type === 'component') steps.push('Sketch props and state; plan rendering.');
  if (type === 'api') steps.push('Define route, method, request/response schema, and errors.');
  if (type === 'script') steps.push('Define CLI flags, usage, and I/O.');
  steps.push('Outline algorithm in small steps.');
  steps.push('Write code with clear comments.');
  steps.push('Add basic tests or examples.');
  steps.push('Validate on edge cases.');
  return steps;
}

function codeTemplateFunction(name: string, prompt: string): string {
  const p = prompt.toLowerCase();
  if (/prime/.test(p)) {
    return `export function ${name}(n: number): boolean {\n  if (!Number.isInteger(n) || n < 2) return false;\n  for (let i = 2; i * i <= n; i++) {\n    if (n % i === 0) return false;\n  }\n  return true;\n}\n`;
  }
  if (/fibonacci|fib/.test(p)) {
    return `export function ${name}(n: number): number {\n  if (!Number.isInteger(n) || n < 0) throw new Error('n must be a non-negative integer');\n  if (n <= 1) return n;\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) {\n    const next = a + b;\n    a = b;\n    b = next;\n  }\n  return b;\n}\n`;
  }
  if (/factorial/.test(p)) {
    return `export function ${name}(n: number): number {\n  if (!Number.isInteger(n) || n < 0) throw new Error('n must be a non-negative integer');\n  let acc = 1;\n  for (let i = 2; i <= n; i++) acc *= i;\n  return acc;\n}\n`;
  }
  if (/reverse/.test(p) && /string/.test(p)) {
    return `export function ${name}(s: string): string {\n  return Array.from(s).reverse().join('');\n}\n`;
  }
  if (/debounce/.test(p)) {
    return `export function ${name}<T extends (...args: any[]) => any>(fn: T, wait: number) {\n  let t: NodeJS.Timeout | null = null;\n  return (...args: Parameters<T>) => {\n    if (t) clearTimeout(t);\n    t = setTimeout(() => fn(...args), wait);\n  };\n}\n`;
  }
  return `export function ${name}(/* params */): any {\n  throw new Error('Not implemented');\n}\n`;
}

function codeTemplateComponent(name: string, _prompt: string): string {
  return `import React, { useState } from 'react';\n\nexport function ${name}() {\n  const [value, setValue] = useState('');\n  return (\n    <div style={{ fontFamily: 'system-ui', padding: 12 }}>\n      <label>\n        <span>Value:</span>\n        <input value={value} onChange={e => setValue(e.target.value)} />\n      </label>\n      <pre>Current: {value}</pre>\n    </div>\n  );\n}\n`;
}

function codeTemplateAPI(name: string, _prompt: string): string {
  return `import http from 'node:http';\n\nconst server = http.createServer((req, res) => {\n  if (req.method === 'GET' && req.url === '/health') {\n    res.writeHead(200, { 'Content-Type': 'application/json' });\n    res.end(JSON.stringify({ ok: true }));\n    return;\n  }\n  res.writeHead(404);\n  res.end();\n});\n\nserver.listen(3000, () => {\n  console.log('API listening on http://localhost:3000');\n});\n`;
}

function codeTemplateScript(name: string, _prompt: string): string {
  return `#!/usr/bin/env node\nconst args = process.argv.slice(2);\nif (args.length === 0) {\n  console.log('Usage: my-cli <text>');\n  process.exit(1);\n}\nconsole.log('You said:', args.join(' '));\n`;
}

function makeOfflinePlanAndCode(prompt: string): PlanAndCode {
  const type = guessType(prompt);
  const name = guessName(prompt, type);
  const plan = makePlan(prompt, type, name);
  let code: string;
  switch (type) {
    case 'function': code = codeTemplateFunction(name, prompt); break;
    case 'component': code = codeTemplateComponent(name, prompt); break;
    case 'api': code = codeTemplateAPI(name, prompt); break;
    case 'script': code = codeTemplateScript(name, prompt); break;
  }
  return { plan, code };
}

async function maybeAIPlanAndCode(prompt: string): Promise<PlanAndCode | null> {
  try {
    if (!process.env.HUGGINGFACE_API_KEY) return null;
    const resp = await fetch(
      'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );
    const data: any = await resp.json();
    let text: string | null = null;
    if (Array.isArray(data) && data[0]?.generated_text) text = data[0].generated_text;
    else if (typeof data?.generated_text === 'string') text = data.generated_text;
    if (!text) return null;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.plan) || typeof parsed.code !== 'string') return null;
    return parsed as PlanAndCode;
  } catch {
    return null;
  }
}

async function main() {
  const { flags, prompt } = parseArgs(process.argv.slice(2));
  if (flags.version) { console.log('traycer-lite v0.1.0'); return; }
  if (flags.help || !prompt) { printHelp(); if (!prompt) process.exitCode = 1; return; }

  let result: PlanAndCode | null = null;
  if (flags.ai) result = await maybeAIPlanAndCode(prompt);
  if (!result) result = makeOfflinePlanAndCode(prompt);

  if (flags.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('Planning Layer');
    result.plan.forEach((s, i) => console.log(`${i + 1}. ${s}`));
    console.log('\nFinal Code');
    console.log(result.code);
  }

  if (flags.out) {
    const outPath = resolve(process.cwd(), flags.out);
    if (existsSync(outPath)) {
      console.warn(`File already exists: ${outPath} — overwriting.`);
    }
    writeFileSync(outPath, result.code, 'utf8');
    console.log(`Saved to ${outPath}`);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exitCode = 1;
});
