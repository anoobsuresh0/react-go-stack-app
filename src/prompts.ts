import { input, select, confirm } from '@inquirer/prompts';
import path from 'path';
import fs from 'fs';
import validatePackageName from 'validate-npm-package-name';

export type DatabaseMode = 'docker' | 'local';

export interface ProjectAnswers {
  projectName: string;
  projectPath: string;
  appTitle: string;
  dbName: string;
  database: DatabaseMode;
  useShadcn: boolean;
}

export interface CliFlags {
  db?: string;
  shadcn?: boolean;
  yes?: boolean;
}

function toTitleCase(str: string): string {
  return str
    .split(/[-_]/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function toSnakeCase(str: string): string {
  return str.replace(/-/g, '_');
}

function validateProjectName(name: string): string | true {
  if (!name.trim()) {
    return 'Project name is required';
  }
  const validation = validatePackageName(name);
  if (!validation.validForNewPackages) {
    return validation.errors?.[0] || validation.warnings?.[0] || 'Invalid project name';
  }
  if (fs.existsSync(path.join(process.cwd(), name))) {
    return `Directory "${name}" already exists`;
  }
  return true;
}

export async function runPrompts(
  providedName: string | undefined,
  flags: CliFlags = {}
): Promise<ProjectAnswers> {
  let projectName: string;
  if (providedName) {
    const result = validateProjectName(providedName);
    if (result !== true) {
      throw new Error(result);
    }
    projectName = providedName;
  } else {
    projectName = await input({
      message: 'Project name:',
      validate: validateProjectName,
    });
  }

  let database: DatabaseMode;
  if (flags.db === 'docker' || flags.db === 'local') {
    database = flags.db;
  } else if (flags.db) {
    throw new Error(`Invalid --db value "${flags.db}" (expected "docker" or "local")`);
  } else if (flags.yes) {
    database = 'docker';
  } else {
    database = await select<DatabaseMode>({
      message: 'Where should PostgreSQL 18 run?',
      choices: [
        {
          name: 'Docker (recommended — docker compose manages the database)',
          value: 'docker',
        },
        {
          name: 'Local (use a PostgreSQL installed on this machine)',
          value: 'local',
        },
      ],
    });
  }

  let useShadcn: boolean;
  if (typeof flags.shadcn === 'boolean') {
    useShadcn = flags.shadcn;
  } else if (flags.yes) {
    useShadcn = true;
  } else {
    useShadcn = await confirm({
      message: 'Include shadcn/ui components?',
      default: true,
    });
  }

  return {
    projectName,
    projectPath: path.join(process.cwd(), projectName),
    appTitle: toTitleCase(projectName),
    dbName: toSnakeCase(projectName),
    database,
    useShadcn,
  };
}
