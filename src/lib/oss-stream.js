import _ from 'lodash';
import { Readable, Transform } from 'stream';
import chalk from 'chalk';
import prettysize from 'prettysize';

export class OssBucketReadStream extends Readable {
	constructor(client, { prefix = null, marker = null }) {
		super({ objectMode: true });
		this.$marker = marker;
		this.$prefix = prefix;
		this.$client = client;
	}

	async _read() {
		while (true) {
			let result;
			try {
				result = await this.$client.list({
					prefix: this.$prefix,
					marker: this.$marker
				});
			} catch (e) {
				this.destroy(e);
				return;
			}
			const { objects, nextMarker } = result;
			// According to https://nodejs.org/api/stream.html#stream_readable_read_size_1,
			// we stop once the `push` method return false value.
			const sholdStop = _(objects)
				.map(rec => this.push(rec))
				.includes(false);
			if (!nextMarker) {
				this.push(null);
			} else {
				this.$marker = nextMarker;
			}
			if (sholdStop) {
				return;
			}
		}
	}
}

export class OssObjectTableTransform extends Transform {
	constructor() {
		super({ objectMode: true });
		this.$index = 0;
	}
	_transform(record, encoding, cb) {
		if (_.isNil(record)) {
			this.push(null);
		}
		cb();
		this.push(`${++this.$index}.\t${chalk.bold.green(record.name)}\t${chalk.gray(prettysize(record.size))}\n`);
	}

}

export class OssObjectEscapeTransform extends Transform {
	constructor() {
		super({ objectMode: true });
	}

	_transform(record, encoding, cb) {
		cb();
		this.push(`${JSON.stringify(record)}\n`);
	}
}