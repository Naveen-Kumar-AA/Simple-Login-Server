# Simple-Login-Server
This project is a simple authentication system using JSON Web Token (JWT) in Node.js using the Express.js framework.

    Requiring necessary packages: 
        The first few lines require the necessary packages for the implementation, such as express, cors, dotenv, pgsql for connecting to the PostgreSQL database, passport, passport-jwt for implementing JWT authentication, and jsonwebtoken for generating and verifying JSON Web Tokens.

    Configuration and Initialization:
        The app.use method is used to apply the middleware to the Express application. The cors middleware is used to handle Cross-Origin Resource Sharing (CORS), and the express.json middleware is used to parse JSON in the body of requests.
        The dotenv package is used to configure environment variables defined in a .env file.
        A connection to the database is established using the db.connectDB function.
        The JWT strategy is set up using the JwtStrategy and ExtractJwt from the passport-jwt package.
        A new table is created in the database using the db.createTableIfNotExists function if it doesn't already exist.

    Endpoints:
        The /signup endpoint allows a user to sign up by sending a POST request with their information in the request body. The db.insertData function is used to insert the user's data into the database. If the insertion is successful, a JSON Web Token is generated for the user and a session ID is generated for tracking active sessions.
        The /login endpoint allows a user to log in by sending a POST request with their username and password in the request body. The db.verifyUser function is used to verify the user's credentials and return the user's information if they are correct. If the credentials are correct, a JSON Web Token is generated for the user and a session ID is generated for tracking active sessions.
        The / endpoint is protected by the JWT authentication middleware. If the user is successfully authenticated, they will be able to access this endpoint and receive a message welcoming them to the protected area.
        The /logout endpoint allows a user to log out by sending a POST request. The active session for the user is deleted from the activeSessions object.

    Port Configuration: 
        The application is set to listen on port process.env.PORT or port 5005 if the environment variable is not defined.
