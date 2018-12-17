import _ from 'lodash';
import Oss from 'ali-oss';
import path from 'path';
import fs from 'fs';
import { OssBucketReadStream, OssObjectTableTransform, OssObjectEscapeTransform } from './oss-stream';

const DEFAULT_OPTIONS = {
	region: 'oss-cn-hangzhou',
	prefix: '',
	marker: ''
};

export default function(bucket, options) {
	const config = _.merge({}, DEFAULT_OPTIONS, options);
	const { id, secret, region, prefix, marker, outfile } = config;

	const client = new Oss({
		region,
		accessKeyId: id,
		accessKeySecret: secret,
		bucket
	});
	const reader = new OssBucketReadStream(client, { marker, prefix });
	reader.pipe(new OssObjectTableTransform()).pipe(process.stdout);
	if (outfile) {
		const ws = fs.createWriteStream(outfile);
		reader.pipe(new OssObjectEscapeTransform()).pipe(ws);
	}
};