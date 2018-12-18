import _ from 'lodash';
import program from 'commander';
import prompt from 'prompt-promise';
import chalk from 'chalk';
import ossLister from '../lib/list';
import { error } from '../lib/util';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

async function requireUntilProvided(message) {
	const content = await prompt(`${chalk.green(message)}`);
	if (!content) {
		return requireUntilProvided(message);
	}
	return content;
}

// list 命令
program.command('list <bucket>').alias('ls')
	.option('-k, --id <id>', '通过阿里云控制台创建的access key')
	.option('-s, --secret <string>', '通过阿里云控制台创建的access secret')
	.option('-r, --region <string>', '可选，bucket 所在的区域, 默认 oss-cn-hangzhou')
	.option('-p, --prefix <string>', '可选，限定返回的object key必须以prefix作为前缀。注意使用prefix查询时，返回的key中仍会包含prefix。')
	.option('-m, --marker <marker>', '可选，设定结果从marker之后按字母排序的第一个开始返回。')
	.option('-o, --outfile <outfile>', '可选，将结果保存到此文件')
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

// registe global error handler
process.on('uncaughtException', (err) => {
	error(err);
});