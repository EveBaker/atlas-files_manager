// controllers/FilesController.js
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ObjectID } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
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
        parentId = '0',
        isPublic = false,
        data,
      } = req.body;

      if (!name) return res.status(400).json({ error: 'Missing name' });
      if (!type) return res.status(400).json({ error: 'Missing type' });
      if (type !== 'folder' && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }

      let addedFile;
      const userId = new ObjectID(id);

      if (parentId !== '0') {
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
          fs.promises.mkdirSync(FOLDER_PATH);
        }

        const filePath = `${FOLDER_PATH}/${uuidv4()}`;
        const decode = Buffer.from(data, 'base64').toString();

        await fs.promises.writeFile(filePath, decode);

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

  static async getFile(req, res) {
    try {
      const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params; // Extract the file ID from the request parameters
      if (!id) {
        return res.status(400).json({ error: 'Missing file ID' });
      }

      // Attempt to retrieve the file from the database
      const file = await dbClient.db.collection('files').findOne({
        _id: new ObjectID(id),
      });

      // Check if the file exists and if the user is authorized to access it
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Check if the file is public or if the requestor is the owner
      if (!file.isPublic && file.userId.toString() !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Respond with the file details
      const response = {
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      };
      return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getFiles(req, res) {
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { parentId, page = 0 } = req.query;
    let fileList;
    if (parentId) {
      fileList = await dbClient.db
        .collection('files')
        .aggregate([
          { $match: { parentId: new ObjectID(parentId) } },
          { $skip: page * 20 },
          { $limit: 20 },
        ])
        .toArray();
    } else {
      fileList = await dbClient.files
        .aggregate([
          { $match: { userId: new ObjectID(userId) } },
          { $skip: page * 20 },
          { $limit: 20 },
        ])
        .toArray();
    }
    return res.json(
      fileList.map((file) => ({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      })),
    );
  }

  static async getFileData(req, res) {
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);

    const { id } = req.params;
    const file = await dbClient.db.collection('files').findOne({
      _id: new ObjectID(id),
    });

    if (!file || (!file.isPublic && (!userId || userId !== file.userId))) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    if (!fs.existsSync(file.localPath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    fs.readFile(file.localPath, (err, data) => res.send(data));
    return null;
  }

  static async setPublic(req, res) {
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const file = await dbClient.db.collection('files').findOneAndUpdate({
      _id: new ObjectID(id),
    });

    if (!file || userId !== file.userId) {
      return res.status(404).json({ error: 'Not found' });
    }
    file.isPublic = true;
    return res.json({ ...file });
  }

  static async setPrivate(req, res) {
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const file = await dbClient.db.collection('files').findOneAndUpdate({
      _id: new ObjectID(id),
    });

    if (!file || userId !== file.userId) {
      return res.status(404).json({ error: 'Not found' });
    }
    file.isPublic = false;
    return res.json({ ...file });
  }

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
}

async function saveFileToDisk(base64Data) {
  const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
  await fs.mkdir(FOLDER_PATH, { recursive: true });

  const fileName = uuidv4();
  const filePath = `${FOLDER_PATH}/${fileName}`;
  await fs.writeFile(filePath, Buffer.from(base64Data, 'base64'));

  return filePath;
}

module.exports = FilesController;
