const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:5173', 'https://import-export-hub-shahriarazad.netlify.app'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// MongoDB Connection
const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('MONGO_URI not found');
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    await client.connect();
    const db = client.db('importExportHub');
    cachedDb = db;
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Import Export Hub API is running!' });
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const products = await db.collection('products')
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Get latest 6 products
app.get('/api/products/latest', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const products = await db.collection('products')
      .find()
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching latest products:', error);
    res.status(500).json({ message: 'Error fetching latest products', error: error.message });
  }
});

// Get single product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const db = await connectToDatabase();
    const product = await db.collection('products').findOne({ _id: new ObjectId(id) });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

// Get products by user email
app.get('/api/products/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const db = await connectToDatabase();
    const products = await db.collection('products')
      .find({ addedBy: email })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching user products:', error);
    res.status(500).json({ message: 'Error fetching user products', error: error.message });
  }
});

// Add new product
app.post('/api/products', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const newProduct = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('products').insertOne(newProduct);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Error adding product', error: error.message });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const db = await connectToDatabase();
    const updateDoc = {
      $set: {
        ...req.body,
        updatedAt: new Date()
      }
    };
    
    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(id) },
      updateDoc
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

// Update product quantity
app.patch('/api/products/:id/quantity', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const db = await connectToDatabase();
    const updateDoc = {
      $inc: { availableQuantity: -quantity },
      $set: { updatedAt: new Date() }
    };
    
    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(id) },
      updateDoc
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).json({ message: 'Error updating quantity', error: error.message });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const db = await connectToDatabase();
    const result = await db.collection('products').deleteOne({ _id: new ObjectId(id) });
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

// Get imports by user email
app.get('/api/imports/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const db = await connectToDatabase();
    const imports = await db.collection('imports')
      .find({ userId: email })
      .sort({ importedAt: -1 })
      .toArray();
    
    res.json(imports);
  } catch (error) {
    console.error('Error fetching imports:', error);
    res.status(500).json({ message: 'Error fetching imports', error: error.message });
  }
});

// Add new import
app.post('/api/imports', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const newImport = {
      ...req.body,
      importedAt: new Date()
    };
    
    const result = await db.collection('imports').insertOne(newImport);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding import:', error);
    res.status(500).json({ message: 'Error adding import', error: error.message });
  }
});

// Delete import
app.delete('/api/imports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid import ID' });
    }

    const db = await connectToDatabase();
    const result = await db.collection('imports').deleteOne({ _id: new ObjectId(id) });
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting import:', error);
    res.status(500).json({ message: 'Error deleting import', error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;