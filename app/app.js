// import deps
import express from 'express'
import cookieParser from 'cookie-parser'
import createError from 'http-errors'
import logger from 'morgan'

// import routes
import indexRouter from './routes/index'

// create app
const app = express();

// modules
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// routes
app.use('/', indexRouter);

// catchall route (404)
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  const status = err.status || 500;
  const error = req.app.get('env') === 'development' ? err : undefined;

  const json = { status }
  if (error) {
    json = {
      ...json,
      error
    }
  }

  res.status(status)
  res.json(json)
});

export default app;