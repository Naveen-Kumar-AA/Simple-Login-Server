const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require("dotenv")
const db = require('./pgsql')
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');



app.use(cors());
app.use(express.json());

dotenv.config();
const users = process.env.USER;
const secretKey = process.env.JwtSecretKey;
let activeSessions = {}
const jwtOptions = {
    jwtFromRequest : ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey : secretKey

};
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  



main = async () => {

    const connection = await db.connectDB();
    
    const jwtStrategy = new JwtStrategy(jwtOptions,async (payload, done) => {
        const result = await db.checkUserExists(connection,users,payload.username);
        if(result.status === "User not found."){
            done(null,false);
        }
        else if(result.status.rows) {
            done(null,payload.username);
        }
        else{
            done(result.status,false);
        }
    });
    
    passport.use(jwtStrategy);

    db.createTableIfNotExists(connection,users);

    
    
    
    app.post('/signup', (req,res)=>{
        db.insertData(connection,users,req.body).then((result)=>{
            const token = jwt.sign({ username: req.body.username }, jwtOptions.secretOrKey);
            const sessionId = generateSessionId();
            activeSessions[req.body.username] = sessionId;
            return res.json({ token, sessionId });
        }).catch((err)=>{
            console.log(err)
        })
    })

    app.post('/login',async (req,res)=>{
        const {username,password} = req.body; 

        if(!username || !password){
            return res.status(400).json({error : "Username and password are required."});
        }

        const result = await db.verifyUser(connection,users,username,password);
        if( 'rows' in result ) {
            const user = result.rows[0]
            const token = jwt.sign({ username: user.username }, jwtOptions.secretOrKey);
            // return res.json({ token }); 
            const sessionId = generateSessionId();
            activeSessions[user.username] = sessionId;
            return res.json({ token, sessionId }); 
        }
        
        else if( 'inCorrect' in result ) {
            res.status(401).send("INVALID CREDENTIALS.");
        }
        else {
            res.status(500).send("Error loggin in...")
        }
    })

    app.use(passport.authenticate('jwt', { session : false }),(req,res,next) => {
        const authHeader = req.headers.authorization;
        if(!authHeader){
            return res.status(401).send({ error : "No authorization header" });
        }
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, jwtOptions.secretOrKey);
            req.user = decoded;
            next();
        } catch(err) {
            return res.status(401).send({ error : 'Invalid Token'});
        }
    });

    app.get('/', (req, res) => {
        if (!req.user) {
          return res.status(401).send({ error: "Unauthorized access. User is not logged in." });
        }
        if (!activeSessions[req.user.username]) {
            return res.status(401).send({ error: "Unauthorized access. Session has expired or does not exist." });
        }
        
        res.send("Hello, " + req.user.username + "! Welcome to the protected area.");
    });

    
    app.post('/logout', (req,res) => {
        if(req.user.username in activeSessions){
            delete activeSessions[req.user.username];
            return res.send({message : "Session deleted."});
        }
        else{
            return res.send({message : "Session does not exist"});
            
        }
    });
      
    
    
    const port = process.env.PORT || 5005;
    app.listen(port, () => console.log(`Listening on port ${port}...`))
}

main();
