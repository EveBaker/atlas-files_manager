import fs from 'fs';
import {v4 as uuidv4} from 'uuid';
import dbClient from '../utils/db';
import RedisClient from '../utils/redis';
import mon = from ('mongodb');

class FilesController {
    static async postUpload(req, res) {
        try {
            const id = await RedisClient.get(`auth_${req.headers['x-token']}`);
            if (!id) return res.status(401).json({ error: 'Unauthorized' });

            const {
                name,
                type,
                parentId = 0,
                isPublic = false,
                data,
            } = req.body;

            if (!name) return res.status(400).json({error: 'Missing name'});
            if (!type) return res.status(400).json({error: 'Missing type'});
            if (!data && type !== 'folder') {
                return res.status(400).json({error: 'Missing data'});
            }

            if (parentId) {
                const file = await Mongo.files.findOne({ _id: new Mongo.ObjectID(parentId) });
                if (!file) return res.status(400).json({ error: 'Parent not found' });
                if (file.type !== 'folder') {
                    return res.status(400).json({ error: 'Parent is not a folder' });
                }
            }

            let addedFile;
            const userId = mon.ObjectId(id);
        
            if (type === 'folder') {
              addedFile = await Mongo.files.insertOne({
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

                addedFile = await Mongo.files.insertOne({
                  userId,
                  name,
                  type,
                  isPublic,
                  parentId,
                  filePath,
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
            }

            static async getFile(req, res) {
              const userId = await Redis.get(`auth_${req.headers['x-token']}`);
              if (!userId) return res.status(401).json({ error: 'Unauthorized' });
          
              const fileId = new mon.ObjectId(req.params.id);
              const file = await Mongo.files.findOne({ _id: fileId });
          
              if (!file || userId != file.userId) {
                return res.status(404).json({ error: 'Not found' });
              }

              return res.json({ ...file });
            }

            static async getFiles(req, res) {

              const userId = await Redis.get(`auth_${req.headers['x-token']}`);
              if (!userId) return res.status(401).json({ error: 'Unauthorized' });

              const { parentId, page = 0 } = req.query;
              let fileList;
              if (parentId) {
                fileList = await Mongo.files.aggregate([
                  { $match: { parentId: new mon.ObjectID(parentId) } },
                  { $skip: page * 20 },
                  { $limit: 20 },
                ]).toArray();
              } else {
                fileList = await Mongo.files.aggregate([
                  { $match: { userId: new mon.ObjectID(userId) } },
                  { $skip: page * 20 },
                  { $limit: 20 },
                ]).toArray();
              }
              return res.json(fileList.map((file) => ({
                id: file._id,
                userId: file.userId,
                name: file.name,
                type: file.type,
                isPublic: file.isPublic,
                parentId: file.parentId,
              })));
            }

            static async getFileData(req, res) {
              const userId = await Redis.get(`auth_${req.headers['x-token']}`);

              const { id } = req.params;
              const file = await Mongo.files.findOne({ _id: new mon.ObjectID(id) });


              if (!file || (!file.isPublic && (!userId || userId != file.userId))) {
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

              const userId = await Redis.get(`auth_${req.headers['x-token']}`);
              if (!userId) return res.status(401).json({ error: 'Unauthorized' });

              const { id } = req.params;
              const file = await Mongo.files.findOne({ _id: new mon.ObjectID(id) });

              if (!file || userId != file.userId) {
                return res.status(404).json({ error: 'Not found' });
              }
              file.isPublic = true;
              return res.json({ ...file });
            }

            static async setPrivate(req, res) {
              const userId = await Redis.get(`auth_${req.headers['x-token']}`);

              if (!userId) return res.status(401).json({ error: 'Unauthorized' });
              const { id } = req.params;
              const file = await Mongo.files.findOne({ _id: new mon.ObjectID(id) });

              if (!file || userId != file.userId) {
                return res.status(404).json({ error: 'Not found' });
              }
              file.isPublic = false;
              return res.json({ ...file });
            }
          }
    }


export default FilesController;
