import _ from 'lodash';
import Oss from 'ali-oss';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import prompt from 'prompt-promise';
import { exit } from './util';
import { OssBucketReadStream, OssObjectTableTransform, OssObjectEscapeTransform } from './oss-stream';

const DEFAULT_OPTIONS = {
	region: 'oss-cn-hangzhou',
	prefix: '',
	marker: ''
};

function run(client, { prefix, marker, outfile }) {
	const reader = new OssBucketReadStream(client, { marker, prefix });
	reader.pipe(new OssObjectTableTransform()).pipe(process.stdout);
	// if was passed `outfile` arguments
	// we shold write records to file
	if (outfile) {
		const ws = fs.createWriteStream(outfile);
		reader.pipe(new OssObjectEscapeTransform()).pipe(ws);
	}
	reader.on('error', async (e) => {
		reader.destroy();
		console.log(`${chalk.gray('Fetching fail')}: ${chalk.red.bold(e.message)}.`);
		const userInput = await prompt('Would like try it again?(yes/no)');
		if (!userInput || userInput.toLowerCase() === 'yes') {
			run(client, { prefix, marker, outfile });
		} else {
			exit();
		}
	});
	return reader;
}

export default function(bucket, options) {
	const config = _.merge({}, DEFAULT_OPTIONS, options);
	const { id, secret, region, prefix, marker, outfile } = config;

	let client;
	try {
		client = new Oss({
			region,
			accessKeyId: id,
			accessKeySecret: secret,
			bucket
		});
		run(client, { prefix, marker, outfile });
	} catch (e) {
		console.log(`${chalk.gray('Connection fail')}: ${chalk.red.bold(e.message)}.`);
		exit();
	}
};