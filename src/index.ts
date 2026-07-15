import { Command } from 'commander';
import chalk from 'chalk';
import { runPrompts } from './prompts.js';
import { createProject } from './template.js';
import { initGit } from './git.js';
import { printSuccess } from './utils.js';

interface CliOptions {
  db?: string;
  shadcn?: boolean;
  yes?: boolean;
  skipGit?: boolean;
}

const program = new Command();

program
  .name('react-go-stack-app')
  .description('Scaffold a production-ready Go + React (Vite) + PostgreSQL 18 application')
  .version('3.0.0')
  .argument('[project-name]', 'Name of the project')
  .option('--db <mode>', 'where PostgreSQL runs: "docker" or "local" (skips prompt)')
  .option('--shadcn', 'include shadcn/ui (skips prompt)')
  .option('--no-shadcn', 'skip shadcn/ui, plain Tailwind only (skips prompt)')
  .option('-y, --yes', 'accept defaults for unanswered prompts (Docker DB + shadcn/ui)')
  .option('--skip-git', 'skip git initialization')
  .action(async (projectName: string | undefined, options: CliOptions) => {
    console.log(chalk.bold('\n  React Go Stack App\n'));
    console.log(chalk.dim('  Go (Gin) · React + Vite + Tailwind · PostgreSQL 18\n'));

    try {
      const answers = await runPrompts(projectName, {
        db: options.db,
        shadcn: options.shadcn,
        yes: options.yes,
      });
      await createProject(answers);

      if (!options.skipGit) {
        await initGit(answers.projectPath);
      }

      printSuccess(answers);
    } catch (error) {
      if (error instanceof Error && error.name === 'ExitPromptError') {
        console.log(chalk.yellow('\n  Cancelled. No files were created.\n'));
        process.exit(0);
      }
      console.error(chalk.red('\n  Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
