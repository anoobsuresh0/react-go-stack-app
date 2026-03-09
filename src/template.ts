import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import ora from 'ora';
import type { ProjectAnswers } from './prompts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files that should be processed for placeholder replacement
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
  '.env.example',
  '.mod',
];

// Directories to skip
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '.next'];

interface Placeholders {
  [key: string]: string;
}

function buildPlaceholders(answers: ProjectAnswers): Placeholders {
  const snakeCase = answers.projectName.replace(/-/g, '_');
  const pascalCase = answers.projectName
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');

  return {
    '{{PROJECT_NAME}}': answers.projectName,
    '{{PROJECT_NAME_SNAKE}}': snakeCase,
    '{{PROJECT_NAME_PASCAL}}': pascalCase,
    '{{APP_TITLE}}': answers.appTitle,
    '{{APP_ABBREVIATION}}': answers.appAbbreviation,
    '{{DESCRIPTION}}': answers.description,
    '{{PRODUCTION_DOMAIN}}': answers.productionDomain,
    '{{STAGING_DOMAIN}}': answers.stagingDomain,
    '{{DB_NAME}}': answers.dbName,
  };
}

function shouldProcessFile(filename: string): boolean {
  // Check if it's a special file that should be processed
  if (filename === '.env.example' || filename === '.gitignore' || filename === 'Makefile' || filename === 'Dockerfile') {
    return true;
  }
  return TEMPLATE_EXTENSIONS.some(ext => filename.endsWith(ext));
}

function processMarkers(content: string, answers: ProjectAnswers): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let skipBlock = false;

  for (const line of lines) {
    // Block markers - check for START/END patterns
    if (line.includes('{{AUTH_BLOCK_START}}')) {
      if (!answers.useAuth) skipBlock = true;
      continue; // Always remove the marker line itself
    }
    if (line.includes('{{AUTH_BLOCK_END}}')) {
      skipBlock = false;
      continue;
    }
    if (line.includes('{{REDUX_BLOCK_START}}')) {
      if (answers.stateManagement !== 'redux') skipBlock = true;
      continue;
    }
    if (line.includes('{{REDUX_BLOCK_END}}')) {
      skipBlock = false;
      continue;
    }
    if (line.includes('{{NOAUTH_BLOCK_START}}')) {
      if (answers.useAuth) skipBlock = true;
      continue;
    }
    if (line.includes('{{NOAUTH_BLOCK_END}}')) {
      skipBlock = false;
      continue;
    }
    if (line.includes('{{NOREDUX_BLOCK_START}}')) {
      if (answers.stateManagement === 'redux') skipBlock = true;
      continue;
    }
    if (line.includes('{{NOREDUX_BLOCK_END}}')) {
      skipBlock = false;
      continue;
    }
    if (line.includes('{{FULL_DOCKER_BLOCK_START}}')) {
      if (answers.dockerEnv !== 'full') skipBlock = true;
      continue;
    }
    if (line.includes('{{FULL_DOCKER_BLOCK_END}}')) {
      skipBlock = false;
      continue;
    }

    if (skipBlock) continue;

    // Line markers - strip entire line if condition not met, remove marker text if met
    if (line.includes('{{GIN_ONLY}}')) {
      if (answers.goFramework === 'gin') {
        result.push(line.replace(/\s*(?:\/\/|#)\s*\{\{GIN_ONLY\}\}/, ''));
      }
      continue;
    }
    if (line.includes('{{STDLIB_ONLY}}')) {
      if (answers.goFramework === 'stdlib') {
        result.push(line.replace(/\s*(?:\/\/|#)\s*\{\{STDLIB_ONLY\}\}/, ''));
      }
      continue;
    }
    if (line.includes('{{AUTH_ONLY}}')) {
      if (answers.useAuth) {
        result.push(line.replace(/\s*(?:\/\/|#)\s*\{\{AUTH_ONLY\}\}/, ''));
      }
      continue;
    }
    if (line.includes('{{REDUX_ONLY}}')) {
      if (answers.stateManagement === 'redux') {
        result.push(line.replace(/\s*(?:\/\/|#)\s*\{\{REDUX_ONLY\}\}/, ''));
      }
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

async function processFile(
  filePath: string,
  placeholders: Placeholders,
  answers: ProjectAnswers
): Promise<void> {
  let content = await fs.readFile(filePath, 'utf-8');

  for (const [placeholder, value] of Object.entries(placeholders)) {
    content = content.split(placeholder).join(value);
  }

  content = processMarkers(content, answers);

  await fs.writeFile(filePath, content);
}

async function processDirectory(
  dirPath: string,
  placeholders: Placeholders,
  answers: ProjectAnswers
): Promise<void> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!SKIP_DIRS.includes(entry.name)) {
        await processDirectory(fullPath, placeholders, answers);
      }
    } else if (shouldProcessFile(entry.name)) {
      await processFile(fullPath, placeholders, answers);
    }
  }
}

async function removeIfExists(filePath: string): Promise<void> {
  if (await fs.pathExists(filePath)) {
    await fs.remove(filePath);
  }
}

async function handleVariants(projectPath: string, answers: ProjectAnswers): Promise<void> {
  await walkAndHandleVariants(projectPath, answers);
}

async function walkAndHandleVariants(dirPath: string, answers: ProjectAnswers): Promise<void> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!SKIP_DIRS.includes(entry.name)) {
        await walkAndHandleVariants(fullPath, answers);
      }
      continue;
    }

    const name = entry.name;

    // Framework variants: -gin vs -stdlib
    if (name.includes('-gin.') || name.includes('-gin-')) {
      if (answers.goFramework === 'gin') {
        const newName = name.replace(/-gin/, '');
        await fs.rename(fullPath, path.join(dirPath, newName));
      } else {
        await fs.remove(fullPath);
      }
      continue;
    }
    if (name.includes('-stdlib.') || name.includes('-stdlib-')) {
      if (answers.goFramework === 'stdlib') {
        const newName = name.replace(/-stdlib/, '');
        await fs.rename(fullPath, path.join(dirPath, newName));
      } else {
        await fs.remove(fullPath);
      }
      continue;
    }

    // State management variants: -redux vs -simple
    if (name.includes('-redux.') || name.includes('-redux-')) {
      if (answers.stateManagement === 'redux') {
        const newName = name.replace(/-redux/, '');
        await fs.rename(fullPath, path.join(dirPath, newName));
      } else {
        await fs.remove(fullPath);
      }
      continue;
    }
    if (name.includes('-simple.') || name.includes('-simple-')) {
      if (answers.stateManagement === 'simple') {
        const newName = name.replace(/-simple/, '');
        await fs.rename(fullPath, path.join(dirPath, newName));
      } else {
        await fs.remove(fullPath);
      }
      continue;
    }
  }
}

async function handleConditionals(projectPath: string, answers: ProjectAnswers): Promise<void> {
  if (!answers.useAuth) {
    await removeIfExists(path.join(projectPath, 'internal/handlers/auth.go'));
    await removeIfExists(path.join(projectPath, 'internal/middleware/auth.go'));
    await removeIfExists(path.join(projectPath, 'internal/models/user.go'));
    await removeIfExists(path.join(projectPath, 'internal/repository/auth.go'));
    await removeIfExists(path.join(projectPath, 'migrations/000002_create_users_sessions.up.sql'));
    await removeIfExists(path.join(projectPath, 'migrations/000002_create_users_sessions.down.sql'));
    await removeIfExists(path.join(projectPath, 'web/src/features/auth'));
  }

  if (answers.stateManagement !== 'redux') {
    await removeIfExists(path.join(projectPath, 'web/src/app'));
    // Remove redux dependencies from package.json
    const pkgPath = path.join(projectPath, 'web', 'package.json');
    if (await fs.pathExists(pkgPath)) {
      const pkg = await fs.readJson(pkgPath);
      delete pkg.dependencies['@reduxjs/toolkit'];
      delete pkg.dependencies['react-redux'];
      await fs.writeJson(pkgPath, pkg, { spaces: 2 });
    }
  }

  if (answers.dockerEnv !== 'full') {
    await removeIfExists(path.join(projectPath, 'docker-compose.staging.yml'));
    await removeIfExists(path.join(projectPath, 'docker-compose.prod.yml'));
    await removeIfExists(path.join(projectPath, 'docker-compose.traefik.yml'));
    await removeIfExists(path.join(projectPath, 'traefik'));
  }
}

export async function createProject(answers: ProjectAnswers): Promise<void> {
  const spinner = ora('Creating project structure...').start();

  try {
    // 1. Find and copy template directory
    let templatePath = path.join(__dirname, '..', 'template');
    if (!await fs.pathExists(templatePath)) {
      templatePath = path.join(__dirname, '..', '..', 'template');
    }

    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Template not found at ${templatePath}`);
    }

    spinner.text = 'Copying template files...';
    await fs.copy(templatePath, answers.projectPath);

    // 2. Process placeholders in all files
    spinner.text = 'Processing template files...';
    const placeholders = buildPlaceholders(answers);
    await processDirectory(answers.projectPath, placeholders, answers);

    // 3. Markers are processed as part of processDirectory (step 2)
    // processMarkers is called inside processFile

    // 4. Handle variant file renaming/deletion
    spinner.text = 'Handling variant files...';
    await handleVariants(answers.projectPath, answers);

    // 5. Handle conditional file removal
    spinner.text = 'Removing unused files...';
    await handleConditionals(answers.projectPath, answers);

    // 6. Rename _gitignore to .gitignore (npm doesn't include .gitignore files)
    const rootGitignore = path.join(answers.projectPath, '_gitignore');
    if (await fs.pathExists(rootGitignore)) {
      await fs.rename(rootGitignore, path.join(answers.projectPath, '.gitignore'));
    }

    const webGitignore = path.join(answers.projectPath, 'web', '_gitignore');
    if (await fs.pathExists(webGitignore)) {
      await fs.rename(webGitignore, path.join(answers.projectPath, 'web', '.gitignore'));
    }

    spinner.succeed('Project created successfully!');
  } catch (error) {
    spinner.fail('Failed to create project');
    throw error;
  }
}
