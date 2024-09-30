const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()

// Define the path to the database file
const dbPath = path.join(__dirname, 'smoke-trees.db')
let db = null

// Middleware to parse JSON bodies
app.use(express.json())

// Initialize the database and start the server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    // Create tables if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS User (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(200) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Address (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        address VARCHAR(200) NOT NULL,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
      );
    `)
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.error(`Error initializing DB or server: ${error.message}`)
    process.exit(1) // Exit process with failure
  }
}

initializeDBAndServer()
// Register a new user with an address
app.post('/register', async (req, res) => {
  const {name, address} = req.body

  if (!name || !address) {
    return res.status(400).send({error: 'Name and address are required'})
  }

  // Check if the user already exists
  const userQuery = `SELECT * FROM User WHERE name = "${name}"`
  const existingUser = await db.get(userQuery)

  let userId

  if (!existingUser) {
    // Insert new user
    const insertUserQuery = `INSERT INTO User (name) VALUES ("${name}")`
    const userResult = await db.run(insertUserQuery)
    userId = userResult.lastID

    // Insert new address
    const insertAddressQuery = `INSERT INTO Address (userId, address) VALUES (${userId}, "${address}")`
    await db.run(insertAddressQuery)

    return res
      .status(200)
      .send({message: 'User and address registered successfully', userId})
  }

  userId = existingUser.id
  console.log(userId)

  // Check if the address already exists for this user
  const addressQuery = `SELECT * FROM Address WHERE userId = ${userId} AND address = "${address}"`
  const existingAddress = await db.get(addressQuery)

  if (!existingAddress) {
    // Insert new address for existing user
    const insertAddressQuery = `INSERT INTO Address (userId, address) VALUES (${userId}, "${address}")`
    await db.run(insertAddressQuery)

    return res.status(200).send({
      message: 'Address added successfully for existing user',
      userId,
    })
  }

  // Address already exists for this user
  return res.status(400).send({error: 'Address already exists for this user'})
})

// Get all users and their addresses
app.get('/user', async (req, res) => {
  const query = `
    SELECT User.name, Address.address
    FROM User
    JOIN Address ON User.id = Address.userId
  `
  const result = await db.all(query)
  return res.status(200).send(result)
})
