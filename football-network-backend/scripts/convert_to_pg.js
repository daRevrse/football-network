const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../sql/schema_dump.sql');
const outputFile = path.join(__dirname, '../sql/schema_postgres.sql');

let sql = fs.readFileSync(inputFile, 'utf-8');

// 1. Remove undefined views/tables
sql = sql.replace(/-- Table: .*\nundefined;\n/g, '');

// 2. Remove ENGINE=InnoDB...
sql = sql.replace(/\) ENGINE=InnoDB.*?;/g, ');');

// 3. Replace backticks with quotes
sql = sql.replace(/`/g, '"');

// 4. Int replacements
sql = sql.replace(/tinyint\(1\)\s+DEFAULT\s+0/gi, 'BOOLEAN DEFAULT false');
sql = sql.replace(/tinyint\(1\)\s+DEFAULT\s+1/gi, 'BOOLEAN DEFAULT true');
sql = sql.replace(/tinyint\(1\)/gi, 'BOOLEAN');
sql = sql.replace(/tinyint\(\d+\)/gi, 'SMALLINT');
sql = sql.replace(/\bint\(\d+\)/gi, 'INTEGER');

// 5. id SERIAL -> this is crucial
sql = sql.replace(/"id"\s+INTEGER\s+NOT NULL AUTO_INCREMENT/gi, '"id" SERIAL PRIMARY KEY');
sql = sql.replace(/"id"\s+INTEGER\s+AUTO_INCREMENT/gi, '"id" SERIAL PRIMARY KEY');

// Remove original primary key statement for id
sql = sql.replace(/PRIMARY KEY \("id"\),?\n/gi, '');

// Clean up trailing commas from the PRIMARY KEY removal
sql = sql.replace(/,\n(\s*\))/g, '\n$1');

// 6. Data types
sql = sql.replace(/\bdatetime\b/gi, 'TIMESTAMP');
sql = sql.replace(/longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin( DEFAULT NULL)? CHECK \(json_valid\(.*?\)\)/gi, 'JSONB$1');
sql = sql.replace(/longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin/gi, 'TEXT');
sql = sql.replace(/\blongtext\b/gi, 'TEXT');

// 6.2 Remove explicit CHECK (json_valid("field")) as postgres validates JSONB natively
sql = sql.replace(/CHECK\s*\(\s*json_valid\s*\([^)]+\)\s*\)/gi, '');

// 6.5. Remove column COMMENTs (not supported this way in PG)
// We need to match ` COMMENT '...'` where the string might contain `''`.
// A regex to match a SQL string literal is '(?:[^']|'')*'
sql = sql.replace(/ COMMENT\s+'(?:[^']|'')*'/gi, '');

// 7. Enums - convert to TEXT
sql = sql.replace(/enum\(['"].*?['"](?:\s*,\s*['"].*?['"])*\)/gi, 'TEXT');

// 8. Timestamps
sql = sql.replace(/current_timestamp\(\)/gi, 'CURRENT_TIMESTAMP');
sql = sql.replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '');

// 9. Separate UNIQUE INDEXes and normal indexes
// Match blocks again
const tableBlocks = sql.match(/CREATE TABLE ".*?" \([\s\S]*?\);/gi);
let finalSql = "-- Supabase Postgres Schema V2\n\n";
let foreignKeys = [];

if (tableBlocks) {
    for (let block of tableBlocks) {
        const tableNameMatch = block.match(/CREATE TABLE "(.*?)"/);
        if (!tableNameMatch) continue;
        const tableName = tableNameMatch[1];

        // Unique keys inside create table (keep them, but Postgres syntax)
        // UNIQUE KEY "name" ("col") -> UNIQUE ("col")
        block = block.replace(/^\s*UNIQUE KEY "(.*?)" \((.*?)\),?$/gim, (match, idxName, cols) => {
            const uniqueConstraintName = `${tableName}_${idxName}`;
            return `  CONSTRAINT "${uniqueConstraintName}" UNIQUE (${cols}),`;
        });

        // Non-unique KEYs -> Extract them to CREATE INDEX
        const keys = [];
        block = block.replace(/^\s*KEY "(.*?)" \((.*?)\),?$/gim, (match, idxName, cols) => {
            // Prefix index name with table name to ensure uniqueness globally
            const uniqueIdxName = `${tableName}_${idxName}`;
            keys.push(`CREATE INDEX "${uniqueIdxName}" ON "${tableName}" (${cols});`);
            return ``;
        });

        // 10. Extract FOREIGN KEY constraints
        // CONSTRAINT "fk_name" FOREIGN KEY ("col") REFERENCES "table" ("col")
        block = block.replace(/^\s*CONSTRAINT "(.*?)" FOREIGN KEY \((.*?)\) REFERENCES "(.*?)" \((.*?)\)(.*?)(,?)$/gim, (match, fkName, fkCols, refTable, refCols, options, comma) => {
            foreignKeys.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${fkName}" FOREIGN KEY (${fkCols}) REFERENCES "${refTable}" (${refCols})${options};`);
            return ``;
        });

        // Clean up empty lines and trailing commas
        block = block.replace(/,\n+(\s*\))/g, '\n$1');
        block = block.replace(/\n\s*\n/g, '\n');

        finalSql += block + "\n\n";
        if (keys.length > 0) {
            finalSql += keys.join("\n") + "\n\n";
        }
    }
}

// Append all foreign keys at the end
if (foreignKeys.length > 0) {
    finalSql += "-- Foreign Keys\n";
    finalSql += foreignKeys.join("\n") + "\n\n";
}

fs.writeFileSync(outputFile, finalSql);
console.log("Postgres schema generated successfully.");
