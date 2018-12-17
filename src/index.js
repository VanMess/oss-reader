import program from 'commander';
import systemInfo from '../package.json';

program.version(systemInfo.version);
console.log(systemInfo.version);

program.parse(process.argv);