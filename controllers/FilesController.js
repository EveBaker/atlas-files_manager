import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    try {
      const id = await redisClient.get(`auth_${req.headers['x-token']}`);
      if (!id) return res.status(401).json({ error: 'Unauthorized' });

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

      if (parentId) {
        const parentFile = await dbClient.db.collection('users').findOne({
          _id: new dbClient.ObjectIDtId),
        });
        if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      let addedFile;
      const userId = new dbClient.ObjectID(id);

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
          fs.mkdirSync(FOLDER_PATH);
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
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      return res.status(200).json({ success: true });
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
      fileList = await dbClient.db.collection('files')
        .aggregate([
          { $match: { parentId: new dbClient.ObjectID(parentId) } },
          { $skip: page * 20 },
          { $limit: 20 },
        ])
        .toArray();
    } else {
      fileList = await dbClient.files.aggregate([
        { $match: { userId: new dbClient.ObjectID(userId) } },
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
      _id: new dbClient.ObjectID(id),
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
    const file = await dbClient.db.collection('files').findOne({
      _id: new dbClient.ObjectID(id),
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
    const file = await dbClient.db.collection('files').findOne({
      _id: new dbClient.ObjectID(id),
    });

    if (!file || userId !== file.userId) {
      return res.status(404).json({ error: 'Not found' });
    }
    file.isPublic = false;
    return res.json({ ...file });
  }
}

module.exports = FilesController;
