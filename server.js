const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.get('/', (req, res) => res.send('Vaben server running ✅'));
app.post('/create-payment', async (req, res) => {
  try {
    const { amount } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), currency: 'ils',
      payment_method_types: ['card']
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) { res.status(400).json({ error: err.message }); }
});
app.post('/transfer-to-seller', async (req, res) => {
  try {
    const { amount, sellerStripeId, paymentIntentId } = req.body;
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 0.995), currency: 'ils',
      destination: sellerStripeId, source_transaction: paymentIntentId
    });
    res.json({ success: true, transfer });
  } catch (err) { res.status(400).json({ error: err.message }); }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Vaben server on port ' + PORT));
