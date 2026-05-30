import React from 'react';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { useStore } from '../store/useStore';
import Card from '../components/Card';
import Button from '../components/Button';
import './Premium.css';

const PricingCard = ({ tier, price, icon: Icon, features, isActivePlan, isPopular, onSubscribe, loading }) => (
  <Card hoverEffect className={`pricing-card ${isPopular ? 'popular' : ''}`} glow={isPopular}>
    {isPopular && <div className="popular-badge">Most Popular</div>}
    
    <div className="pricing-header">
      <div className={`tier-icon ${tier.toLowerCase()}`}>
        <Icon size={24} />
      </div>
      <h2 className="tier-name">{tier}</h2>
      <div className="tier-price">
        <span className="currency">$</span>
        <span className="amount">{price}</span>
        <span className="period">/mo</span>
      </div>
    </div>

    <div className="pricing-features">
      {features.map((feature, i) => (
        <div key={i} className="feature-item">
          <Check size={18} className="check-icon" />
          <span>{feature}</span>
        </div>
      ))}
    </div>

    <Button 
      className="pricing-btn" 
      variant={isActivePlan ? 'secondary' : (isPopular ? 'primary' : 'outline')}
      onClick={() => !isActivePlan && onSubscribe(tier)}
      disabled={loading || isActivePlan}
    >
      {isActivePlan ? 'Active Plan' : (loading ? 'Loading...' : 'Upgrade Now')}
    </Button>
  </Card>
);

const Premium = () => {
  const { activeGuild, premium, premiumLoading, subscribeToPlan } = useStore();

  const handleSubscribe = async (tier) => {
    const checkoutUrl = await subscribeToPlan(tier);
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  };

  if (!activeGuild) {
    return (
      <div className="empty-dashboard-state">
        <h2>No Guild Selected</h2>
        <p>Please select a Discord server to review its subscription status.</p>
      </div>
    );
  }

  const currentPlan = premium?.plan || 'Basic';

  return (
    <div className="premium-page">
      <div className="premium-header text-center">
        <h1 className="premium-title">
          Upgrade to <span className="text-gradient-primary">ANTIFY Pro</span>
        </h1>
        <p className="premium-subtitle">
          Unlock advanced AI models, higher OCR limits, and priority protection for <strong>{activeGuild.name}</strong>.
        </p>
      </div>

      <div className="pricing-grid">
        <PricingCard 
          tier="Basic"
          price="0"
          icon={Star}
          isActivePlan={currentPlan === 'Basic'}
          features={[
            'Basic Link Scanning',
            'Standard Spam Filters',
            '500 OCR Scans/mo',
            'Community Support'
          ]}
          onSubscribe={handleSubscribe}
          loading={premiumLoading}
        />
        
        <PricingCard 
          tier="Pro"
          price="9.99"
          icon={Zap}
          isPopular
          isActivePlan={currentPlan === 'Pro'}
          features={[
            'Advanced AI Heuristics',
            'Real-time Threat DB Updates',
            '10,000 OCR Scans/mo',
            'Priority Support',
            'Custom Keywords'
          ]}
          onSubscribe={handleSubscribe}
          loading={premiumLoading}
        />

        <PricingCard 
          tier="Enterprise"
          price="49.99"
          icon={Crown}
          isActivePlan={currentPlan === 'Enterprise'}
          features={[
            'Everything in Pro',
            'Unlimited OCR Scans',
            'Dedicated Account Manager',
            'Custom AI Models',
            'White-label Reports'
          ]}
          onSubscribe={handleSubscribe}
          loading={premiumLoading}
        />
      </div>
    </div>
  );
};

export default Premium;
