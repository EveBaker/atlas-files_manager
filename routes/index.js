/** routes/index.js
 * contains all endpoints of our API:
 * GET /status => AppController.getStatus
 * GET /stats => AppController.getStats
 * POST /users => UsersController.postNew
 * GET /connect => AuthController.getConnect
 * GET /disconnect => AuthController.getDisconnect
 * GET /users/me => UserController.getMe
 * POST /files => FilesController.postUpload
 * GET /files/:id => FilesController.getShow
 * GET /files => FilesController.getIndex
 * PUT /files/:id/publish => FilesController.putPublish
 * PUT /files/:id/publish => FilesController.putUnpublish
 * GET /files/:id/data => FilesController.getFile
 */
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const express = require('express');

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

router.get('/connect', AuthController.getConnect);

router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

router.post('/users', UsersController.postNew);
router.post('/files', FilesController.postUpload);

module.exports = router;
