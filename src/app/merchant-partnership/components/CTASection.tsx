'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

const CTASection = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    location: '',
    category: '',
    monthlyRevenue: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isHydrated) {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          businessName: '',
          ownerName: '',
          email: '',
          phone: '',
          location: '',
          category: '',
          monthlyRevenue: ''
        });
      }, 3000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (isHydrated) {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  if (!isHydrated) {
    return (
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="space-y-4">
                  <div className="h-12 bg-muted rounded" />
                  <div className="h-12 bg-muted rounded" />
                  <div className="h-12 bg-muted rounded" />
                </div>
                <div className="space-y-4">
                  <div className="h-12 bg-muted rounded" />
                  <div className="h-12 bg-muted rounded" />
                  <div className="h-12 bg-muted rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
          <div className="grid lg:grid-cols-2">
            <div className="bg-gradient-to-br from-primary to-secondary p-8 lg:p-12 text-white">
              <h2 className="font-headline font-bold text-3xl lg:text-4xl mb-6">
                Ready to Grow Your Business?
              </h2>
              <p className="text-lg opacity-90 mb-8 leading-relaxed">
                Join thousands of merchants who are increasing revenue, acquiring new customers, and supporting their communities through eVoucher.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="ClockIcon" size={24} variant="outline" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-lg mb-1">Quick Response</h3>
                    <p className="text-sm opacity-90">Our team will contact you within 24 hours to discuss your application.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="ShieldCheckIcon" size={24} variant="outline" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-lg mb-1">No Obligations</h3>
                    <p className="text-sm opacity-90">Submit your inquiry with no commitment. Learn more before making a decision.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="UserGroupIcon" size={24} variant="outline" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-lg mb-1">Dedicated Support</h3>
                    <p className="text-sm opacity-90">Get personalized guidance throughout the onboarding process and beyond.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/20">
                <p className="text-sm opacity-75 mb-2">Questions? Contact our merchant team:</p>
                <div className="flex items-center space-x-2 mb-2">
                  <Icon name="PhoneIcon" size={18} variant="outline" />
                  <span className="font-headline font-semibold">0800 EVOUCHER</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon name="EnvelopeIcon" size={18} variant="outline" />
                  <span className="font-headline font-semibold">merchants@evoucher.co.za</span>
                </div>
              </div>
            </div>
            
            <div className="p-8 lg:p-12">
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                  <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center">
                    <Icon name="CheckCircleIcon" size={48} variant="solid" className="text-success" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-2xl text-foreground mb-2">
                      Application Submitted!
                    </h3>
                    <p className="text-muted-foreground font-body">
                      Thank you for your interest. Our merchant partnership team will review your application and contact you within 24 hours.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="font-headline font-bold text-2xl text-foreground mb-2">
                    Start Your Application
                  </h3>
                  <p className="text-muted-foreground font-body mb-8">
                    Fill out the form below and our team will get back to you shortly.
                  </p>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                          Business Name *
                        </label>
                        <input
                          type="text"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                          placeholder="Your Business Name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                          Owner Name *
                        </label>
                        <input
                          type="text"
                          name="ownerName"
                          value={formData.ownerName}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                          placeholder="Your Full Name"
                        />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                          placeholder="your@email.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                          placeholder="0XX XXX XXXX"
                        />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                          Business Location *
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                          placeholder="City/Township"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                          Business Category *
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                        >
                          <option value="">Select Category</option>
                          <option value="grocery">Grocery Store</option>
                          <option value="pharmacy">Pharmacy</option>
                          <option value="hardware">Hardware</option>
                          <option value="fashion">Fashion & Clothing</option>
                          <option value="electronics">Electronics</option>
                          <option value="restaurant">Restaurant/Food</option>
                          <option value="services">Services</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                        Estimated Monthly Revenue *
                      </label>
                      <select
                        name="monthlyRevenue"
                        value={formData.monthlyRevenue}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                      >
                        <option value="">Select Range</option>
                        <option value="0-25k">R0 - R25,000</option>
                        <option value="25k-50k">R25,000 - R50,000</option>
                        <option value="50k-100k">R50,000 - R100,000</option>
                        <option value="100k-250k">R100,000 - R250,000</option>
                        <option value="250k+">R250,000+</option>
                      </select>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center space-x-2 px-8 py-4 bg-action text-action-foreground rounded-lg font-headline font-semibold text-lg hover:bg-action/90 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      <span>Submit Application</span>
                      <Icon name="ArrowRightIcon" size={20} variant="outline" />
                    </button>
                    
                    <p className="text-xs text-muted-foreground text-center">
                      By submitting this form, you agree to our Terms of Service and Privacy Policy.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;