import { execSync } from 'child_process';
import ora from 'ora';

export async function initGit(projectPath: string): Promise<void> {
  const spinner = ora('Initializing git repository...').start();

  try {
    execSync('git init', { cwd: projectPath, stdio: 'ignore' });
    execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
    execSync('git commit -m "Initial commit from react-go-stack-app"', {
      cwd: projectPath,
      stdio: 'ignore',
    });
    spinner.succeed('Git repository initialized');
  } catch {
    spinner.warn('Could not initialize git repository (git may not be installed)');
  }
}
