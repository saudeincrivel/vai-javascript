const http = require("http");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("example.db");

db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, value INTEGER)"
  );
});

function generateRandomData() {
  return {
    name: `Name`,
    value: "value",
  };
}

let lista = [];
function pregen() {
  const MAX_ELEMENTS = 10000;
  for (let i = 0; i < MAX_ELEMENTS; i++) {
    lista.push(generateRandomData());
  }
}
pregen();

const server = http.createServer((req, res) => {
  if (req.method === "GET") {
    db.all("SELECT * FROM items", [], (err, rows) => {
      res.end(JSON.stringify({ message: `Items lidos: ${rows.length}` }));
    });
  } else if (req.method === "PUT") {
    res.writeHead(202, { "Content-Type": "application/json" });

    db.serialize(() => {
      console.info("Initialize insertion..");
      const stmt = db.prepare(
        "INSERT INTO items (id, name, value) VALUES (?, ?, ?)"
      );
      db.run("BEGIN TRANSACTION");
      for (let i = 0; i < lista.length; i++) {
        stmt.run(lista[i].id, lista[i].name, lista[i].value);
      }
      db.run("COMMIT", (err) => {
        if (err) {
          console.error("Error committing transaction:", err.message);
        } else {
          console.log("Successfully inserted 10.000 items!");
        }
      });
      stmt.finalize((err) => {
        if (err) {
          console.error("Error finalizing statement:", err.message);
        }
        res.end(JSON.stringify({ message: `${lista.length} Items Inserted!` }));
      });
    });
  } else if (req.method === "DELETE") {
    db.run("DELETE FROM items", function (err) {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "All items deleted successfully" }));
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

process.on("exit", () => {
  db.close();
});
