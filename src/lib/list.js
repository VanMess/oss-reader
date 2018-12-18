import _ from 'lodash';
import Oss from 'ali-oss';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import prompt from 'prompt-promise';
import { exit, detectFileWritable, error } from './util';
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
		let error;
		switch (true) {
			// Sometimes the connection will broken before the
			// tranformation is done cause by net risk.
			case /Unclosed root tag/.test(e):
				error = new Error('Connection is broken before requst done.');
				break;
			default:
				error = new Error(`Fetching fail: ${message}`);
				break;
		}
		error(error);
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
		console.log(`\nDone with ${chalk.green(counter)} objects.\n`);
		exit(0);
	});
}

async function detectFileArg(file) {
	// If outfile is't be indicated,
	// just print things to console.
	if (_.isNil(file)) {
		return true;
	}
	// In case white char sequence like ' '.
	if (_.isString(file) && /^\s?$/.test(file)) {
		error('The "outfile" argument should not be empty.');
		return false;
	}
	return detectFileWritable(file);
}

function createOssClient(bucket, { id, secret, region }) {
	try {
		return new Oss({
			region,
			accessKeyId: id,
			accessKeySecret: secret,
			bucket
		});
	} catch (e) {
		error(new Error(`${chalk.gray('Connection fail')}: ${chalk.red.bold(e.message)}.`));
		exit(1);
	}
}

export default async function(bucket, options) {
	const config = _.merge({}, DEFAULT_OPTIONS, options);
	const { id, secret, region, prefix, marker, outfile } = config;
	const isFileValid = await detectFileArg(outfile);
	if (isFileValid) {
		const client = createOssClient(bucket, { id, secret, region });
		run(client, { prefix, marker, outfile });
	} else {
		exit(1);
	}
};