import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import prompt from 'prompt-promise';

export function exit(code = 0) {
	console.log('Thanks for using, have a good day.');
	process.exit(code);
}
async function stat(file) {
	return new Promise((resolve, reject) => {
		fs.stat(file, (err, stats) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(stats);
		});
	})
}

async function detectDirIsExist(file) {
	const dir = path.dirname(file);
	try {
		const stats = await stat(dir);
		return stats.isDirectory();
	} catch (e) {
		return false;
	}
}

export async function detectFileWritable(file) {
	try {
		const stats = await stat(file);
		if (stats.isFile() === false) {
			console.log(`${chalk.red(`"${file}" should be a file!`)}`);
			return false;
		} else if (stats.size > 0) {
			// Alarm if is no empty.
			const allowOverWrite = await prompt(`\nThe "${chalk.red(file)}" is not empty, and it would be overwrite if continue, are you sure?(yes/no)\n`);
			if (!allowOverWrite || allowOverWrite.toLowerCase() === 'yes') {
				return true;
			} else {
				return false;
			}
		}
		return true;
	} catch (e) {
		if (e.code === 'ENOENT') {
			const exist = await detectDirIsExist(file);
			if (exist) {
				return true;
			}
			console.log(chalk.red(`File path: "${file}" is not exist.`));
			return false;
		}
		console.log(`${chalk.red(e.message)}`);
		return false;
	}
}

export function error(e) {
	let tip;
	if (e instanceof Error) {
		const { message, stack } = e;
		tip = `${message}`;
		if (process.env.NODE_ENV === 'development') {
			tip = tip + `\n${stack}`;
		}
	} else {
		tip = e;
	}
	console.log(chalk.red(e));
}