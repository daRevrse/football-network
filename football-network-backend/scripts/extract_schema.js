const mysql = require("mysql2/promise");
require("dotenv").config({ path: __dirname + "/../.env" });

async function extractSchema() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "football_network",
    });

    const [tables] = await connection.query("SHOW TABLES");
    const tableKey = `Tables_in_${process.env.DB_NAME || "football_network"}`;

    let schemaSql = "-- Football Network MySQL Schema Dump\n\n";

    for (const row of tables) {
      const tableName = row[tableKey] || Object.values(row)[0];
      const [createTableResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
      
      const createStatement = createTableResult[0]["Create Table"];
      schemaSql += `-- Table: ${tableName}\n`;
      schemaSql += createStatement + ";\n\n";
    }

    const fs = require('fs');
    fs.writeFileSync(__dirname + "/../sql/schema_dump.sql", schemaSql);
    console.log("Schema extracted to sql/schema_dump.sql successfully");
  } catch (error) {
    console.error("Error extracting schema:", error);
  } finally {
    if (connection) await connection.end();
  }
}

extractSchema();
