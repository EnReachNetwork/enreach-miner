import { Command } from 'commander';
import chalk from 'chalk';

export function registerHelloCommand(program: Command) {
    program
        .command('hello')
        .description('Say hello')
        .option('-n, --name <name>', 'name to say hello to')
        .action(async (options) => {
            const name = options.name || 'world';
            console.log(chalk.green(`Hello, ${name}!`));
        });
}
