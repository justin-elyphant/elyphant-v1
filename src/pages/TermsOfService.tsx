import React from 'react';
import LegalLayout from '@/components/layout/LegalLayout';

const TermsOfService = () => {
  return (
    <LegalLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Terms of Service</h1>
        <p className="text-muted-foreground mb-6">Last Updated: February 19, 2026</p>
        
        <div className="prose prose-lg max-w-none text-foreground">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using our gifting platform, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Description of Service</h2>
            <p className="mb-4">
              Our platform provides an AI-powered gifting service that includes:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Product recommendations and marketplace</li>
              <li>SMS-based gift preference discovery</li>
              <li>Automated gift purchasing and delivery</li>
              <li>Social features for connecting with friends and family</li>
              <li>AI-powered conversation and recommendations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">User Accounts and Responsibilities</h2>
            <h3 className="text-xl font-semibold mb-3">Account Creation</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for maintaining account security</li>
              <li>You must be at least 18 years old to create an account</li>
              <li>One account per person is permitted</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Acceptable Use</h3>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Use the service for illegal or unauthorized purposes</li>
              <li>Send spam or unwanted communications</li>
              <li>Share inappropriate or offensive content</li>
              <li>Attempt to hack or compromise our systems</li>
              <li>Create fake accounts or impersonate others</li>
              <li>Use automated systems to access our services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">SMS Services Terms</h2>
            <div className="bg-primary/10 p-6 rounded-lg mb-4">
              <h3 className="text-xl font-semibold mb-3">SMS Gift Discovery</h3>
              <p className="mb-4">
                Our SMS service allows you to discover gift preferences from recipients. By using this service, you agree to:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Consent Requirement:</strong> Only provide phone numbers of people who have consented to receive messages</li>
                <li><strong>Accuracy:</strong> Ensure phone numbers are accurate and active</li>
                <li><strong>Responsibility:</strong> Take responsibility for any messages sent on your behalf</li>
                <li><strong>Compliance:</strong> Comply with all applicable laws and regulations</li>
              </ul>

              <h4 className="text-lg font-semibold mb-2">SMS Terms:</h4>
              <ul className="list-disc pl-6 mb-4">
                <li>Messages are sent for gift discovery purposes only</li>
                <li>Standard message and data rates apply</li>
                <li>Recipients can opt-out by replying STOP</li>
                <li>We reserve the right to suspend SMS services for misuse</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Payments and Billing</h2>
            <h3 className="text-xl font-semibold mb-3">Payment Processing</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>All payments are processed securely through Stripe</li>
              <li>You authorize us to charge your payment method for purchases</li>
              <li>Prices are subject to change with notice</li>
              <li>All sales are final unless otherwise specified</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Refunds and Returns</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Refund policies vary by vendor and product</li>
              <li>Digital services are generally non-refundable</li>
              <li>Contact support for refund requests within 30 days</li>
              <li>Chargebacks may result in account suspension</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Shipping and Delivery</h2>
            <h3 className="text-xl font-semibold mb-3">Third-Party Fulfillment</h3>
            <p className="mb-4">
              We utilize trusted third-party fulfillment partners to process and deliver your orders. While we carefully select our partners, we do not directly control the shipping and delivery process once orders are submitted for fulfillment.
            </p>

            <h3 className="text-xl font-semibold mb-3">Delivery Estimates</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Delivery timeframes are estimates provided by fulfillment partners</li>
              <li>Estimates are not guaranteed and may vary based on location, weather, carrier delays, or other factors beyond our control</li>
              <li>We are not responsible for delays in shipping or delivery caused by third-party carriers or fulfillment partners</li>
              <li>Holiday periods may experience extended delivery times</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Shipping Issues</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>All gift orders include a gift receipt for recipient convenience</li>
              <li>Recipients can process returns or exchanges directly with the retailer using the gift receipt</li>
              <li>We are not liable for lost, stolen, damaged, or undelivered packages once shipped by the fulfillment partner</li>
              <li>Claims for lost or damaged packages must be filed with the carrier or retailer directly</li>
              <li>We will assist with tracking information and support inquiries where possible</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Address Accuracy</h3>
            <p className="mb-4">
              You are responsible for providing accurate and complete shipping addresses. We are not responsible for delivery failures, returns, or additional charges resulting from:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Incorrect or incomplete addresses</li>
              <li>Undeliverable addresses (abandoned, invalid, military, P.O. boxes where restricted)</li>
              <li>Failed delivery attempts due to recipient unavailability</li>
              <li>Address changes after order submission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">AI Services and Content</h2>
            <h3 className="text-xl font-semibold mb-3">AI-Generated Recommendations</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>AI recommendations are suggestions, not guarantees</li>
              <li>We are not responsible for AI recommendation accuracy</li>
              <li>Final purchase decisions are your responsibility</li>
              <li>AI learns from interactions to improve service</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Conversation Data</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>AI conversations may be recorded for service improvement</li>
              <li>Do not share sensitive personal information in AI chats</li>
              <li>We may use conversation data to enhance recommendations</li>
              <li>Personal identifiers are not shared with AI service providers</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
            <h3 className="text-xl font-semibold mb-3">Our Rights</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>We own all rights to our platform, software, and content</li>
              <li>Our trademarks and logos are protected intellectual property</li>
              <li>You may not copy, modify, or distribute our content without permission</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">User Content</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>You retain ownership of content you create or share</li>
              <li>You grant us license to use your content to provide services</li>
              <li>You represent that you have rights to share any content you upload</li>
              <li>We may remove content that violates these terms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Privacy and Data Protection</h2>
            <p className="mb-4">
              Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Service Availability</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>We strive for high availability but cannot guarantee 100% uptime</li>
              <li>Scheduled maintenance may temporarily interrupt service</li>
              <li>We reserve the right to modify or discontinue features</li>
              <li>Emergency maintenance may occur without advance notice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
            <p className="mb-4">
              To the fullest extent permitted by law:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>We provide services "as is" without warranties</li>
              <li>We are not liable for indirect, incidental, or consequential damages</li>
              <li>We are not responsible for shipping delays, lost packages, damaged packages, or delivery failures caused by third-party fulfillment partners, carriers, or circumstances beyond our control</li>
              <li>Delivery estimates are provided for informational purposes only and are not guaranteed</li>
              <li>Our total liability is limited to the amount you paid for services</li>
              <li>Some jurisdictions do not allow certain limitations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Termination</h2>
            <h3 className="text-xl font-semibold mb-3">By You</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>You may delete your account at any time</li>
              <li>Account deletion removes your personal data</li>
              <li>Some information may be retained for legal compliance</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">By Us</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>We may suspend or terminate accounts for terms violations</li>
              <li>We may discontinue services with reasonable notice</li>
              <li>Terminated accounts forfeit access to services and content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Governing Law and Disputes</h2>
            <p className="mb-4">
              These Terms are governed by the laws of [Your Jurisdiction]. Any disputes will be resolved through:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>First, direct communication with our support team</li>
              <li>If unresolved, binding arbitration in [Your Jurisdiction]</li>
              <li>Class action lawsuits are waived where permitted</li>
              <li>Some claims may be resolved in small claims court</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
            <p className="mb-4">
              We may update these Terms periodically. Material changes will be communicated via:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Email notification to registered users</li>
              <li>Prominent notice on our platform</li>
              <li>Updated "Last Updated" date on this page</li>
            </ul>
            <p className="mb-4">
              Continued use after changes indicates acceptance of updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p className="mb-4">
              Questions about these Terms? Contact us:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Email: legal@elyphant.com</li>
              <li>Address: 422 Cribbage Ln. San Marcos, CA 92078</li>
              <li>Through our support system in the app</li>
            </ul>
          </section>
        </div>
      </div>
    </LegalLayout>
  );
};

export default TermsOfService;