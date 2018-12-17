import _ from 'lodash';
import { Readable, Transform } from 'stream';
import chalk from 'chalk';
import prettysize from 'prettysize';

export class OssBucketReadStream extends Readable {
	constructor(client, { prefix = null, marker = null }) {
		super();
		this.$marker = marker;
		this.$prefix = prefix;
		this.$client = client;
	}

	async _read() {
		const result = await this.$client.list({
			prefix: this.$prefix,
			marker: this.$marker
		});
		const { objects, nextMarker } = result;
		_.forEach(objects, rec => this.push(JSON.stringify(rec)));
		if (!nextMarker) {
			this.push(null);
		} else {
			this.$marker = nextMarker;
		}
	}
}

export class OssObjectTableTransform extends Transform {
	constructor() {
		super();
		this.$index = 0;
	}
	_transform(chunk, encoding, cb) {
		if (_.isNil(chunk)) {
			this.push(null);
		}
		const content = chunk.toString();
		const record = JSON.parse(content);
		cb();
		this.push(`${++this.$index}.\t${chalk.bold.green(record.name)}\t${chalk.gray(prettysize(record.size))}\n`);
	}

}

export class OssObjectEscapeTransform extends Transform {
	constructor() {
		super();
	}

	_transform(chunk, encoding, cb) {
		cb();
		this.push(`${chunk.toString()}\n`);
	}
}