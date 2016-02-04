import minimist from 'minimist';
import cacher from './cacher';
import server from './serve';

const argv = minimist(process.argv.slice(2), {alias:{root:['r','data']}});

if (argv.root) {
  cacher.root = argv.root;
}

server();