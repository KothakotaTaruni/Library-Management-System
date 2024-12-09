const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');


dotenv.config();


const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'database.db')

const createTable = async () => {
  await   db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `);

 await   db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      publication_date DATE,
      isbn TEXT,
      available INTEGER DEFAULT 1
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS borrow_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      request_date DATE NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS borrow_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      borrow_date DATE NOT NULL,
      return_date DATE,
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  }

let db = null
const initalizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    await createTable()
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initalizeDBAndServer() // initalize the database

// middleware function
function authenticateToken(request, response, next) {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        request.username = payload.username
        next()
      }
    })
  }
}

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      }
      const jwtToken = jwt.sign(payload, 'MY_SECRET_TOKEN')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

// Librarian API's
// Create a new library user
app.post('/api/users', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide both email and password' });
  }

  const hashedPassword = bcrypt.hashSync(password, 8);

  db.addUser({ email, password: hashedPassword }, (err, userId) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to create user' });
    }

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'User created successfully', token });
  });
});

// View all book borrow requests
app.get('/api/borrow-requests', authenticateToken, (req, res) => {
  db.getAllBorrowRequests((err, requests) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to retrieve borrow requests' });
    }

    res.json(requests);
  });
});

// Approve a borrow request
app.put('/api/borrow-requests/:id/approve', authenticateToken, (req, res) => {
  const requestId = req.params.id;

  db.approveBorrowRequest(requestId, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to approve borrow request' });
    }

    res.json({ message: 'Borrow request approved successfully' });
  });
});

// Deny a borrow request
app.put('/api/borrow-requests/:id/deny', authenticateToken, (req, res) => {
  const requestId = req.params.id;

  db.denyBorrowRequest(requestId, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to deny borrow request' });
    }

    res.json({ message: 'Borrow request denied successfully' });
  });
});

// View a user's borrow history
app.get('/api/users/:id/history', authenticateToken, (req, res) => {
  const userId = req.params.id;

  db.getBorrowHistoryForUser(userId, (err, history) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to retrieve borrow history' });
    }

    res.json(history);
  });
});


// Library User API's
router.get('/api/books', (req, res) => {
  db.getAvailableBooks((err, books) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to retrieve available books' });
    }

    res.json(books);
  });
});

// Submit a request to borrow a book
app.post('/api/borrow-requests', authenticateToken, (req, res) => {
  const { bookId, startDate, endDate } = req.body;

  if (!bookId || !startDate || !endDate) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  db.createBorrowRequest({ bookId, userId: req.user.id, startDate, endDate }, (err, requestId) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to create borrow request' });
    }

    res.json({ message: 'Borrow request created successfully', requestId });
  });
});

// View the user's borrow history
app.get('/api/users/:id/history', authenticateToken, (req, res) => {
  const userId = req.params.id;

  if (userId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  db.getBorrowHistoryForUser(userId, (err, history) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to retrieve borrow history' });
    }

    res.json(history);
  });
});


module.exports = app