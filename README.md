# Traycer-Lite

A lightweight CLI tool that generates **planning steps** and **final TypeScript code** from natural language prompts.  
It can run fully **offline** with built-in templates, or optionally use the **Hugging Face Inference API** for AI-powered code generation.

---

## Features

- ✨ Generates **step-by-step planning layers** before writing code  
- 🛠️ Produces clean **TypeScript functions, components, APIs, or scripts**  
- 📦 Works offline with built-in templates (no API key required)  
- 🤖 Optional Hugging Face integration for AI-powered completions  
- 💾 Save generated code directly to a file  

---

## Installation

Clone and install dependencies:

```bash
git clone https://github.com/your-username/traycer-lite.git
cd traycer-lite
npm install
```

---

## Usage

Run the CLI with a natural language prompt:

```bash
npm run start -- "write a function to reverse a string"
```

Save output directly to a file:

```bash
npm run start -- --out reverse.ts "reverse a string in TypeScript"
```

Use AI mode (requires Hugging Face API key):

```bash
npm run start -- --ai "implement debounce(fn, wait)"
```

Run directly with `ts-node` (no build step required):

```bash
npx ts-node src/index.ts "write a function to check prime numbers"
```

---

## API Setup (Optional AI Mode)

1. Create a Hugging Face account: [https://huggingface.co/join](https://huggingface.co/join)  
2. Generate an API token from your profile settings  
3. Create a `.env` file in the project root:

   ```env
   HUGGINGFACE_API_KEY=your_key_here
   ```

4. Run the CLI with `--ai` to use Hugging Face models:

   ```bash
   npm start -- --ai "write a function to calculate factorial"
   ```

---

## Development

Build the project:

```bash
npm run build
```

Run the compiled CLI:

```bash
npm start -- "write a function to reverse a string"
```

Or run directly with `ts-node`:

```bash
npx ts-node src/index.ts --out myFunc.ts "reverse a string"
```

---

## Example Output

```bash
npm run start -- "write a function to check prime numbers"
```

**Planning Layer**
```
1. Restate goal: write a function to check prime numbers
2. Identify inputs and outputs
3. List edge cases and constraints
4. Design function signature and return type
5. Outline algorithm in small steps
6. Write code with clear comments
7. Add basic tests or examples
8. Validate on edge cases
```

**Final Code**
```ts
export function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}
```
