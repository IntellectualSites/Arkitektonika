import express from 'express'
const router = express.Router();

/* GET /download */
router.get('/download', function(req, res, next) {
  res.json({})
});

export default router;
