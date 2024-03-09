import mon from ('../mongodb');
const fs = require('fs');
import { v4: uuidv4 } from ('uuid');
const Mongo = require('../utils/db');
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController (req, res) {
    static asyncPostUpload(req, res) {
        const id = await RedisClient.get('auth_$(req.headers['x-token']}');
        if (!id) return res.status(401).json({ error: 'Unauthorized' });

        const {
            name, 
            type, 
            parentId = 0,
            isPublic = false,
            data,
        } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type) return res.status(400).json({ error: 'Missing type' });
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId) {
        const file = await Mongo.files.findOne({ _id: new mon.ObjectID(parentId) });
        if (!file) return res.status(400).json({ error: 'Parent not found' });
        if (file.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }
}
}