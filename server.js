/** server.js
    2. First API
    Inside server.js,
    create the Express server:
    it should listen on the port set by the environment variable PORT or by default 5000
    it should load all routes from the file routes/index.js
*/
// create the express server
const express = require('express');

const app = express();

// set the environment variable PORT or default 5000
const PORT = process.env.PORT || 5000;

//  load all routes from the file routes/index.js
const routes = require('./routes');

// Middleware
app.use(express.json());

// use routes
app.use('/', routes);

//  listen on the port set by the environment variable PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
