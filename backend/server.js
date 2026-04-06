const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const PORT = 3000;
const ethers = require('ethers');
const ipfs = require('ipfs-storage');

let items = [
    {
        id: 1,
        name: "item1"
    },
    {
        id: 2,
        name: "item2"
    },
    {
        id: 3,
        name: "item3"
    }
]

/*
 * Define routes
 */

// List existing items
app.get('/api/items',(request,response) => {
        response.json(items);
});

// Get item by id
app.get('/api/items/:id',(request,response) => {
    const id = parseInt(request.params.id);
    let item = items.find(item=> item.id === id);

    if (item) {
        response.json(item);
    } else {
        response.status(404).send('Not Found');
    }
})

// create new item
app.post('/api/items', (request,response) => {
    let payload = bodyParser.json(request.body);
    response.status(200).send(payload.name);
});

/*
* Start Server
*/

app.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
});

// Example Curl commands (curl doesn't have to be used)

// curl http://localhost:3000/api/items
// curl http://localhost:3000/api/items/1
// curl http://localhost:3000/api/items/2
// curl http://localhost:3000/api/items/3

// curl -X post -H "Content-Type: application/json" -d '{"id": 4, "name": "item4"}' http://localhost:3000/api/items

// run server with 
// node server.js
