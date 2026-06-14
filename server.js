const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

const orders = {};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/create-payment', async (req, res) => {
  try {
    const { amount, orderId, buyerEmail } = req.body;
    const pi = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: 'ils',
      payment_method_types: ['card'],
      metadata: { orderId: orderId, buyer: buyerEmail }
    });
    orders[orderId] = { paymentIntentId: pi.id, amount: Math.round(amount), status: 'escrow' };
    res.json({ clientSecret: pi.client_secret });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/confirm-received', async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = orders[orderId];
    if (!order) return res.status(404).json({ error: 'Not found' });
    orders[orderId].status = 'released';
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
