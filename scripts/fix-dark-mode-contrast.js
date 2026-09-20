import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../src');

// Direct mappings for text colors when dark mode is enabled
// e.g. text-stone-900 -> text-stone-900 dark:text-slate-100
const TEXT_REPLACEMENTS = [
  // Hardcoded text-stone-900 without dark variant
  {
    regex: /\btext-stone-900(?!\s+dark:text-|\s+dark:text)/g,
    replacement: 'text-stone-900 dark:text-slate-100'
  },
  {
    regex: /\btext-stone-800(?!\s+dark:text-|\s+dark:text)/g,
    replacement: 'text-stone-800 dark:text-slate-200'
  },
  {
    regex: /\btext-stone-700(?!\s+dark:text-|\s+dark:text)/g,
    replacement: 'text-stone-700 dark:text-slate-300'
  },
  {
    regex: /\btext-slate-900(?!\s+dark:text-|\s+dark:text)/g,
    replacement: 'text-slate-900 dark:text-slate-100'
  },
  {
    regex: /\btext-slate-800(?!\s+dark:text-|\s+dark:text)/g,
    replacement: 'text-slate-800 dark:text-slate-200'
  },
  {
    regex: /\btext-slate-700(?!\s+dark:text-|\s+dark:text)/g,
    replacement: 'text-slate-700 dark:text-slate-300'
  },
  {
    regex: /\btext-gray-900(?!\s+dark:text-|\s+dark:text)/g,
    replacement: 'text-gray-900 dark:text-slate-100'
  },
  {
    regex: /\btext-gray-800(?!\s+dark:text-|\s+dark:text)/g,
    replacement: 'text-gray-800 dark:text-slate-200'
  },
  {
    regex: /\btext-gray-700(?!\s+dark:text-|\s+dark:text)/g,
    replacement: 'text-gray-700 dark:text-slate-300'
  }
];

let totalFilesModified = 0;
let totalFixesApplied = 0;

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      let fixesInFile = 0;

      for (const item of TEXT_REPLACEMENTS) {
        const matches = content.match(item.regex);
        if (matches) {
          content = content.replace(item.regex, item.replacement);
          modified = true;
          fixesInFile += matches.length;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        totalFilesModified++;
        totalFixesApplied += fixesInFile;
        console.log(`[FIXED] ${path.relative(rootDir, fullPath)}: ${fixesInFile} contrast fixes applied.`);
      }
    }
  }
}

console.log('=== Iniciar Varredura de Contraste Dark Mode (PRD Auto-Fix Agent) ===');
processDirectory(rootDir);
console.log(`\n=== Resumo do Auto-Fix ===`);
console.log(`Arquivos Modificados: ${totalFilesModified}`);
console.log(`Substituições de Contraste Aplicadas: ${totalFixesApplied}`);
