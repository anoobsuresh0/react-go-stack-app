import chalk from 'chalk';
import type { ProjectAnswers } from './prompts.js';

export function printSuccess(answers: ProjectAnswers): void {
  console.log('\n' + chalk.green('  Success!') + ' Created ' + chalk.cyan(answers.projectName) + '\n');

  console.log(chalk.dim('  Includes: Counter example with React + Go + PostgreSQL\n'));

  console.log(chalk.bold('  Next steps:\n'));

  let step = 1;

  console.log(chalk.cyan(`  ${step}. Start the development servers:`));
  console.log(chalk.dim('     # Terminal 1: Start database + backend'));
  console.log(`     cd ${answers.projectName}/backend`);
  console.log('     cp .env.example .env');
  console.log('     docker compose -f local.yml up\n');

  console.log(chalk.dim('     # Terminal 2: Start frontend'));
  console.log(`     cd ${answers.projectName}/frontend`);
  console.log('     npm install');
  console.log('     npm run dev\n');
  step++;

  console.log(chalk.cyan(`  ${step}. Open your app:`));
  console.log('     http://localhost:5173\n');

  console.log(chalk.dim('  ─'.repeat(25)));
  console.log(chalk.dim('  Database tables are created automatically on first startup.'));
  console.log(chalk.dim(`  Documentation: ${answers.projectName}/README.md`));
  console.log(chalk.dim(`  Claude AI instructions: ${answers.projectName}/CLAUDE.md\n`));
}
