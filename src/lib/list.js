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
	let target = process.stdout;
	reader.pipe(new OssObjectTableTransform()).pipe(target);
	// if was passed `outfile` arguments
	// we shold write records to file
	if (outfile) {
		target = fs.createWriteStream(outfile);
		reader.pipe(new OssObjectEscapeTransform()).pipe(target);
	}
	reader.on('error', async (e) => {
		// Once some error occurs, we should interrupt the reader
		// stream.
		reader.unpipe();
		const { message } = e;
		let tip = '';
		switch (true) {
			// Sometimes the connection will broken before the
			// tranformation is done cause by net risk.
			case /Unclosed root tag/.test(e):
				tip = 'Connection is broken before requst done.';
				break;
			default:
				tip = `Fetching fail: ${message}`;
		}
		if (process.env.NODE_ENV === 'development') {
			tip = `${tip}\n ${e.stack}`;
		}
		console.log(`${chalk.red(tip)}`);
		const userInput = await prompt('Would like try it again?(yes/no)\n');
		if (!userInput || userInput.toLowerCase() === 'yes') {
			const nextMarker = reader.marker;
			run(client, { prefix, marker: nextMarker, outfile });
		} else {
			exit(1);
		}
	});

	let counter = 0;
	reader.on('data', () => {
		counter++;
	});
	target.on('finish', () => {
		console.log(`Done with ${chalk.green(counter)} objects.`);
		exit(0);
	});
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
	} catch (e) {
		console.log(`${chalk.gray('Connection fail')}: ${chalk.red.bold(e.message)}.`);
		exit(1);
	}
	run(client, { prefix, marker, outfile });
};