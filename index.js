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
    const productsCollection = database.collection('products');
    const importsCollection = database.collection('imports');

    
    // Get all products (sorted by latest)
    app.get('/api/products', async (req, res) => {
      try {
        const result = await productsCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error fetching products', error: error.message });
      }
    });

    // Get latest 6 products for home page
    app.get('/api/products/latest', async (req, res) => {
      try {
        const result = await productsCollection
          .find()
          .sort({ createdAt: -1 })
          .limit(6)
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error fetching latest products', error: error.message });
      }
    });

    // Get single product by ID
    app.get('/api/products/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await productsCollection.findOne(query);
        
        if (!result) {
          return res.status(404).send({ message: 'Product not found' });
        }
        
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error fetching product', error: error.message });
      }
    });

    // Get products by user email (My Exports)
    app.get('/api/products/user/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const query = { addedBy: email };
        const result = await productsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error fetching user products', error: error.message });
      }
    });

    // Add new product (Add Export)
    app.post('/api/products', async (req, res) => {
      try {
        const newProduct = {
          ...req.body,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const result = await productsCollection.insertOne(newProduct);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error adding product', error: error.message });
      }
    });

    // Update product
    app.put('/api/products/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            ...req.body,
            updatedAt: new Date()
          }
        };
        const result = await productsCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error updating product', error: error.message });
      }
    });

    // Update product quantity (used when importing)
    app.patch('/api/products/:id/quantity', async (req, res) => {
      try {
        const id = req.params.id;
        const { quantity } = req.body;
        const filter = { _id: new ObjectId(id) };
        
        // Decrease the available quantity
        const updateDoc = {
          $inc: { availableQuantity: -quantity },
          $set: { updatedAt: new Date() }
        };
        
        const result = await productsCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error updating quantity', error: error.message });
      }
    });

    // Delete product
    app.delete('/api/products/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await productsCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error deleting product', error: error.message });
      }
    });

    // ==================== IMPORTS ROUTES ====================

    // Get all imports by user email
    app.get('/api/imports/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const query = { userId: email };
        const result = await importsCollection
          .find(query)
          .sort({ importedAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error fetching imports', error: error.message });
      }
    });

    // Add new import
    app.post('/api/imports', async (req, res) => {
      try {
        const newImport = {
          ...req.body,
          importedAt: new Date()
        };
        const result = await importsCollection.insertOne(newImport);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error adding import', error: error.message });
      }
    });

    // Delete import
    app.delete('/api/imports/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await importsCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error deleting import', error: error.message });
      }
    });

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