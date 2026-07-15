import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import ora from 'ora';
import type { ProjectAnswers } from './prompts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files that should be processed for placeholder/marker replacement
const TEMPLATE_EXTENSIONS = [
  '.go',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.yml',
  '.yaml',
  '.md',
  '.sql',
  '.sh',
  '.html',
  '.css',
  '.mod',
];

const SPECIAL_FILES = ['.env.example', '_gitignore', 'Makefile'];

// Dependencies that only exist to support shadcn/ui
const SHADCN_DEPENDENCIES = [
  '@radix-ui/react-slot',
  'class-variance-authority',
  'clsx',
  'lucide-react',
  'tailwind-merge',
];

type Condition = (answers: ProjectAnswers) => boolean;

// Conditional markers: {{<NAME>_BLOCK_START}}/{{<NAME>_BLOCK_END}} keep or drop
// whole blocks, {{<NAME>_ONLY}} keeps or drops single lines.
const CONDITIONS: Record<string, Condition> = {
  SHADCN: a => a.useShadcn,
  NOSHADCN: a => !a.useShadcn,
  DOCKER_DB: a => a.database === 'docker',
  LOCAL_DB: a => a.database === 'local',
};

const BLOCK_START = /\{\{([A-Z_]+)_BLOCK_START\}\}/;
const BLOCK_END = /\{\{([A-Z_]+)_BLOCK_END\}\}/;
const LINE_ONLY = /\{\{([A-Z_]+)_ONLY\}\}/;
// Strips the marker comment itself from a kept line: `// {{X_ONLY}}`,
// `# {{X_ONLY}}` or `/* {{X_ONLY}} */`
const LINE_MARKER_COMMENT = /\s*(?:\/\/|#|\/\*)\s*\{\{[A-Z_]+_ONLY\}\}\s*(?:\*\/)?\s*$/;

function buildPlaceholders(answers: ProjectAnswers): Record<string, string> {
  return {
    '{{PROJECT_NAME}}': answers.projectName,
    '{{PROJECT_NAME_SNAKE}}': answers.projectName.replace(/-/g, '_'),
    '{{APP_TITLE}}': answers.appTitle,
    '{{DB_NAME}}': answers.dbName,
  };
}

function shouldProcessFile(filename: string): boolean {
  if (SPECIAL_FILES.includes(filename)) {
    return true;
  }
  return TEMPLATE_EXTENSIONS.some(ext => filename.endsWith(ext));
}

function resolveCondition(name: string, answers: ProjectAnswers): boolean {
  const condition = CONDITIONS[name];
  if (!condition) {
    throw new Error(`Unknown template marker condition: ${name}`);
  }
  return condition(answers);
}

function processMarkers(content: string, answers: ProjectAnswers): string {
  const result: string[] = [];
  let skipDepth = 0;

  for (const line of content.split('\n')) {
    const start = line.match(BLOCK_START);
    if (start) {
      if (skipDepth > 0 || !resolveCondition(start[1], answers)) skipDepth++;
      continue;
    }
    const end = line.match(BLOCK_END);
    if (end) {
      if (skipDepth > 0) skipDepth--;
      continue;
    }
    if (skipDepth > 0) continue;

    const only = line.match(LINE_ONLY);
    if (only) {
      if (resolveCondition(only[1], answers)) {
        result.push(line.replace(LINE_MARKER_COMMENT, ''));
      }
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

async function processFile(filePath: string, placeholders: Record<string, string>, answers: ProjectAnswers): Promise<void> {
  let content = await fs.readFile(filePath, 'utf-8');

  for (const [placeholder, value] of Object.entries(placeholders)) {
    content = content.split(placeholder).join(value);
  }
  content = processMarkers(content, answers);

  await fs.writeFile(filePath, content);
}

// Template-relative paths that are only copied for certain answers
function buildExcludes(answers: ProjectAnswers): string[] {
  const excludes: string[] = [];

  if (answers.database === 'local') {
    excludes.push('docker-compose.yml');
  }

  if (answers.useShadcn) {
    excludes.push('web/src/features/counter/Counter-plain.tsx');
  } else {
    excludes.push(
      'web/components.json',
      'web/src/components/ui',
      'web/src/lib/utils.ts',
      'web/src/features/counter/Counter-shadcn.tsx'
    );
  }

  return excludes;
}

// Renames applied after copy (npm strips .gitignore from packages; variant
// files carry a suffix so both flavors can live in the template)
const RENAMES: Array<[string, string]> = [
  ['_gitignore', '.gitignore'],
  ['web/_gitignore', 'web/.gitignore'],
  ['web/src/features/counter/Counter-shadcn.tsx', 'web/src/features/counter/Counter.tsx'],
  ['web/src/features/counter/Counter-plain.tsx', 'web/src/features/counter/Counter.tsx'],
];

async function collectFiles(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async entry => {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        return collectFiles(fullPath);
      }
      return shouldProcessFile(entry.name) ? [fullPath] : [];
    })
  );
  return nested.flat();
}

async function pruneShadcnDependencies(projectPath: string): Promise<void> {
  const pkgPath = path.join(projectPath, 'web', 'package.json');
  const pkg = await fs.readJson(pkgPath);
  for (const dep of SHADCN_DEPENDENCIES) {
    delete pkg.dependencies?.[dep];
  }
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  await fs.appendFile(pkgPath, '\n');
}

export async function createProject(answers: ProjectAnswers): Promise<void> {
  const spinner = ora('Creating project...').start();

  try {
    let templatePath = path.join(__dirname, '..', 'template');
    if (!await fs.pathExists(templatePath)) {
      templatePath = path.join(__dirname, '..', '..', 'template');
    }
    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Template not found at ${templatePath}`);
    }

    // 1. Copy the template, skipping files the chosen options don't need
    spinner.text = 'Copying template files...';
    const excludes = buildExcludes(answers).map(p => path.join(templatePath, p));
    await fs.copy(templatePath, answers.projectPath, {
      filter: src => !excludes.includes(src),
    });

    // 2. Rename special/variant files to their final names
    for (const [from, to] of RENAMES) {
      const fromPath = path.join(answers.projectPath, from);
      if (await fs.pathExists(fromPath)) {
        await fs.rename(fromPath, path.join(answers.projectPath, to));
      }
    }

    // 3. Replace placeholders and resolve conditional markers in parallel
    spinner.text = 'Processing template files...';
    const placeholders = buildPlaceholders(answers);
    const files = await collectFiles(answers.projectPath);
    await Promise.all(files.map(file => processFile(file, placeholders, answers)));

    // 4. shadcn-only npm dependencies are pruned programmatically since JSON
    //    can't carry comment markers
    if (!answers.useShadcn) {
      await pruneShadcnDependencies(answers.projectPath);
    }

    spinner.succeed('Project created!');
  } catch (error) {
    spinner.fail('Failed to create project');
    throw error;
  }
}
