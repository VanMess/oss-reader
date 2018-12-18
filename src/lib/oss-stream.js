import _ from "lodash";
import { Readable, Transform } from "stream";
import chalk from "chalk";
import prettysize from "prettysize";

export class OssBucketReadStream extends Readable {
	constructor(client, { prefix = null, marker = null }) {
		super({ objectMode: true });
		this.$marker = marker;
		this.$prefix = prefix;
		this.$client = client;
		this.$reading = false;
	}

	get marker() {
		return this.$marker;
	}

	async _read() {
		// should fetch data one by one.
		if (this.$reading) {
			return;
		}
		while (true) {
			try {
				this.$reading = true;
				const result = await this.$client.list({
					prefix: this.$prefix,
					marker: this.$marker
				});
				const { objects, nextMarker } = result;
				// According to https://nodejs.org/api/stream.html#stream_readable_read_size_1,
				// we stop once the `push` method return false value.
				const sholdStop = _(objects)
					.map(rec => this.push(rec))
					.includes(false);
				// OSS will return empty `nextMarker`
				// while there is nothing behind.
				if (!nextMarker) {
					this.push(null);
					break;
				} else {
					this.$marker = nextMarker;
				}
				if (sholdStop) {
					break;
				}
			} catch (e) {
				this.destroy(e);
			} finally {
				this.$reading = false;
			}
		}
	}
}

export class OssObjectTableTransform extends Transform {
	constructor() {
		super({ objectMode: true, autoDestroy: true });
		this.$index = 0;
	}
	_transform(record, encoding, cb) {
		if (_.isNil(record)) {
			this.push(null);
			cb();
			return;
		}
		this.push(
			`${++this.$index}.\t${chalk.bold.green(record.name)}\t${chalk.gray(
        prettysize(record.size)
      )}\n`
		);
		cb();
	}
}

export class OssObjectEscapeTransform extends Transform {
	constructor() {
		super({ objectMode: true, autoDestroy: true });
	}

	_transform(record, encoding, cb) {
		this.push(`${JSON.stringify(record)}\n`);
		cb();
	}
}