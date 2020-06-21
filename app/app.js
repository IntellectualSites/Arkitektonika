// import deps
import express from 'express'
import cookieParser from 'cookie-parser'
import createError from 'http-errors'
import logger from 'morgan'
import cors from 'cors'
import database from './util/database'

// import routes
import indexRouter from './routes/index'
import uploadRouter from './routes/upload'
import downloadRouter from './routes/download'
import deleteRouter from './routes/delete'

// create app
const app = express();

// modules
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors())

// routes
app.use(indexRouter());
app.use(uploadRouter(database));
app.use(downloadRouter(database));
app.use(deleteRouter(database));

// catchall route (404)
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  const status = err.status || 500;
  const error = req.app.get('env') === 'development' ? err : undefined;

  let json = { status }
  if (error) {
    json = {
      ...json,
      error: error.message
    }
  }

  res.status(status)
  res.json(json)
});

(async () => {
  // set up db
  await database.init()
})();

export default app;