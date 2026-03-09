import chalk from 'chalk';
import type { ProjectAnswers } from './prompts.js';

export function printSuccess(answers: ProjectAnswers): void {
  console.log('\n' + chalk.green('  Success!') + ' Created ' + chalk.cyan(answers.projectName) + '\n');

  console.log(chalk.dim('  Stack:'));
  console.log(chalk.dim(`    Go Framework:       ${answers.goFramework === 'gin' ? 'Gin' : 'Standard Library (net/http)'}`));
  console.log(chalk.dim(`    State Management:   ${answers.stateManagement === 'redux' ? 'Redux Toolkit' : 'Simple (useState)'}`));
  console.log(chalk.dim(`    Authentication:     ${answers.useAuth ? 'Google OAuth' : 'None'}`));
  console.log(chalk.dim(`    Docker:             ${answers.dockerEnv === 'full' ? 'Local + Staging + Production' : 'Local only'}\n`));

  console.log(chalk.bold('  Next steps:\n'));

  console.log(chalk.cyan('  1. Start the development servers:'));
  console.log(chalk.dim('     # Terminal 1: Start database + backend'));
  console.log(`     cd ${answers.projectName}`);
  console.log('     cp .env.example .env');
  console.log('     docker compose up\n');

  console.log(chalk.dim('     # Terminal 2: Start frontend'));
  console.log(`     cd ${answers.projectName}/web`);
  console.log('     npm install');
  console.log('     npm run dev\n');

  console.log(chalk.cyan('  2. Initialize Go modules:'));
  console.log(`     cd ${answers.projectName}`);
  console.log('     go mod tidy\n');

  console.log(chalk.cyan('  3. Open your app:'));
  console.log('     http://localhost:5173\n');

  console.log(chalk.dim('  ─'.repeat(25)));
  console.log(chalk.dim('  Database migrations run automatically on startup.'));
  console.log(chalk.dim('  Add shadcn components: cd web && npx shadcn@latest add <component>'));
  console.log(chalk.dim(`  Documentation: ${answers.projectName}/README.md\n`));
}
