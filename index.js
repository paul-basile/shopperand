import 'dotenv/config';
import express from 'express';
import { supabase } from './supabase.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Express server is running!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// GET /api/products?category=Electronics&inStock=true
app.get('/api/products', async (req, res) => {
  let query = supabase
    .from('products')   /* database commands like SQL */
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (req.query.category) {
    query = query.eq('category', req.query.category);
  }
  if (req.query.inStock === 'true') {
    query = query.gt('stock_quantity', 0);
  }

  /* error checking */
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/products/:id
app.get('/api/products/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('products')   /* database commands like SQL */
    .select('*')
    .eq('id', req.params.id)
    .eq('is_active', true)
    .single();

  /* error checking */
  if (error) return res.status(404).json({ error: 'Product not found' });
  res.json(data);
});

// POST /api/products
app.post('/api/products', async (req, res) => {
    /* data contents to be inputted */
  const { name, description, price, stock_quantity, category, image_url } = req.body;

  /* checks for required fields */
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required' });
  }
  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'price must be a number >= 0' });
  }
  if (stock_quantity != null && (!Number.isInteger(stock_quantity) || stock_quantity < 0)) {
    return res.status(400).json({ error: 'stock_quantity must be a non-negative integer' });
  }

  const { data, error } = await supabase
    .from('products')
    /* insert new product */
    .insert({ name, description, price, stock_quantity, category, image_url })
    .select()
    .single();

  /* error checking */
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/* PATCH allows for fields to be edited */
app.patch('/api/products/:id', async (req, res) => {
  const allowed = ['name', 'description', 'price', 'stock_quantity', 'category', 'image_url', 'is_active'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowed.includes(key))
  );

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(404).json({ error: 'Product not found or update failed' });
  res.json(data);
});

/* the DELETE route just updates the is_active field to false */
app.delete('/api/products/:id', async (req, res) => {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

/* server run message */
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});