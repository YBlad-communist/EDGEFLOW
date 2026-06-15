const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const YOOKASSA_URL = 'https://api.yookassa.ru/v3/payments';

function getAuth() {
  const shopId = process.env.YOOKASSA_SHOP_ID || 'test_shop';
  const secretKey = process.env.YOOKASSA_SECRET_KEY || 'test_key';
  return { username: shopId, password: secretKey };
}

const yookassaService = {
  async createPayment({ amount, description, returnUrl, metadata }) {
    const payload = {
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: returnUrl,
      },
      capture: true,
      description,
      metadata,
    };

    const res = await axios.post(YOOKASSA_URL, payload, {
      auth: getAuth(),
      headers: {
        'Idempotence-Key': uuidv4(),
        'Content-Type': 'application/json',
      },
    });
    return res.data;
  },

  async getPayment(yookassaPaymentId) {
    const res = await axios.get(`${YOOKASSA_URL}/${yookassaPaymentId}`, {
      auth: getAuth(),
    });
    return res.data;
  },

  async capturePayment(yookassaPaymentId, amount) {
    const res = await axios.post(
      `${YOOKASSA_URL}/${yookassaPaymentId}/capture`,
      { amount: { value: amount.toFixed(2), currency: 'RUB' } },
      {
        auth: getAuth(),
        headers: { 'Idempotence-Key': uuidv4() },
      }
    );
    return res.data;
  },
};

module.exports = yookassaService;
