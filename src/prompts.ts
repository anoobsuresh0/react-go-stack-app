import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import validatePackageName from 'validate-npm-package-name';

export interface ProjectAnswers {
  projectName: string;
  projectPath: string;
  description: string;
  appTitle: string;
  appAbbreviation: string;
  goFramework: 'gin' | 'stdlib';
  stateManagement: 'redux' | 'simple';
  useAuth: boolean;
  dockerEnv: 'local' | 'full';
  productionDomain: string;
  stagingDomain: string;
  dbName: string;
}

function toTitleCase(str: string): string {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getAbbreviation(str: string): string {
  const words = str.split(/[-_]/);
  if (words.length === 1) {
    return str.substring(0, 4).toUpperCase();
  }
  return words.map(w => w[0]).join('').toUpperCase().substring(0, 5);
}

function toSnakeCase(str: string): string {
  return str.replace(/-/g, '_');
}

export async function runPrompts(
  providedName?: string
): Promise<ProjectAnswers> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const questions: any[] = [];

  // 1. Project name
  if (!providedName) {
    questions.push({
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Project name is required';
        }
        const validation = validatePackageName(input);
        if (!validation.validForNewPackages) {
          return validation.errors?.[0] || 'Invalid project name';
        }
        if (fs.existsSync(path.join(process.cwd(), input))) {
          return `Directory "${input}" already exists`;
        }
        return true;
      },
    });
  }

  // 2. Project description
  questions.push({
    type: 'input',
    name: 'description',
    message: 'Project description:',
    default: 'A full-stack application built with Go and React',
  });

  // 3. App title
  questions.push({
    type: 'input',
    name: 'appTitle',
    message: 'Application title (displayed in UI):',
    default: (answers: Partial<ProjectAnswers>) =>
      toTitleCase(providedName || answers.projectName || 'My App'),
  });

  // 4. App abbreviation
  questions.push({
    type: 'input',
    name: 'appAbbreviation',
    message: 'App abbreviation (2-6 chars, shown in sidebar):',
    default: (answers: Partial<ProjectAnswers>) =>
      getAbbreviation(providedName || answers.projectName || 'APP'),
    validate: (input: string) =>
      input.length >= 2 && input.length <= 6 ? true : 'Must be 2-6 characters',
  });

  // 5. Go framework
  questions.push({
    type: 'list',
    name: 'goFramework',
    message: 'Go framework:',
    choices: [
      { name: 'Gin', value: 'gin' },
      { name: 'Standard Library (net/http)', value: 'stdlib' },
    ],
  });

  // 6. State management
  questions.push({
    type: 'list',
    name: 'stateManagement',
    message: 'State management:',
    choices: [
      { name: 'Redux Toolkit', value: 'redux' },
      { name: 'Simple (useState + API calls)', value: 'simple' },
    ],
  });

  // 7. Authentication
  questions.push({
    type: 'confirm',
    name: 'useAuth',
    message: 'Include Google OAuth authentication?',
    default: false,
  });

  // 8. Docker environment
  questions.push({
    type: 'list',
    name: 'dockerEnv',
    message: 'Docker environment:',
    choices: [
      { name: 'Local development only', value: 'local' },
      { name: 'Local + Staging + Production (with Traefik)', value: 'full' },
    ],
  });

  // 9. Production domain (only when dockerEnv === 'full')
  questions.push({
    type: 'input',
    name: 'productionDomain',
    message: 'Production domain (e.g., app.example.com):',
    default: 'app.example.com',
    when: (answers: Partial<ProjectAnswers>) => answers.dockerEnv === 'full',
  });

  // 10. Staging domain (only when dockerEnv === 'full')
  questions.push({
    type: 'input',
    name: 'stagingDomain',
    message: 'Staging domain:',
    default: (answers: Partial<ProjectAnswers>) =>
      answers.productionDomain?.replace(/^([^.]+)/, '$1-staging') || 'staging.example.com',
    when: (answers: Partial<ProjectAnswers>) => answers.dockerEnv === 'full',
  });

  // 11. Database name
  questions.push({
    type: 'input',
    name: 'dbName',
    message: 'Database name:',
    default: (answers: Partial<ProjectAnswers>) =>
      toSnakeCase(providedName || answers.projectName || 'my_app'),
  });

  const answers = await inquirer.prompt<Partial<ProjectAnswers>>(questions);
  const projectName = providedName || answers.projectName!;

  // Validate project name if provided via argument
  if (providedName) {
    const validation = validatePackageName(providedName);
    if (!validation.validForNewPackages) {
      throw new Error(`Invalid project name: ${validation.errors?.[0] || 'unknown error'}`);
    }
    if (fs.existsSync(path.join(process.cwd(), providedName))) {
      throw new Error(`Directory "${providedName}" already exists`);
    }
  }

  return {
    projectName,
    projectPath: path.join(process.cwd(), projectName),
    description: answers.description!,
    appTitle: answers.appTitle!,
    appAbbreviation: answers.appAbbreviation!,
    goFramework: answers.goFramework!,
    stateManagement: answers.stateManagement!,
    useAuth: answers.useAuth!,
    dockerEnv: answers.dockerEnv!,
    productionDomain: answers.dockerEnv === 'full' ? answers.productionDomain! : '',
    stagingDomain: answers.dockerEnv === 'full' ? answers.stagingDomain! : '',
    dbName: answers.dbName!,
  };
}
