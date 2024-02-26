import sqlite3InitModule from './node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3.mjs'

const sqlite3 = await sqlite3InitModule();

if (sqlite3.capi.sqlite3_vfs_find("opfs")) {
  console.log('...OPFS VFS is available ...');
}
// Alternately:
if (sqlite3.oo1.OpfsDb) {
  console.log('... OPFS VFS is available ... ');
}
