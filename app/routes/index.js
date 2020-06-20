import express from 'express'

export default function() {
  const router = express.Router();

  /**
   * Hiya!
   * Returns:
   * - HTTP 200: always
   */
  router.get('/', function(req, res, next) {
    res.json({
      name: process.env.npm_package_name,
      version: process.env.npm_package_version,
      made: {
        with: 'love',
        by: 'IntellectualSites'
      }
    })
  })

  return router
}
