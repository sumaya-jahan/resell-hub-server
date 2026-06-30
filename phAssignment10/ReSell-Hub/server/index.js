const express = require("express");
const cors = require("cors");
require("dotenv").config();

const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const {
    MongoClient,
    ServerApiVersion,
    ObjectId,
} = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Verify JWT
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

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        const database = client.db("resellHubDB");

        const usersCollection = database.collection("users");
        const productsCollection = database.collection("products");

        // JWT
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

        // Save User
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

        // Get All Users
        app.get("/users", verifyToken, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });

        // Get User By Email
        app.get("/users/:email", async (req, res) => {
            const result = await usersCollection.findOne({
                email: req.params.email,
            });

            res.send(result);
        });

        // Update Last Login
        app.patch("/users", async (req, res) => {
            const result = await usersCollection.updateOne(
                { email: req.body.email },
                {
                    $set: {
                        last_log_in: new Date(),
                    },
                }
            );

            res.send(result);
        });
        // Add Product
        app.post("/products", async (req, res) => {
            const result = await productsCollection.insertOne(req.body);
            res.send(result);
        });

        // Get All Products
        app.get("/products", async (req, res) => {
            const result = await productsCollection.find().toArray();
            res.send(result);
        });

        // Get Single Product
        app.get("/products/:id", async (req, res) => {
            const id = req.params.id;

            const query = {
                _id: new ObjectId(id),
            };

            const result = await productsCollection.findOne(query);

            res.send(result);
        });

        // Get My Products
        app.get("/my-products/:email", async (req, res) => {
            const email = req.params.email;

            const query = {
                sellerEmail: email,
            };

            const result = await productsCollection.find(query).toArray();

            res.send(result);
        });

        // Delete Product
        app.delete("/products/:id", async (req, res) => {
            const id = req.params.id;

            const query = {
                _id: new ObjectId(id),
            };

            const result = await productsCollection.deleteOne(query);

            res.send(result);
        });

        // Update Product
        app.patch("/products/:id", async (req, res) => {
            const id = req.params.id;
            const updatedProduct = req.body;

            const query = {
                _id: new ObjectId(id),
            };

            const updatedDoc = {
                $set: {
                    title: updatedProduct.title,
                    category: updatedProduct.category,
                    condition: updatedProduct.condition,
                    price: parseFloat(updatedProduct.price),
                    image: updatedProduct.image,
                    description: updatedProduct.description,
                },
            };

            const result = await productsCollection.updateOne(
                query,
                updatedDoc
            );

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