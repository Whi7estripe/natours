const AppError = require("../utils/appError");

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    // console.log(value);
    const message = `Duplicate field value entered: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
}

const handleJWTError = () => new AppError('Invalid Token', 401);

const handleJWTExpiredError = () => new AppError('Token expired, Please log in again', 401);

const sendErrorDev = (err, req, res) => {
    // A) API
    if (req.originalUrl.startsWith('/api')) {

        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } 
    // B) RENDERED WEBSITE
    console.log('ERROR 💣', err);
    return res.status(err.statusCode).render('error', {
        title: 'Something went Wrong!',
        msg: err.message,
    });
};

const sendErrorProd = (err, req, res) => {
    // A) API
    if (req.originalUrl.startsWith('/api')) {
        // a) Operational errors that we trust to display to the user
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });  
        }    
        // b) Production errors or unknown error that we don't trust to display to the user
        // 1) Log the error
        console.log('ERROR 💣', err);
        // 2) Send the error to the client
        return res.status(500).json({
            status: err,
            message: 'Something went wrong'
        });
    }
    // B) RENDERED WEBSITE
    // a) Operational errors that we trust to display to the user
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went Wrong!',
            msg: err.message
        });
    }     
    // b) Production errors or unknown error that we don't trust to display to the user
    // 1) Log the error
    console.log('ERROR 💣', err);
    // 2) Send the error to the client
    return res.status(err.statusCode).render('error', {
        title: 'Something went Wrong!',
        msg: 'Please try again later'
    });
};

module.exports = (err, req, res, next) => {

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'Error';

    if(process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if(process.env.NODE_ENV === 'production') {
        let error = Object.create(err);

        if(err.name === 'CastError') error = handleCastErrorDB(err);
        if(err.code === 11000) error = handleDuplicateFieldsDB(err);
        if(err.name === 'ValidationError') error = handleValidationErrorDB(err);
        if (err.name === 'JsonWebTokenError') error = handleJWTError(err);
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }
};