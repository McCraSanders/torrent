#!/usr/bin/env node

"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _thepiratebay = require("thepiratebay");

var _thepiratebay2 = _interopRequireDefault(_thepiratebay);

var _inquirer = require("inquirer");

var _inquirer2 = _interopRequireDefault(_inquirer);

var _chalk = require("chalk");

var _chalk2 = _interopRequireDefault(_chalk);

var _commander = require("commander");

var _commander2 = _interopRequireDefault(_commander);

var _delugeAdd = require("deluge-add");

var _delugeAdd2 = _interopRequireDefault(_delugeAdd);

var _opener = require("opener");

var _opener2 = _interopRequireDefault(_opener);

var _copyPaste = require("copy-paste");

var _copyPaste2 = _interopRequireDefault(_copyPaste);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TIMEOUT = 8192;

var query = void 0;
_commander2.default.arguments("<query>").option("-l, --lucky", "automatically select the most seeded torrent").option("-r, --remote", "add to a Deluge server").option("-c, --copy", "copy the selected magnet link to the clipboard").option("-o, --open", "open magnet link").action(function (input) {
	return query = input;
}).parse(process.argv);

var error = function error(_error, code) {
	code = code || 1;
	console.error(_chalk2.default.red(_error));
	process.exit(code);
};
var green = function green(message) {
	console.log(_chalk2.default.green(message));
};

var formatTorrents = function formatTorrents(torrents) {
	var digits = torrents.reduce(function (previous, current) {
		return Math.max(previous, current.seeders.toString().length);
	}, 0);
	var choices = torrents.map(function (torrent) {
		var color = void 0;
		if (torrent.seeders > 64) {
			color = _chalk2.default.green;
		} else if (torrent.seeders > 16) {
			color = _chalk2.default.yellow;
		} else {
			color = _chalk2.default.red;
		}
		var padding = " ".repeat(digits - torrent.seeders.toString().length);
		return {
			name: padding + color(torrent.seeders) + " | " + (torrent.verified ? _chalk2.default.green("✔") : _chalk2.default.red("✗")) + " | " + torrent.name.trim(),
			value: torrent
		};
	});
	choices.push(new _inquirer2.default.Separator());
	return choices;
};

var search = function () {
	var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(query) {
		var timer, torrents, choice, choices, answer, print;
		return _regenerator2.default.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						timer = setTimeout(function () {
							error("Operation timed out");
						}, TIMEOUT);
						_context.next = 3;
						return _thepiratebay2.default.search(query, {
							orderBy: "seeds",
							sortBy: "desc"
						});

					case 3:
						torrents = _context.sent;

						clearTimeout(timer);
						// console.log(torrents);
						if (!torrents.length) error("Couldn't find any torrents");

						choice = void 0;

						if (!_commander2.default.lucky) {
							_context.next = 11;
							break;
						}

						choice = torrents[0];
						_context.next = 16;
						break;

					case 11:
						choices = formatTorrents(torrents);
						_context.next = 14;
						return _inquirer2.default.prompt([{
							choices: choices,
							type: "list",
							name: "torrent",
							message: "Choose a torrent:",
							default: torrents[0]
						}]);

					case 14:
						answer = _context.sent;

						choice = answer.torrent;

					case 16:
						print = true;

						if (_commander2.default.remote) {
							print = false;
							remote(choice.magnetLink);
						}
						if (_commander2.default.open) {
							print = false;
							(0, _opener2.default)(choice.magnetLink);
							green("Link opened.");
						}
						if (_commander2.default.copy) {
							print = false;
							_copyPaste2.default.copy(choice.magnetLink, function () {
								return green("Link copied to clipboard.");
							});
						}

						if (print) console.log(choice.magnetLink);

					case 21:
					case "end":
						return _context.stop();
				}
			}
		}, _callee, this);
	}));

	return function search(_x) {
		return _ref.apply(this, arguments);
	};
}();

var remote = function () {
	var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(magnet) {
		var information;
		return _regenerator2.default.wrap(function _callee2$(_context2) {
			while (1) {
				switch (_context2.prev = _context2.next) {
					case 0:
						_context2.next = 2;
						return _inquirer2.default.prompt([{
							type: "input",
							name: "hostname",
							message: "Hostname:"
						}, {
							type: "input",
							name: "port",
							message: "Port:",
							default: "8112"
						}, {
							type: "password",
							name: "password",
							message: "Password:"
						}]);

					case 2:
						information = _context2.sent;

						(0, _delugeAdd2.default)("http://" + information.hostname + ":" + information.port + "/json", information.password, magnet, undefined, function (problem) {
							if (problem) {
								error(problem);
							} else {
								green("Torrent added to server.");
							}
						});

					case 4:
					case "end":
						return _context2.stop();
				}
			}
		}, _callee2, this);
	}));

	return function remote(_x2) {
		return _ref2.apply(this, arguments);
	};
}();

search(query);
