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
// task 2 routes
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// task 3 routes
router.post('/users', UsersController.postNew);

// task 4 routes
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

// task 5 routes
router.post('/files', FilesController.postUpload);

// task 6 routes
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);

// task 7 routes
router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);

// task 8 routes
router.get('/files/:id/data', FilesController.getFile);

module.exports = router;
