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
const AuthController = require('../controllers/AuthController');

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

router.get('/connect', AuthController.getConnect);

router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);


router.post('/users', UsersController.postNew);

module.exports = router;
