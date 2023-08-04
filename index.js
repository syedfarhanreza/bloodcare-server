const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.44o57rw.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {serverApi: {version: ServerApiVersion.v1,strict: true,deprecationErrors: true,}});

async function run(){
    try{
        const bloodGroupCollection = client.db('BloodCare').collection('bloodGroups');
        const requestsCollection = client.db('BloodCare').collection('requests');
        const usersCollection = client.db('BloodCare').collection('users');

        app.get('/bloodGroups', async(req, res) => {
            const date = req.query.date;
            const query = {};
            const options = await bloodGroupCollection.find(query).toArray();
            res.send(options);
        });

        app.get('/requests', async(req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const requests = await requestsCollection.find(query).toArray();
            res.send(requests);
        })

        app.post('/requests', async(req, res) => {
            const request = req.body;
            const result = await requestsCollection.insertOne(request);
            res.send(result);
        });

        app.post('/users', async(req, res) => {
           const user = req.body;
           console.log(user);
           const result = await usersCollection.insertOne(user);
           res.send(result); 
        });
    }
    finally{
      
    }
}
run().catch(console.log);


app.get('/', async(req, res) => {
    res.send('BloodCare server is running');
})

app.listen(port,() => console.log(`BloodCare running on ${port}`));