import { Command } from 'commander';
import chalk from 'chalk';
import { runPrompts } from './prompts.js';
import { createProject } from './template.js';
import { initGit } from './git.js';
import { printSuccess } from './utils.js';

const program = new Command();

program
  .name('react-go-stack-app')
  .description('Create a new full-stack Go + React + PostgreSQL application')
  .version('1.0.0')
  .argument('[project-name]', 'Name of the project')
  .option('--skip-git', 'Skip git initialization')
  .action(async (projectName: string | undefined, options: { skipGit?: boolean }) => {
    console.log(chalk.bold('\n  React Go Stack App\n'));
    console.log(chalk.dim('  Create a full-stack Go + React + PostgreSQL application\n'));

    try {
      const answers = await runPrompts(projectName);
      await createProject(answers);

      if (!options.skipGit) {
        await initGit(answers.projectPath);
      }

      printSuccess(answers);
    } catch (error) {
      if (error instanceof Error && error.message === 'USER_CANCELLED') {
        console.log(chalk.yellow('\n  Cancelled. No files were created.\n'));
        process.exit(0);
      }
      console.error(chalk.red('\n  Error:'), error);
      process.exit(1);
    }
  });

program.parse();
