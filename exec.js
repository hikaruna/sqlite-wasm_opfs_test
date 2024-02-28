const log = console.log;
const warn = console.warn;

/** @param params {{
 *  db: import('./node_modules/@sqlite.org/sqlite-wasm/index.d.ts').Database
 *  sqlite3: import('./node_modules/@sqlite.org/sqlite-wasm/index.d.ts').Sqlite3Static
 *  log?: Function
 *  warn?: Function
 * }}
 */
const exec = ({
  db,
  sqlite3,
  log = console.log,
  warn = console.warn
}) => {
  log("Create a table...");
  db.exec("CREATE TABLE IF NOT EXISTS t(a,b)");
  //Equivalent:
  db.exec({
    sql: "CREATE TABLE IF NOT EXISTS t(a,b)"
    // ... numerous other options ... 
  });
  // SQL can be either a string or a byte array
  // or an array of strings which get concatenated
  // together as-is (so be sure to end each statement
  // with a semicolon).

  log("Insert some data using exec()...");
  let i;
  for (i = 20; i <= 25; ++i) {
    db.exec({
      sql: "insert into t(a,b) values (?,?)",
      // bind by parameter index...
      bind: [i, i * 2]
    });
    db.exec({
      sql: "insert into t(a,b) values ($a,$b)",
      // bind by parameter name...
      bind: { $a: i * 10, $b: i * 20 }
    });
  }

  log("Insert using a prepared statement...");
  let q = db.prepare([
    // SQL may be a string or array of strings
    // (concatenated w/o separators).
    "insert into t(a,b) ",
    "values(?,?)"
  ]);
  try {
    for (i = 100; i < 103; ++i) {
      q.bind([i, i * 2]).step();
      q.reset();
    }
    // Equivalent...
    for (i = 103; i <= 105; ++i) {
      q.bind(1, i).bind(2, i * 2).stepReset();
    }
  } finally {
    q.finalize();
  }

  log("Query data with exec() using rowMode 'array'...");
  db.exec({
    sql: "select a from t order by a limit 3",
    rowMode: 'array', // 'array' (default), 'object', or 'stmt'
    callback: function (row) {
      log("row ", ++this.counter, "=", row);
    }.bind({ counter: 0 })
  });

  log("Query data with exec() using rowMode 'object'...");
  db.exec({
    sql: "select a as aa, b as bb from t order by aa limit 3",
    rowMode: 'object',
    callback: function (row) {
      log("row ", ++this.counter, "=", JSON.stringify(row));
    }.bind({ counter: 0 })
  });

  log("Query data with exec() using rowMode 'stmt'...");
  db.exec({
    sql: "select a from t order by a limit 3",
    rowMode: 'stmt',
    callback: function (row) {
      log("row ", ++this.counter, "get(0) =", row.get(0));
    }.bind({ counter: 0 })
  });

  log("Query data with exec() using rowMode INTEGER (result column index)...");
  db.exec({
    sql: "select a, b from t order by a limit 3",
    rowMode: 1, // === result column 1
    callback: function (row) {
      log("row ", ++this.counter, "b =", row);
    }.bind({ counter: 0 })
  });

  log("Query data with exec() using rowMode $COLNAME (result column name)...");
  db.exec({
    sql: "select a a, b from t order by a limit 3",
    rowMode: '$a',
    callback: function (value) {
      log("row ", ++this.counter, "a =", value);
    }.bind({ counter: 0 })
  });

  log("Query data with exec() without a callback...");
  let resultRows = [];
  db.exec({
    sql: "select a, b from t order by a limit 3",
    rowMode: 'object',
    resultRows: resultRows
  });
  log("Result rows:", JSON.stringify(resultRows, undefined, 2));

  log("Create a scalar UDF...");
  db.createFunction({
    name: 'twice',
    xFunc: function (pCx, arg) { // note the call arg count
      return arg + arg;
    }
  });
  log("Run scalar UDF and collect result column names...");
  let columnNames = [];
  db.exec({
    sql: "select a, twice(a), twice(''||a) from t order by a desc limit 3",
    columnNames: columnNames,
    rowMode: 'stmt',
    callback: function (row) {
      log("a =", row.get(0), "twice(a) =", row.get(1),
        "twice(''||a) =", row.get(2));
    }
  });
  log("Result column names:", columnNames);

  try {
    log("The following use of the twice() UDF will",
      "fail because of incorrect arg count...");
    db.exec("select twice(1,2,3)");
  } catch (e) {
    warn("Got expected exception:", e.message);
  }

  try {
    db.transaction(function (D) {
      D.exec("delete from t");
      log("In transaction: count(*) from t =", db.selectValue("select count(*) from t"));
      throw new sqlite3.SQLite3Error("Demonstrating transaction() rollback");
    });
  } catch (e) {
    if (e instanceof sqlite3.SQLite3Error) {
      log("Got expected exception from db.transaction():", e.message);
      log("count(*) from t =", db.selectValue("select count(*) from t"));
    } else {
      throw e;
    }
  }

  try {
    db.savepoint(function (D) {
      D.exec("delete from t");
      log("In savepoint: count(*) from t =", db.selectValue("select count(*) from t"));
      D.savepoint(function (DD) {
        const rows = [];
        DD.exec({
          sql: ["insert into t(a,b) values(99,100);",
            "select count(*) from t"],
          rowMode: 0,
          resultRows: rows
        });
        log("In nested savepoint. Row count =", rows[0]);
        throw new sqlite3.SQLite3Error("Demonstrating nested savepoint() rollback");
      })
    });
  } catch (e) {
    if (e instanceof sqlite3.SQLite3Error) {
      log("Got expected exception from nested db.savepoint():", e.message);
      log("count(*) from t =", db.selectValue("select count(*) from t"));
    } else {
      throw e;
    }
  }
};

export default exec;
