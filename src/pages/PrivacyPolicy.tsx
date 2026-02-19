import React from 'react';
import LegalLayout from '@/components/layout/LegalLayout';

const PrivacyPolicy = () => {
  return (
    <LegalLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Privacy Policy</h1>
        <p className="text-muted-foreground mb-6">Last Updated: February 19, 2026</p>
        
        <div className="prose prose-lg max-w-none text-foreground">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="mb-4">
              Welcome to our gifting platform. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and protect your data when you use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <h3 className="text-xl font-semibold mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Name, email address, and contact information</li>
              <li>Profile information including birth year and preferences</li>
              <li>Shipping and billing addresses</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Communication preferences and settings</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Usage Information</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Browsing behavior and interaction with our platform</li>
              <li>Device information and IP addresses</li>
              <li>Location data (with your consent)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">SMS Communications & Consent</h2>
            <div className="bg-primary/10 p-6 rounded-lg mb-4">
              <h3 className="text-xl font-semibold mb-3">SMS Gift Discovery Service</h3>
              <p className="mb-4">
                Our SMS gift discovery service helps you find perfect gifts by connecting with recipients via text messages. By providing a phone number for gift discovery, you consent to our automated SMS system.
              </p>
              
              <h4 className="text-lg font-semibold mb-2">How SMS Works:</h4>
              <ul className="list-disc pl-6 mb-4">
                <li>We send personalized messages to discover gift preferences</li>
                <li>Recipients can respond with their interests and preferences</li>
                <li>Our AI analyzes responses to recommend perfect gifts</li>
                <li>All SMS interactions are temporary and purpose-specific</li>
              </ul>

              <h4 className="text-lg font-semibold mb-2">SMS Terms:</h4>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Consent:</strong> By providing a phone number, you confirm you have permission to contact that recipient</li>
                <li><strong>Frequency:</strong> We send 3-5 messages per gift discovery session</li>
                <li><strong>Charges:</strong> Message and data rates may apply from your carrier</li>
                <li><strong>Opt-out:</strong> Reply STOP to any message to unsubscribe immediately</li>
                <li><strong>Help:</strong> Reply HELP for assistance or contact support</li>
              </ul>

              <p className="text-sm text-muted-foreground">
                <strong>TCPA Compliance:</strong> We comply with the Telephone Consumer Protection Act. SMS consent is required and can be withdrawn at any time by replying STOP.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
            
            <h3 className="text-xl font-semibold mb-3">Payment Processing (Stripe)</h3>
            <p className="mb-4">
              We use Stripe for secure payment processing. Stripe handles all payment data according to PCI DSS standards. We do not store complete payment card information on our servers. For more information, see <a href="https://stripe.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Stripe's Privacy Policy</a>.
            </p>

            <h3 className="text-xl font-semibold mb-3">AI Services (OpenAI)</h3>
            <p className="mb-4">
              Our AI-powered gift recommendations use OpenAI's services. Conversations with our AI assistant may be processed by OpenAI to provide personalized recommendations. We do not share personal identifiers with OpenAI. For more information, see <a href="https://openai.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">OpenAI's Privacy Policy</a>.
            </p>

            <h3 className="text-xl font-semibold mb-3">SMS Services (Twilio)</h3>
            <p className="mb-4">
              We use Twilio for SMS communications. Phone numbers and message content are processed by Twilio to deliver our gift discovery service. For more information, see <a href="https://www.twilio.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Twilio's Privacy Policy</a>.
            </p>

            <h3 className="text-xl font-semibold mb-3">Data Hosting (Supabase)</h3>
            <p className="mb-4">
              Our data is securely hosted on Supabase infrastructure with encryption at rest and in transit. Data is stored in secure, compliant data centers with regular backups and monitoring.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide and improve our gifting services</li>
              <li>Process orders and payments</li>
              <li>Send SMS messages for gift discovery (with consent)</li>
              <li>Personalize recommendations using AI</li>
              <li>Communicate about your account and orders</li>
              <li>Comply with legal obligations</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct your information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
              <li><strong>Opt-out:</strong> Withdraw consent for SMS or marketing communications</li>
              <li><strong>Object:</strong> Object to certain types of data processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
            <p className="mb-4">
              We retain your data only as long as necessary for the purposes outlined in this policy:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Account Data:</strong> Until account deletion</li>
              <li><strong>Order History:</strong> 7 years for tax and legal compliance</li>
              <li><strong>SMS Discovery Data:</strong> 30 days after completion</li>
              <li><strong>AI Conversations:</strong> 90 days for service improvement</li>
              <li><strong>Support Communications:</strong> 2 years</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p className="mb-4">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and monitoring</li>
              <li>Access controls and authentication</li>
              <li>Secure payment processing (PCI DSS compliant)</li>
              <li>Regular backup and disaster recovery procedures</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="mb-4">
              If you have questions about this Privacy Policy or want to exercise your rights:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Email: privacy@elyphant.com</li>
              <li>Address: 422 Cribbage Ln. San Marcos, CA 92078</li>
              <li>Through our support system in the app</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy periodically. We will notify you of material changes via email or through our platform. Your continued use of our services after changes indicates acceptance of the updated policy.
            </p>
          </section>
        </div>
      </div>
    </LegalLayout>
  );
};

export default PrivacyPolicy;