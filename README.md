# Traycer-Lite

Traycer-Lite is a lightweight CLI tool that generates a planning layer and TypeScript code based on prompts.

## Features
- Offline code generation (no API required)
- Optional AI integration with Hugging Face
- Supports functions, components, APIs, and scripts
- Save output directly to files

## Usage
\`\`\`bash
traycer-lite \"write a function to reverse a string\"
traycer-lite --out reverse.ts \"reverse a string in TypeScript\"
traycer-lite --ai \"implement debounce(fn, wait)\"
\`\`\`

## Development
Clone the repo and run:
\`\`\`bash
npm install
npm run build
npm start
\`\`\`
