
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb + srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8eggrxa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create Mongo Client
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        // await client.connect();

        const database = client.db("resellHubDB");
        const usersCollection = database.collection("users");

        // Test MongoDB Connection
        await client.db("admin").command({ ping: 1 });
        console.log("✅ Connected to MongoDB!");
    } finally {
        // await client.close();
    }
}

run().catch(console.dir);

// Default Route
app.get("/", (req, res) => {
    res.send("ReSell Hub Server is Running...");
});

// Start Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
