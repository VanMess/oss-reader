import chalk from 'chalk';

export function exit(code = 0) {
	console.log('Thanks for using, have a good day.');
	process.exit(code);
}