const express = require("express");
const cors = require("cors");
require("dotenv").config();

const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// ==========================
// Verify JWT Token
// ==========================
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({
            message: "Unauthorized Access",
        });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if (err) {
                return res.status(401).send({
                    message: "Unauthorized Access",
                });
            }

            req.decoded = decoded;
            next();
        }
    );
};

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8eggrxa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Mongo Client
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
        const productsCollection = database.collection("products");

        // ==========================
        // JWT API
        // ==========================
        app.post("/jwt", async (req, res) => {
            const user = req.body;

            const token = jwt.sign(
                user,
                process.env.ACCESS_TOKEN_SECRET,
                {
                    expiresIn: "1h",
                }
            );

            res.send({ token });
        });

        // ==========================
        // Save User
        // ==========================
        app.post("/users", async (req, res) => {
            const user = req.body;

            const existingUser = await usersCollection.findOne({
                email: user.email,
            });

            if (existingUser) {
                return res.send({
                    message: "User already exists",
                    inserted: false,
                });
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        // ==========================
        // Get All Users (Protected)
        // ==========================
        app.get("/users", verifyToken, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });

        // ==========================
        // Get User by Email
        // ==========================
        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;

            const query = { email };

            const result = await usersCollection.findOne(query);

            res.send(result);
        });

        // ==========================
        // Update Last Login
        // ==========================
        app.patch("/users", async (req, res) => {
            const { email } = req.body;

            const filter = { email };

            const updatedDoc = {
                $set: {
                    last_log_in: new Date(),
                },
            };

            const result = await usersCollection.updateOne(
                filter,
                updatedDoc
            );

            res.send(result);
        });

        // ==========================
        // Add Product
        // ==========================
        app.post("/products", async (req, res) => {
            const product = req.body;

            const result = await productsCollection.insertOne(product);

            res.send(result);
        });

        // Ping MongoDB
        await client.db("admin").command({ ping: 1 });
        console.log("✅ Connected to MongoDB!");
    } catch (error) {
        console.log(error);
    }
}

run().catch(console.dir);

// Root Route
app.get("/", (req, res) => {
    res.send("ReSell Hub Server is Running...");
});

// Start Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});