import chalk from 'chalk';
import type { ProjectAnswers } from './prompts.js';

export function printSuccess(answers: ProjectAnswers): void {
  console.log('\n' + chalk.green('  Success!') + ' Created ' + chalk.cyan(answers.projectName) + '\n');

  console.log(chalk.dim('  Stack:'));
  console.log(chalk.dim('    Backend:      Go (Gin) + pgx'));
  console.log(chalk.dim(`    Frontend:     React + Vite + Tailwind${answers.useShadcn ? ' + shadcn/ui' : ''}`));
  console.log(chalk.dim(`    Database:     PostgreSQL 18 (${answers.database === 'docker' ? 'Docker' : 'local install'})\n`));

  console.log(chalk.bold('  Next steps:\n'));

  let step = 1;
  if (answers.database === 'docker') {
    console.log(chalk.cyan(`  ${step++}. Start the database (Docker):`));
    console.log(`     cd ${answers.projectName}`);
    console.log('     make docker-up\n');
  } else {
    console.log(chalk.cyan(`  ${step++}. Create the database (PostgreSQL 18 must be running):`));
    console.log(`     cd ${answers.projectName}`);
    console.log('     make db-create\n');
  }

  console.log(chalk.cyan(`  ${step++}. Start the backend (applies migrations, then serves):`));
  console.log('     make dev\n');

  console.log(chalk.cyan(`  ${step++}. Start the frontend (new terminal):`));
  console.log(`     cd ${answers.projectName}/web`);
  console.log('     npm install');
  console.log('     npm run dev\n');

  console.log(chalk.cyan(`  ${step}. Open your app:`));
  console.log('     http://localhost:5173\n');

  console.log(chalk.dim('  ─'.repeat(25)));
  console.log(chalk.dim('  Migrations run automatically when the backend starts.'));
  if (answers.useShadcn) {
    console.log(chalk.dim('  Add shadcn components: cd web && npx shadcn@latest add <component>'));
  }
  console.log(chalk.dim(`  Documentation: ${answers.projectName}/README.md\n`));
}
