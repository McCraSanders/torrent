#!/usr/bin/env node --harmony

'use strict';

const Table = require('cli-table');
const Transmission = require('transmission');

const prompt = require('co-prompt');
const opener = require('opener');
const tpb = require('thepiratebay');
const program = require('commander');
const co = require('co');
const chalk = require('chalk');

const category = '0';
const orderBy = '7';
const count = 8;

let query;
program
	.arguments('<query>')
	.option('-a, --all', 'list all torrents')
	.option('-l, --lucky', 'automatically select the most popular torrent')
	.option('-r --remote', 'add to master transmission server')
	.option('-o --open', 'open magnet link')
	.action((input) => {
		query = input;
	})
	.parse(process.argv);

co(function *() {
	if (typeof query === 'undefined' || query.length === 0) {
		program.outputHelp();
		process.exit(1);
	}
	let torrents = yield tpb.search(query, {category: category, orderBy: orderBy});
	if (! torrents.length) {
		console.error(chalk.red('no torrents found!'));
		process.exit(1);
	}
	let magnet;
	if (program.lucky) {
		magnet = torrents[0].magnetLink;
	} else {
		if (! program.all) {
			torrents = torrents.slice(0, count);
		}
		let table = new Table({
			head: ['#', 'name', 'size', 'se'],
			colAligns: ['left', 'left', 'right', 'right']
		});
		torrents.map((torrent, index) => {
			table.push([index + 1, torrent.name, torrent.size, torrent.seeders]);
		});
		console.log(table.toString());
		let which;
		while (! which) {
			which = yield prompt(chalk.yellow('#: '));
			if (isNaN(parseFloat(which)) ||
				! isFinite(which) ||
				which % 1 !== 0 ||
				which < 1 ||
				which > torrents.length
			) {
				console.error(chalk.red('invalid number'));
				which = undefined;
			}
		}
		magnet = torrents[which - 1].magnetLink;
		if (typeof magnet === 'undefined') {
			console.error(chalk.red('invalid torrent'));
			process.exit(1);
		}
	}

	if (program.remote) {
		let transmission = new Transmission({
			host: 'master.evangoo.de',
			username: yield prompt('remote username: '),
			password: yield prompt.password('remote password: ', '')
		});
		transmission.addUrl(magnet, (error) => {
			if (error) {
				console.error(chalk.red(error));
				process.exit(1);
			} else {
				console.log(chalk.green('added to master transmission server'));
			}
		});
	}
	if (program.open) {
		opener(magnet);
		console.log(chalk.green('opened magnet link'));
	}
	if (! (program.remote || program.open)) {
		console.log(magnet);
	}
});
