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
  // Check if it's a dotfile that should be processed
  if (filename === '.env.example' || filename === '.gitignore') {
    return true;
  }
  return TEMPLATE_EXTENSIONS.some(ext => filename.endsWith(ext));
}

async function processFile(filePath: string, placeholders: Placeholders): Promise<void> {
  let content = await fs.readFile(filePath, 'utf-8');

  for (const [placeholder, value] of Object.entries(placeholders)) {
    content = content.split(placeholder).join(value);
  }

  await fs.writeFile(filePath, content);
}

async function processDirectory(
  dirPath: string,
  placeholders: Placeholders
): Promise<void> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!SKIP_DIRS.includes(entry.name)) {
        await processDirectory(fullPath, placeholders);
      }
    } else if (shouldProcessFile(entry.name)) {
      await processFile(fullPath, placeholders);
    }
  }
}

async function removeMigrations(projectPath: string): Promise<void> {
  // Remove migrations folder
  const migrationsPath = path.join(projectPath, 'backend/internal/database/migrations');
  if (await fs.pathExists(migrationsPath)) {
    await fs.remove(migrationsPath);
  }

  // Remove migrations.go
  const migrationsGoPath = path.join(projectPath, 'backend/internal/database/migrations.go');
  if (await fs.pathExists(migrationsGoPath)) {
    await fs.remove(migrationsGoPath);
  }
}

export async function createProject(answers: ProjectAnswers): Promise<void> {
  const spinner = ora('Creating project structure...').start();

  try {
    // Find the template directory
    // When running from dist/, template is at ../template
    // When running from src/, template is at ../../template
    let templatePath = path.join(__dirname, '..', 'template');
    if (!await fs.pathExists(templatePath)) {
      templatePath = path.join(__dirname, '..', '..', 'template');
    }

    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Template not found at ${templatePath}`);
    }

    // Copy template
    spinner.text = 'Copying template files...';
    await fs.copy(templatePath, answers.projectPath);

    // Build placeholder map
    spinner.text = 'Processing template files...';
    const placeholders = buildPlaceholders(answers);

    // Process all files
    await processDirectory(answers.projectPath, placeholders);

    // Remove migrations (user will manage schema separately)
    spinner.text = 'Configuring database...';
    await removeMigrations(answers.projectPath);

    // Rename _gitignore to .gitignore (npm doesn't include .gitignore files)
    const gitignorePath = path.join(answers.projectPath, '_gitignore');
    if (await fs.pathExists(gitignorePath)) {
      await fs.rename(gitignorePath, path.join(answers.projectPath, '.gitignore'));
    }

    // Same for backend and frontend
    const backendGitignore = path.join(answers.projectPath, 'backend', '_gitignore');
    if (await fs.pathExists(backendGitignore)) {
      await fs.rename(backendGitignore, path.join(answers.projectPath, 'backend', '.gitignore'));
    }

    const frontendGitignore = path.join(answers.projectPath, 'frontend', '_gitignore');
    if (await fs.pathExists(frontendGitignore)) {
      await fs.rename(frontendGitignore, path.join(answers.projectPath, 'frontend', '.gitignore'));
    }

    spinner.succeed('Project created successfully!');
  } catch (error) {
    spinner.fail('Failed to create project');
    throw error;
  }
}
