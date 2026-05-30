const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { Guild, Subscription } = require('../models');

// Fetch guild premium status
router.get('/:guildId', authenticateToken, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    let sub = await Subscription.findOne({ guildId });
    if (!sub) {
      sub = new Subscription({
        guildId,
        plan: 'Basic',
        status: 'active'
      });
      await sub.save();
    }

    res.json({
      plan: sub.plan,
      status: sub.status,
      expiresAt: sub.expiresAt,
      features: {
        ocrLimit: sub.plan === 'Enterprise' ? -1 : (sub.plan === 'Pro' ? 10000 : 500),
        advancedAI: sub.plan !== 'Basic',
        customKeywords: sub.plan !== 'Basic',
        dedicatedSupport: sub.plan === 'Enterprise'
      }
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Subscribe checkout session placeholder (Stripe preparation)
router.post('/:guildId/subscribe', authenticateToken, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { plan } = req.body;

    if (!['Pro', 'Enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    // Stripe checkout integration mock
    const stripeCheckoutUrl = `https://checkout.stripe.com/pay/cs_test_mock_${Date.now()}`;

    // Temporarily upgrade guild for testing purposes
    let sub = await Subscription.findOne({ guildId });
    if (!sub) {
      sub = new Subscription({ guildId });
    }
    sub.plan = plan;
    sub.status = 'active';
    sub.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await sub.save();

    // Also update Guild model cache
    let guild = await Guild.findOne({ guildId });
    if (guild) {
      guild.premiumStatus = plan;
      await guild.save();
    }

    res.json({
      checkoutUrl: stripeCheckoutUrl,
      message: `Successfully simulated Stripe checkout flow for ${plan} plan!`
    });
  } catch (error) {
    console.error('Stripe mock checkout error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
