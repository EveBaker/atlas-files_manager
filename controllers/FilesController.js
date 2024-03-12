// controllers/FilesController.js
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ObjectID } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  // TASK 5 ROUTE
  static async postUpload(req, res) {
    try {
      // Authenticate user id by checking header fields token
      const id = await redisClient.get(`auth_${req.headers['x-token']}`);
      // if id not authenticated handle error
      if (!id) return res.status(401).json({ error: 'Unauthorized' });
      // file info for request body must include
      const {
        name,
        type,
        parentId = 0,
        isPublic = false,
        data,
      } = req.body;

      // type: either folder, file or image
      const VALID_TYPES = ['folder', 'file', 'image'];
      const typeCheck = VALID_TYPES.includes(type);

      // if name: as filename is missing
      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }
      // if type is missing or not part of the list of accepted type
      if (!type || !typeCheck) {
        return res.status(400).send({ error: 'Missing type' });
      }
      // If the data is missing and type != folder
      if (type !== 'folder' && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }

      let addedFile;
      const userId = new ObjectID(id);

      if (parentId !== 0) {
        const parentFile = await dbClient.db.collection('files')
          .findOne({ _id: new ObjectID(parentId) });

        if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      if (type === 'folder') {
        addedFile = await dbClient.db.collection('files').insertOne({
          userId,
          name,
          type,
          isPublic,
          parentId,
        });
      } else {
        const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
        if (!fs.existsSync(FOLDER_PATH)) {
          await fs.promises.mkdir(FOLDER_PATH, { recursive: true });
        }

        const filename = uuidv4();
        const filePath = path.join(FOLDER_PATH, filename);

        const decode = Buffer.from(data, 'base64').toString();

        fs.promises.writeFile(filePath, decode);

        addedFile = await dbClient.db.collection('files').insertOne({
          userId,
          name,
          type,
          isPublic,
          parentId,
          localPath: filePath, // Store the local path in the database
        });
      }
      return res.status(201).json({
        id: addedFile.insertedId,
        userId,
        name,
        type,
        isPublic,
        parentId,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // TASK 6 ROUTES
  static async getShow(req, res) {
    try {
      const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const file = await dbClient.db.collection('files').findOne({
        _id: new ObjectID(req.params.id),
        userId: new ObjectID(userId),
      });
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.json(file);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getIndex(req, res) {
    try {
      const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const parentId = req.query.parentId || '0';
      const page = parseInt(req.query.page, 10) || 0;
      const limit = 20;

      const files = await dbClient.db.collection('files').find({
        userId: new ObjectID(userId),
        parentId: parentId === '0' ? parentId : new ObjectID(parentId),
      }).skip(page * limit).limit(limit)
        .toArray();

      return res.json(files.map((file) => ({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      })));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // TASK 7 ROUTES
  static async putPublish(req, res) {
    try {
      const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const fileId = req.params.id;
      if (!ObjectID.isValid(fileId)) {
        return res.status(400).json({ error: 'Invalid file ID' });
      }

      const updateResult = await dbClient.db.collection('files').findOneAndUpdate(
        { _id: ObjectID(fileId), userId: ObjectID(userId) },
        { $set: { isPublic: true } },
        { returnOriginal: false },
      );

      if (!updateResult.value) return res.status(404).json({ error: 'Not found' });

      return res.status(200).json(updateResult.value);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async putUnpublish(req, res) {
    try {
      const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const fileId = req.params.id;
      if (!ObjectID.isValid(fileId)) {
        return res.status(400).json({ error: 'Invalid file ID' });
      }

      const updateResult = await dbClient.db.collection('files').findOneAndUpdate(
        { _id: ObjectID(fileId), userId: ObjectID(userId) },
        { $set: { isPublic: false } },
        { returnOriginal: false },
      );

      if (!updateResult.value) return res.status(404).json({ error: 'Not found' });

      return res.status(200).json(updateResult.value);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // TASK 8 ROUTES
}
static async getFile(req, res) {
  const { id } = req.params;
  if (!id || id === '') {
    return res.status(404).json({ error: 'Not found' });
  }
  let search = [];
  try {
    search = await dbClient.db.collection('files').find({ _id: ObjectId(id) }).toArray();
  } catch (e) {
    return (res.status(404).json({ error: 'Not found' }));
  }
  if (!search || search.length < 1) {
    return (res.status(404).json({ error: 'Not found' }));
  }
  if (search[0].type === 'folder') {
    return res.status(400).json({ error: 'A folder doesn\'t have content' });
  }
  if (search[0].isPublic === false) {
    const key = req.header('X-Token');
    const session = await redisClient.get(`auth_${key}`);
    if (!key || key.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (session) {
      let search1 = [];
      try {
        search1 = await dbClient.db.collection('files').find({ _id: ObjectId(id), userId: ObjectId(session) }).toArray();
      } catch (e) {
        return (res.status(404).json({ error: 'Not found' }));
      }
      if (!search1 || search1.length < 1) {
        return (res.status(404).json({ error: 'Not found' }));
      }
      if (!fs.existsSync(search1[0].localPath)) {
        return res.status(404).json({ error: 'Not found' });
      }

      const type = mime.contentType(search1[0].name);
      const charset = type.split('=')[1];
      try {
        const data = fs.readFileSync(search1[0].localPath, charset);
        return res.send(data);
      } catch (e) {
        return (res.status(404).json({ error: 'Not found' }));
      }
    }
    return res.status(404).json({ error: 'Not found' });
  }
}

module.exports = FilesController;
