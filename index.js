const jsonServer = require("json-server"); // importing json-server library
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();
const { Storage } = require('@google-cloud/storage');
const storage = new Storage({
    keyFilename: './landscapedata-f06c3640da25.json',
    projectId: 'landscapedata',
});

const bucket = storage.bucket('land-data-bucket');

server.use((req, res, next) => {
    if (req.method === 'POST' && req.path === '/visitors') {
        const newData = req.body;

        const fileName = 'data.json';
        const file = bucket.file(fileName);

        file.exists()
            .then(data => {
                const fileExists = data[0];

                if (!fileExists) {
                    // If the file doesn't exist yet, create it with the new data
                    const initialData = { visitors: [newData] };
                    return file.save(JSON.stringify(initialData), { encoding: 'utf-8' });
                }

                // If the file exists, update the data
                return file.download();
            })
            .then(data => {
                const currentData = JSON.parse(data.toString());

                // Update the data with the new information
                currentData.visitors.push(newData);

                // Upload the updated data back to the file
                return file.save(JSON.stringify(currentData), { encoding: 'utf-8' });
            })
            .then(() => {
                console.log('Data updated in Google Cloud Storage');
                res.json({ success: true });
            })
            .catch(err => {
                console.error('Error updating data in Google Cloud Storage:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            });
    } else {
        // Continue with the regular JSON Server routing
        next();
    }
});



const port = process.env.PORT || 8080; //  chose port from here like 8080, 3001

server.use(middlewares);
server.use(router);

server.listen(port, () => {
    console.log(`JSON Server is running on port ${port}`);
});