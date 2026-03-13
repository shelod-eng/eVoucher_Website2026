import type { Metadata } from 'next';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import Header from '@/components/common/Header';

export const metadata: Metadata = {
  title: 'Support & Help - eVoucher Platform',
  description:
    'Get help with eVoucher. Contact support, find answers to common questions, and access resources.',
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon
                name="QuestionMarkCircleIcon"
                size={48}
                variant="solid"
                className="text-primary"
              />
            </div>
            <h1 className="font-headline font-bold text-5xl text-foreground mb-4">
              How Can We Help You?
            </h1>
            <p className="font-body text-xl text-muted-foreground max-w-2xl mx-auto">
              We're here to support you every step of the way. Find answers, get in touch, or access
              help resources.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <h2 className="font-headline font-bold text-3xl text-foreground text-center mb-12">
              Get In Touch
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background rounded-2xl p-8 text-center border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-lg">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon name="PhoneIcon" size={32} variant="solid" className="text-primary" />
                </div>
                <h3 className="font-headline font-bold text-xl text-foreground mb-3">Call Us</h3>
                <p className="font-body text-muted-foreground mb-4">Speak to a support agent</p>
                <p className="font-headline text-2xl font-bold text-primary mb-2">0800 123 456</p>
                <p className="font-body text-sm text-muted-foreground">Mon-Fri: 8am-6pm</p>
              </div>

              <div className="bg-background rounded-2xl p-8 text-center border-2 border-border hover:border-secondary transition-all duration-300 hover:shadow-lg">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon name="EnvelopeIcon" size={32} variant="solid" className="text-secondary" />
                </div>
                <h3 className="font-headline font-bold text-xl text-foreground mb-3">Email Us</h3>
                <p className="font-body text-muted-foreground mb-4">
                  Get a response within 24 hours
                </p>
                <a
                  href="mailto:support@evoucher.co.za"
                  className="font-headline text-lg font-semibold text-secondary hover:underline"
                >
                  support@evoucher.co.za
                </a>
              </div>

              <div className="bg-background rounded-2xl p-8 text-center border-2 border-border hover:border-success transition-all duration-300 hover:shadow-lg">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon
                    name="DevicePhoneMobileIcon"
                    size={32}
                    variant="solid"
                    className="text-success"
                  />
                </div>
                <h3 className="font-headline font-bold text-xl text-foreground mb-3">
                  USSD Access
                </h3>
                <p className="font-body text-muted-foreground mb-4">No smartphone needed</p>
                <p className="font-accent text-3xl font-bold text-success mb-2">*134*2468#</p>
                <p className="font-body text-sm text-muted-foreground">Works on any phone</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-20 bg-background">
          <div className="max-w-4xl mx-auto px-4 lg:px-6">
            <h2 className="font-headline font-bold text-3xl text-foreground text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-card rounded-xl p-6 border-2 border-border">
                <h3 className="font-headline font-bold text-lg text-foreground mb-3">
                  How do I register as a customer?
                </h3>
                <p className="font-body text-muted-foreground mb-4">
                  Visit our{' '}
                  <Link href="/consumer" className="text-primary font-semibold hover:underline">
                    Consumer Registration page
                  </Link>{' '}
                  and fill in your basic details. It takes less than 2 minutes and is completely
                  free.
                </p>
              </div>

              <div className="bg-card rounded-xl p-6 border-2 border-border">
                <h3 className="font-headline font-bold text-lg text-foreground mb-3">
                  Do I need a smartphone to use eVoucher?
                </h3>
                <p className="font-body text-muted-foreground mb-4">
                  No! You can access eVoucher from any phone using USSD by dialing{' '}
                  <span className="font-accent font-bold text-primary">*134*2468#</span>. No data or
                  smartphone required.
                </p>
              </div>

              <div className="bg-card rounded-xl p-6 border-2 border-border">
                <h3 className="font-headline font-bold text-lg text-foreground mb-3">
                  How do I become a merchant partner?
                </h3>
                <p className="font-body text-muted-foreground mb-4">
                  Visit our{' '}
                  <Link href="/merchants" className="text-secondary font-semibold hover:underline">
                    Merchant Onboarding page
                  </Link>{' '}
                  and complete the application. Our team will review your application within 2-3
                  business days.
                </p>
              </div>

              <div className="bg-card rounded-xl p-6 border-2 border-border">
                <h3 className="font-headline font-bold text-lg text-foreground mb-3">
                  How much can I save with eVoucher?
                </h3>
                <p className="font-body text-muted-foreground mb-4">
                  Customers typically save 10-15% on purchases at participating merchants. The exact
                  discount depends on the merchant and product category.
                </p>
              </div>

              <div className="bg-card rounded-xl p-6 border-2 border-border">
                <h3 className="font-headline font-bold text-lg text-foreground mb-3">
                  Is eVoucher safe and secure?
                </h3>
                <p className="font-body text-muted-foreground mb-4">
                  Yes! eVoucher is government-aligned and uses bank-grade security. All transactions
                  are encrypted and auditable. Your personal information is protected.
                </p>
              </div>

              <div className="bg-card rounded-xl p-6 border-2 border-border">
                <h3 className="font-headline font-bold text-lg text-foreground mb-3">
                  How long does merchant approval take?
                </h3>
                <p className="font-body text-muted-foreground mb-4">
                  Merchant applications are typically reviewed within 2-3 business days. We'll
                  notify you via email and SMS when your status changes.
                </p>
              </div>

              <div className="bg-card rounded-xl p-6 border-2 border-border">
                <h3 className="font-headline font-bold text-lg text-foreground mb-3">
                  What is the merchant onboarding fee?
                </h3>
                <p className="font-body text-muted-foreground mb-4">
                  The one-time onboarding fee is R500, which includes R250 donation to a registered
                  charity (tax deductible) and R250 for platform setup and verification.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Help Resources */}
        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <h2 className="font-headline font-bold text-3xl text-foreground text-center mb-12">
              Help Resources
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-background rounded-2xl p-8 border-2 border-border">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="bg-primary/10 p-3 rounded-xl flex-shrink-0">
                    <Icon name="UserIcon" size={28} variant="solid" className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-xl text-foreground mb-2">
                      For Customers
                    </h3>
                    <p className="font-body text-muted-foreground mb-4">
                      Learn how to register, find vouchers, and save money
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center space-x-2">
                        <Icon
                          name="CheckCircleIcon"
                          size={16}
                          variant="solid"
                          className="text-success"
                        />
                        <span className="font-body text-sm text-muted-foreground">
                          Registration guide
                        </span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Icon
                          name="CheckCircleIcon"
                          size={16}
                          variant="solid"
                          className="text-success"
                        />
                        <span className="font-body text-sm text-muted-foreground">
                          How to use USSD
                        </span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Icon
                          name="CheckCircleIcon"
                          size={16}
                          variant="solid"
                          className="text-success"
                        />
                        <span className="font-body text-sm text-muted-foreground">
                          Finding merchants near you
                        </span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Icon
                          name="CheckCircleIcon"
                          size={16}
                          variant="solid"
                          className="text-success"
                        />
                        <span className="font-body text-sm text-muted-foreground">
                          Redeeming vouchers
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
                <Link
                  href="/consumer"
                  className="inline-flex items-center space-x-2 text-primary font-headline font-semibold hover:underline"
                >
                  <span>Register as Customer</span>
                  <Icon name="ArrowRightIcon" size={16} variant="outline" />
                </Link>
              </div>

              <div className="bg-background rounded-2xl p-8 border-2 border-border">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="bg-secondary/10 p-3 rounded-xl flex-shrink-0">
                    <Icon
                      name="BuildingStorefrontIcon"
                      size={28}
                      variant="solid"
                      className="text-secondary"
                    />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-xl text-foreground mb-2">
                      For Merchants
                    </h3>
                    <p className="font-body text-muted-foreground mb-4">
                      Everything you need to become a partner merchant
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center space-x-2">
                        <Icon
                          name="CheckCircleIcon"
                          size={16}
                          variant="solid"
                          className="text-success"
                        />
                        <span className="font-body text-sm text-muted-foreground">
                          Onboarding process
                        </span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Icon
                          name="CheckCircleIcon"
                          size={16}
                          variant="solid"
                          className="text-success"
                        />
                        <span className="font-body text-sm text-muted-foreground">
                          Required documents
                        </span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Icon
                          name="CheckCircleIcon"
                          size={16}
                          variant="solid"
                          className="text-success"
                        />
                        <span className="font-body text-sm text-muted-foreground">
                          Bank account setup
                        </span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Icon
                          name="CheckCircleIcon"
                          size={16}
                          variant="solid"
                          className="text-success"
                        />
                        <span className="font-body text-sm text-muted-foreground">
                          Payout schedule
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
                <Link
                  href="/merchants"
                  className="inline-flex items-center space-x-2 text-secondary font-headline font-semibold hover:underline"
                >
                  <span>Join as Merchant</span>
                  <Icon name="ArrowRightIcon" size={16} variant="outline" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="max-w-4xl mx-auto px-4 lg:px-6 text-center">
            <h2 className="font-headline font-bold text-4xl text-foreground mb-6">
              Still Need Help?
            </h2>
            <p className="font-body text-xl text-muted-foreground mb-8">
              Our support team is ready to assist you with any questions or concerns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:0800123456"
                className="inline-flex items-center justify-center space-x-3 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-headline font-semibold text-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Icon name="PhoneIcon" size={24} variant="solid" />
                <span>Call 0800 123 456</span>
              </a>
              <a
                href="mailto:support@evoucher.co.za"
                className="inline-flex items-center justify-center space-x-3 px-8 py-4 bg-secondary text-secondary-foreground rounded-xl font-headline font-semibold text-lg hover:bg-secondary/90 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Icon name="EnvelopeIcon" size={24} variant="solid" />
                <span>Email Support</span>
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-card border-t border-border py-12">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="40" height="40" rx="8" fill="#20B2AA" />
                    <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="white" opacity="0.9" />
                    <path d="M20 15L24 18V22L20 25L16 22V18L20 15Z" fill="#FF7A00" />
                    <circle cx="20" cy="20" r="3" fill="white" />
                  </svg>
                  <span className="font-headline font-bold text-xl text-foreground">eVoucher</span>
                </div>
                <p className="font-body text-sm text-muted-foreground">
                  Dignified digital commerce for all South Africans
                </p>
              </div>

              <div>
                <h4 className="font-headline font-semibold text-foreground mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/"
                      className="font-body text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/consumer"
                      className="font-body text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Register as Customer
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/merchants"
                      className="font-body text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Join as Merchant
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-headline font-semibold text-foreground mb-4">Contact</h4>
                <ul className="space-y-2">
                  <li className="font-body text-sm text-muted-foreground">
                    Email: support@evoucher.co.za
                  </li>
                  <li className="font-body text-sm text-muted-foreground">Phone: 0800 123 456</li>
                  <li className="font-body text-sm text-muted-foreground">USSD: *134*2468#</li>
                </ul>
              </div>

              <div>
                <h4 className="font-headline font-semibold text-foreground mb-4">
                  Trust & Security
                </h4>
                <div className="flex items-center space-x-2 mb-2">
                  <Icon name="ShieldCheckIcon" size={20} variant="solid" className="text-success" />
                  <span className="font-body text-sm text-muted-foreground">
                    Government Aligned
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon name="LockClosedIcon" size={20} variant="solid" className="text-success" />
                  <span className="font-body text-sm text-muted-foreground">
                    Bank-Grade Security
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-border mt-8 pt-8 text-center">
              <p className="font-body text-sm text-muted-foreground">
                © 2026 eVoucher Platform. All rights reserved. | Proudly South African
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
