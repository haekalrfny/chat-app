import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser"
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cors from "cors";
import bcrypt from "bcryptjs"
import User from "./models/User.js";
import Message from "./models/Message.js"
import ws, {WebSocketServer} from "ws"
import fs from "fs"
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env
dotenv.config();
const jwtSecret = process.env.JWT_SECRET;
const mongoUrl = process.env.MONGO_URL
const clientUrl = process.env.CLIENT_URL
// const clientServerUrl = process.env.CLIENT_SERVER_URL;
const port = 4040
const bcryptSalt = bcrypt.genSaltSync(10)
const app = express();

// Connect to MongoDB
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

app.use('/uploads', express.static(__dirname + '/uploads'))
app.use(express.json());
app.use(cookieParser())
app.use(
  cors({
    origin: clientUrl,
    methods: ["POST", "GET"],
    credentials: true,
  })
);

// Get user from token
async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) =>{
    const token = req.cookies?.token;
    console.log(token)
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData)
      })
    } else {
      reject('no token')
    }
  })
}

// Testing
app.get("/", (req, res) => {
  res.json("Hi! People");
});

// Show Message
app.get("/messages/:userId", async (req, res) => {
const {userId} = req.params
const userData = await getUserDataFromRequest(req)
const ourUserId = userData.userId
const messages = await Message.find({
  sender : {$in:[userId,ourUserId]},
  recipient: {$in:[userId,ourUserId]},
}).sort({createdAt:1})
res.json(messages)
})

// Show People
app.get("/people", async (req, res) => {
 const users = await User.find({}, {"_id":1,username:1})
 res.json(users)
})

// Profile Validation
app.get("/profile", (req, res) => {
  const token = req.cookies?.token
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err
      res.json(userData)
    })
  } else {
    res.status(401).json("no token")
  }
})

// Login
app.post('/login', async (req,res) => {
  const {username,password} = req.body
  const foundUser = await User.findOne({username})
  if (foundUser) {
   const passOk = bcrypt.compareSync(password, foundUser.password)
   if (passOk) {
    jwt.sign({ userId: foundUser._id, username }, jwtSecret, {}, (err, token) => {
      res.cookie("token", token, { sameSite:"none", secure:true }).json({
        id : foundUser._id
      })
    })
   }
  }
})

// Logout
app.post("/logout", (req, res) => {
  res.cookie("token", "", {sameSite:"none", secure:true}).json("ok")
})

// Register
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt)
    const createdUser = await User.create({ username: username, password:hashedPassword  });
    jwt.sign({ userId: createdUser._id, username }, jwtSecret, {}, (err, token) => {
      if (err) throw err;
      res.cookie("token", token, { sameSite:"none", secure:true }).status(201).json({
        id : createdUser._id,
      });

    });
  } catch (err) {
    console.error(err);
    res.status(500).json("error");
  }
});

// Run Server
const server = app.listen(port)

// Connect WebSocket Server to Client
const wss = new WebSocketServer({server})
wss.on('connection', (connection, req) => {
  const notifyAboutOnlinePeople = () => {
    [...wss.clients].forEach((client) => {
      client.send(JSON.stringify({
        online : [...wss.clients].map((c) => ({userId:c.userId, username :c.username}))
      }))})
  }

  connection.isAlive = true;

  connection.timer = setInterval(() => {
    connection.ping()
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false
      clearInterval(connection.timer)
      connection.terminate()
      notifyAboutOnlinePeople()
    }, 1000);
  }, 5000)

  connection.on("pong", () => {
   clearTimeout(connection.deathTimer) 
  })

  // Read username and id from the cookie for this connection
  const cookies = req.headers.cookie
  if (cookies) {
    const tokenCookiesString = cookies.split(';').find(str => str.startsWith('token='))
    if (tokenCookiesString) {
      const token = tokenCookiesString.split("=")[1]
      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err
          const {userId, username} = userData
          connection.userId = userId
          connection.username = username
        })
      }
    }
  }
  
  connection.on("message", async (message) => {
    const messageData = JSON.parse(message.toString())
    const {recipient, text, file} = messageData
    let filename = null
    if (file) {
      const parts = file.name.split('.');
      const ext = parts[parts.length - 1];
      filename = Date.now() + '.' + ext;
      const localPath = path.join(__dirname, '/uploads/', filename);
      const bufferData = new Buffer(file.data.split(',')[1], 'base64');
      fs.writeFile(localPath, bufferData, () => {
        console.log('file saved:' + localPath);
      });
    }
    
    if (recipient && (text || file)) {
      const messageDoc = await Message.create({
        sender : connection.userId,
        recipient,
        text,
        file: file ? filename : null,
      });
      [...wss.clients]
      .filter(c => c.userId === recipient)
      .forEach(c => c.send(JSON.stringify({
        text, sender:connection.userId,
        recipient,
        file : file ? filename : null,
        _id : messageDoc._id
      })))
    }
  });
  
//  notify everyone about online people (when someone connects) 
notifyAboutOnlinePeople()
})

