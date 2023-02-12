const { Pool } = require("pg")
const dotenv = require("dotenv");
const bcrypt = require('bcrypt');

dotenv.config()


async function connectDB() {
    try {
        // pool = new Pool({
        //     user: process.env.PGUSER,
        //     host: process.env.PGHOST,
        //     database: process.env.PGDATABASE,
        //     password: process.env.PGPASSWORD,
        //     port: process.env.PGPORT,
        // });
        const connectString = process.env.CONNECTSTRING;
        const pool = new Pool({
          connectionString : connectString,
          ssl : true
        })

        await pool.connect()

        console.log("Connection success!")

        return pool;

    } catch (error) {
        console.log(error)
    }
  }  


async function createTableIfNotExists(connection,tableName) {
    const query = `
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT * FROM information_schema.tables WHERE table_name = '${tableName}') THEN
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    username TEXT not null UNIQUE,
                    password TEXT not null
                );
            END IF;
        END $$;
    `;

    await connection.query(query)
}

async function insertData(connection, tableName, data) {
    try {
      const queryText = `
        INSERT INTO ${tableName} (username, password)
        VALUES ($1, $2);
      `;
      const username = data.username;
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(data.password,saltRounds);
      await connection.query(queryText, [username, hashedPassword]);
      console.log(`Data inserted into ${tableName}`);
      return "Data inserted successfully.";
    } catch (error) {
      console.error(error);
      return error;
    }
  }

async function verifyUser(connection, table_name, username, password) {
  try {
    const queryText = `SELECT * FROM ${table_name} WHERE username = '${username}'`;
    const result = await connection.query(queryText);
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password,saltRounds)
    const isPasswordIncorrect = await bcrypt.compare(hashedPassword,result.rows[0].password)
    if(!isPasswordIncorrect){
      return result;
    }
    else{
      return {inCorrect : "Incorrect password!"};
    }

  } catch(error) {
    console.log(error);
    return {error : error}
  }
}

async function checkUserExists(connection, table_name, username) {
  try {
    const queryText = `SELECT * FROM ${table_name} WHERE username = '${username}'`;
    const result = await connection.query(queryText);
    if(result.rows) {
      return {status : result};
    }
    else {
      return {status : "User not found."}
    }
  } catch(error) {
    console.log(error)
    return {status : error}
  }
}

module.exports = {
    connectDB,
    createTableIfNotExists,
    insertData,
    verifyUser,
    checkUserExists
}
