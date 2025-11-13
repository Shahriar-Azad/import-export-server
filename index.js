const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001;

// ✅ FIXED CORS CONFIGURATION
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Allow your frontend
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // ✅ Added PATCH
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    
    console.log("Connected to MongoDB!");

    const database = client.db('importExportHub');


    

    // ==================== HEALTH CHECK ====================
    
    app.get('/', (req, res) => {
      res.send('Import Export Hub Server is Running!');
    });

    // Ping to confirm successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");

  } catch (error) {
    console.error('MongoDB Connection Error:', error);
  }
}

run().catch(console.dir);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});