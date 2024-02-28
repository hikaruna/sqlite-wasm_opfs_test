//@ts-check
import exec from './exec.js';
import sqlite3InitModule from './node_modules/@sqlite.org/sqlite-wasm/index.mjs'

/** @type {import('./node_modules/@sqlite.org/sqlite-wasm/index.d.ts').Sqlite3Static} */ 
const sqlite3 = await sqlite3InitModule();

if(sqlite3.capi.sqlite3_vfs_find("opfs") == null){
  console.warn('... OPFS VFS is not available ...');
}
if(sqlite3.oo1.OpfsDb == null){
  console.warn('... OPFS VFS is not available ...');
  }


let db = new sqlite3.oo1.OpfsDb('filename', 'c');
const log = console.log;
const warn = console.warn;

exec({db, sqlite3, log, warn});
let db2 = new sqlite3.oo1.OpfsDb('filename2', 'c');
exec({db: db2, sqlite3, log, warn});
