import React from 'react';
import MainLayout from '@/components/layout/MainLayout';

const SMSConsent = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-foreground">SMS Consent & Terms</h1>
        <p className="text-muted-foreground mb-6">SMS Gift Discovery Service Agreement</p>
        
        <div className="prose prose-lg max-w-none text-foreground">
          <div className="bg-primary/10 p-8 rounded-lg mb-8 border-l-4 border-primary">
            <h2 className="text-2xl font-semibold mb-4 text-primary">SMS Opt-In Consent</h2>
            <p className="text-lg mb-6">
              By providing a phone number for our SMS Gift Discovery service, you give your express written consent to receive automated text messages for gift preference discovery purposes.
            </p>
            
            <div className="bg-background/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Required Consumer Consent Statement:</h3>
              <p className="text-sm font-medium">
                "I consent to receive automated text messages from [Your Company Name] for gift discovery purposes. I understand that consent is not required to make a purchase and I can opt-out at any time by replying STOP. Message and data rates may apply."
              </p>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How Our SMS Service Works</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-3">🎯 Purpose</h3>
                <p>
                  Our SMS service connects with gift recipients to discover their preferences, interests, and current needs to help you find the perfect gift.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-3">🤖 Process</h3>
                <p>
                  We send 3-5 personalized messages asking about interests, preferences, and current wishlist items. AI analyzes responses for recommendations.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-3">SMS Conversation Flow Example:</h3>
            <div className="bg-muted p-6 rounded-lg space-y-3">
              <div className="flex justify-start">
                <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs">
                  "Hi! Sarah wants to surprise you with a gift. What are you most interested in lately?"
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-secondary text-secondary-foreground p-3 rounded-lg max-w-xs">
                  "I've been really into cooking and trying new recipes!"
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs">
                  "That's great! Any particular cooking tools or ingredients you've been wanting to try?"
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">SMS Terms & Conditions</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">📱 Message Details</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Frequency:</strong> 3-5 messages per gift discovery session</li>
                  <li><strong>Timing:</strong> Messages sent during reasonable hours (9 AM - 8 PM local time)</li>
                  <li><strong>Duration:</strong> Complete discovery takes 2-3 days maximum</li>
                  <li><strong>Content:</strong> Questions about preferences, interests, and gift ideas</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">💰 Costs & Charges</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Service:</strong> SMS discovery service is free</li>
                  <li><strong>Carrier Charges:</strong> Standard message and data rates apply</li>
                  <li><strong>International:</strong> International messaging rates may apply</li>
                  <li><strong>No Premium:</strong> We do not send premium SMS messages</li>
                </ul>
              </div>
            </div>

            <div className="bg-warning/10 p-6 rounded-lg border-l-4 border-warning">
              <h3 className="text-lg font-semibold mb-3">⚠️ Important Consent Requirements</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Only provide phone numbers of people who have given you permission</li>
                <li>Recipients must be aware they may receive messages about gift discovery</li>
                <li>You are responsible for ensuring proper consent before using our service</li>
                <li>Misuse of our SMS service may result in account suspension</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Opt-Out Instructions</h2>
            <div className="bg-destructive/10 p-6 rounded-lg border-l-4 border-destructive">
              <h3 className="text-lg font-semibold mb-3">How to Stop Messages</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">📱 Text STOP</h4>
                  <p>Reply <code className="bg-muted px-2 py-1 rounded">STOP</code> to any message to immediately unsubscribe from all future messages.</p>
                </div>
                <div>
                  <h4 className="font-semibold">❓ Text HELP</h4>
                  <p>Reply <code className="bg-muted px-2 py-1 rounded">HELP</code> for assistance or contact information.</p>
                </div>
                <div>
                  <h4 className="font-semibold">📧 Contact Support</h4>
                  <p>Email us at <a href="mailto:sms-support@yourdomain.com" className="text-primary hover:underline">sms-support@yourdomain.com</a> for additional help.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Privacy & Data Protection</h2>
            <h3 className="text-xl font-semibold mb-3">What We Collect</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Phone numbers (for message delivery only)</li>
              <li>Message responses (for gift recommendations)</li>
              <li>Delivery confirmations (for service reliability)</li>
              <li>Opt-out requests (for compliance)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">How We Protect Your Data</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>All SMS data is encrypted in transit and at rest</li>
              <li>Phone numbers are automatically deleted after 30 days</li>
              <li>Message content is used only for gift recommendations</li>
              <li>No data is shared with third parties for marketing</li>
              <li>SMS logs are retained only for compliance and support</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">TCPA Compliance</h2>
            <div className="bg-info/10 p-6 rounded-lg">
              <p className="mb-4">
                Our SMS service complies with the Telephone Consumer Protection Act (TCPA) and requires explicit consent before sending automated messages.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All messages are sent with prior express written consent</li>
                <li>Recipients can opt-out at any time by replying STOP</li>
                <li>We maintain records of consent and opt-out requests</li>
                <li>Messages are sent only for the agreed-upon purpose (gift discovery)</li>
                <li>We respect Do Not Call registry requirements</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Supported Carriers</h2>
            <p className="mb-4">Our SMS service works with all major US carriers including:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-card rounded-lg">Verizon</div>
              <div className="text-center p-3 bg-card rounded-lg">AT&T</div>
              <div className="text-center p-3 bg-card rounded-lg">T-Mobile</div>
              <div className="text-center p-3 bg-card rounded-lg">Sprint</div>
            </div>
            <p className="text-sm text-muted-foreground">
              If you experience delivery issues with other carriers, please contact our support team.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3">SMS Support</h3>
              <ul className="space-y-2">
                <li><strong>Email:</strong> <a href="mailto:sms-support@yourdomain.com" className="text-primary hover:underline">sms-support@yourdomain.com</a></li>
                <li><strong>Phone:</strong> 1-800-SMS-HELP (1-800-767-4357)</li>
                <li><strong>Address:</strong> [Your Business Address]</li>
                <li><strong>Hours:</strong> Monday-Friday, 9 AM - 6 PM EST</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Agreement Acknowledgment</h2>
            <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
              <p className="text-lg font-medium mb-4">
                By using our SMS Gift Discovery service, you acknowledge that you have read, understood, and agree to these SMS terms and conditions.
              </p>
              <p className="text-sm text-muted-foreground">
                This page serves as proof of our opt-in policy and TCPA compliance for carrier and regulatory review.
              </p>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default SMSConsent;