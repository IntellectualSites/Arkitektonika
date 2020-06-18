import express from 'express'
const router = express.Router();

/* GET / */
router.get('/', function(req, res, next) {
  res.json({
    name: process.env.npm_package_name,
    version: process.env.npm_package_version,
    made: {
      with: 'love',
      by: 'IntellectualSites'
    }
  })
});

export default router;
