const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const path = require('path');
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
const orders = {};
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.post('/create-payment', async (req, res) => {
  try {
    const { amount, orderId, buyerEmail } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), currency: 'ils',
      payment_method_types: ['card'],
      metadata: { platform: 'vaben', orderId, buyerEmail }
    });
    orders[orderId] = { paymentIntentId: paymentIntent.id, amount: Math.round(amount), buyerEmail, status: 'paid_escrow' };
    res.json({ clientSecret: paymentIntent.client_secret, orderId });
  } catch (err) { res.status(400).json({ error: err.message }); }
});
app.post('/confirm-received', async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = orders[orderId];
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    if (order.status === 'released') return
