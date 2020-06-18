import express from 'express'
const router = express.Router();

/* POST /upload */
router.post('/upload', function(req, res, next) {
  res.json([])
});

export default router;
