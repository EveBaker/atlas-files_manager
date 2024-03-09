/** routes/index.js
 * contains all endpoints of our API:
 * GET /status => AppController.getStatus
 * GET /stats => AppController.getStats
 * POST /users => UsersController.postNew
 */
const express = require('express');

const router = express.Router();

const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

router.post('/users', UsersController.postNew);

module.exports = router;
