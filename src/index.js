import _ from 'lodash';
import program from 'commander';
import prompt from 'prompt-promise';
import chalk from 'chalk';
import pkg from '../package.json';
import ossLister from './lib/list';
import { error } from './lib/util';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

async function requireUntilProvided(message) {
	const content = await prompt(`${chalk.green(message)}`);
	if (!content) {
		return requireUntilProvided(message);
	}
	return content;
}

program
	.description('阿里云OSS内容读取工具，欢迎使用。')
	.version(pkg.version);

// list objects from oss
// help link: https://help.aliyun.com/document_detail/31947.html
program.command('list <bucket>').alias('ls')
	.description('Retrive the full `Objects` list from <bucket>. Arguments has the some meaning to https://help.aliyun.com/document_detail/31965.html?spm=a2c4g.11186623.6.1066.730f7b55pV4ySM .')
	.option('-k, --id <id>', 'The Access Key ID created by Aliyun.')
	.option('-s, --secret <string>', 'The Access Key Secret created by Aliyun.')
	.option('-r, --region <string>', 'Optional. The region of bucket, default to "oss-cn-hangzhou".')
	.option('-p, --prefix <string>', 'Optional. The prefix path of `Objects`, we would just fetch thing behind this path if provided.')
	.option('-m, --marker <marker>', 'Optional. Start point for fetching.')
	.option('-o, --outfile <outfile>', 'Optional. We would save the `Objects` list if provided.')
	.action(async (bucket, options) => {
		let { id } = options;
		const { region, prefix, marker, outfile } = options;
		if (_.isNil(id)) {
			id = await requireUtilProvided('Please provide Aliyun Access ID:');
		}
		const secret = await requireUntilProvided('Please provide Aliyun Access Secret:');
		console.log('\n');
		ossLister(bucket, { id, secret, region, prefix, marker, outfile })
	});

program.parse(process.argv);

if (process.argv.length === 2) {
	program.outputHelp();
}

// registe global error handler
process.on('uncaughtException', (err) => {
	error(err);
});