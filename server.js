const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
    console.log(err.name, err.message);
    console.log('Uncaught Exception 💣 Shutting down server');
    process.exit(1); 
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    }).then(() => console.log('Connected to database'));

// 4) Server
const port =process.env.PORT;
const server = app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}...`)
});


process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    console.log('Unhandled rejection 💣 Shutting down server');
    server.close(() => {
        process.exit(1);  
    }); 
});


