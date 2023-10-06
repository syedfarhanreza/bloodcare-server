const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.44o57rw.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, { serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true, } });

function verifyJWT(req, res, next) {
    // console.log('token inside VerifyJWT', req.headers.authorization);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const bloodGroupCollection = client.db('BloodCare').collection('bloodGroups');
        const requestsCollection = client.db('BloodCare').collection('requests');
        const usersCollection = client.db('BloodCare').collection('users');
        const hospitalsCollection = client.db('BloodCare').collection('hospitals');
        const blogsCollection = client.db('BloodCare').collection('blogs');

        // make sure you use verifyAdmin after verifyJwt
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'Forbidden access' })
            }
            next();
        }

       

        app.get('/bloodGroups', async (req, res) => {
            const date = req.query.date;
            const query = {};
            const options = await bloodGroupCollection.find(query).toArray();
            res.send(options);
        });

        app.get('/requests', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const query = { email: email };
            const requests = await requestsCollection.find(query).toArray();
            res.send(requests);
        })

        app.post('/requests', async (req, res) => {
            const request = req.body;
            const result = await requestsCollection.insertOne(request);
            res.send(result);
        });

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN)
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        })

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
        app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const userId = req.params.id;
            const filter = { _id: new ObjectId(userId) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });
        app.delete('/users/:id', verifyJWT, verifyAdmin, async(req, res) => {
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)};
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        });

        app.get('/hospitals', verifyJWT, verifyAdmin, async(req, res) => {
            const query = {};
            const hospitals = await hospitalsCollection.find(query).toArray();
            res.send(hospitals);
        });

        app.post('/hospitals',verifyJWT, verifyAdmin, async(req, res) => {
            const hospital = req.body;
            const result = await hospitalsCollection.insertOne(hospital);
            res.send(result);
        });
        app.delete('/hospitals/:id', verifyJWT, verifyAdmin, async(req, res) => {
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)};
            const result = await hospitalsCollection.deleteOne(filter);
            res.send(result);
        });
        app.get('/blogs', verifyJWT, verifyAdmin, async(req, res) => {
            const query = {};
            const blogs = await blogsCollection.find(query).toArray();
            res.send(blogs);
        });
        app.post('/blogs',verifyJWT, verifyAdmin, async(req, res) => {
            const blog = req.body;
            const result = await blogsCollection.insertOne(blog);
            res.send(result);
        });

    }
    finally {

    }
}
run().catch(console.log);


app.get('/', async (req, res) => {
    res.send('BloodCare server is running');
})

app.listen(port, () => console.log(`BloodCare running on ${port}`));