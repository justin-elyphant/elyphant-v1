import React, { useState } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // Getting Started & Account
  {
    category: "Getting Started & Account",
    question: "How do I create an Elyphant account?",
    answer: "You can sign up using your email address or through social login options. After creating your account, you'll be guided through a profile setup to help our AI understand your preferences better."
  },
  {
    category: "Getting Started & Account",
    question: "How does Elyphant's AI learn my preferences?",
    answer: "Our AI analyzes your browsing behavior, gift searches, wishlist items, and feedback to understand your style and preferences. The more you use Elyphant, the better our recommendations become."
  },
  {
    category: "Getting Started & Account",
    question: "Is my personal data secure?",
    answer: "Yes, we take privacy seriously. Your data is encrypted and stored securely. We never share your personal information with third parties without your consent. You can control your privacy settings in your account."
  },

  // Returns & Refunds
  {
    category: "Returns & Refunds",
    question: "How do I return an item I purchased through Elyphant?",
    answer: "Since Elyphant uses Amazon for order fulfillment through our Zinc API integration, all returns are processed directly through Amazon's standard return process. You can initiate a return by visiting your Amazon account's 'Your Orders' section, or by contacting Amazon customer service directly. Amazon's return policy applies to all purchases made through Elyphant."
  },
  {
    category: "Returns & Refunds",
    question: "What is Elyphant's return policy?",
    answer: "Elyphant follows Amazon's return policy since we fulfill orders through Amazon. This typically includes a 30-day return window for most items. For specific return eligibility, please check the product page or Amazon's return policy for that particular item."
  },
  {
    category: "Returns & Refunds",
    question: "Can I get a refund for a gift that was sent?",
    answer: "Yes, gifts can typically be returned following Amazon's gift return process. The recipient can return the gift for a refund or exchange without the giver knowing the return reason. Gift receipts are automatically included with gift orders."
  },
  {
    category: "Returns & Refunds",
    question: "How long do refunds take to process?",
    answer: "Refund processing times follow Amazon's standard timeline, which is typically 3-5 business days after Amazon receives the returned item. The refund will be credited to the original payment method used for the purchase."
  },

  // Ordering & Purchasing
  {
    category: "Ordering & Purchasing",
    question: "How does ordering work on Elyphant?",
    answer: "Elyphant integrates with Amazon's marketplace through our Enhanced Zinc API system to provide access to millions of products. When you place an order, we process it through Amazon's fulfillment network, ensuring fast delivery and reliable service."
  },
  {
    category: "Ordering & Purchasing",
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, debit cards, and other payment methods supported by Stripe, our secure payment processor. Your payment information is encrypted and never stored on our servers."
  },
  {
    category: "Ordering & Purchasing",
    question: "How can I track my order?",
    answer: "After placing an order, you'll receive tracking information via email. You can also track your orders in your Elyphant account under 'Orders' or through the Amazon tracking system using the provided tracking number."
  },
  {
    category: "Ordering & Purchasing",
    question: "Can I modify or cancel my order after placing it?",
    answer: "Order modifications depend on the fulfillment status. If the order hasn't been shipped yet, you may be able to modify or cancel it. Contact our support team immediately if you need to make changes."
  },

  // Gifting Features
  {
    category: "Gifting Features",
    question: "How do group gifts work?",
    answer: "Group gifts allow multiple people to contribute toward a single gift. Create a group gift project, invite contributors, set a target amount, and track contributions. Once funded, the gift is automatically purchased and sent to the recipient."
  },
  {
    category: "Gifting Features",
    question: "Can I schedule gifts to be sent automatically?",
    answer: "Yes! Our auto-gifting feature lets you set up rules for automatic gift sending based on special dates like birthdays or anniversaries. You can set budgets, preferences, and notification settings for each rule."
  },
  {
    category: "Gifting Features",
    question: "How do surprise gifts work?",
    answer: "For surprise gifts, we coordinate delivery timing and can hide purchase details from the recipient. You can specify delivery dates and include custom messages while keeping the gift a surprise."
  },
  {
    category: "Gifting Features",
    question: "Can I include a personal message with my gift?",
    answer: "Yes, you can add personalized gift messages that will be included with your order. These messages are printed on gift receipts or included as gift notes."
  },

  // Connections & Social Features
  {
    category: "Connections & Social Features",
    question: "How do I connect with friends and family?",
    answer: "You can send connection requests to friends and family members by searching for their email or username. Once connected, you can view their wishlists (if public), send gifts, and collaborate on group gifts."
  },
  {
    category: "Connections & Social Features",
    question: "Can I control who can see my information?",
    answer: "Yes, you have full control over your privacy settings. You can choose who can see your profile, wishlists, and gift history. You can also control who can send you connection requests and messages."
  },
  {
    category: "Connections & Social Features",
    question: "How do I block or remove connections?",
    answer: "You can manage your connections in your account settings. You can remove connections or block users if needed. Blocked users won't be able to contact you or see your profile information."
  },

  // Wishlists & Preferences
  {
    category: "Wishlists & Preferences",
    question: "How do I create and manage wishlists?",
    answer: "You can create multiple wishlists for different occasions or categories. Add items from our marketplace, categorize them by priority, and control who can view each wishlist. You can also import items from other websites."
  },
  {
    category: "Wishlists & Preferences",
    question: "Can I share my wishlist with others?",
    answer: "Yes, you can share wishlists with specific people or make them public. You control the privacy settings for each wishlist individually."
  },
  {
    category: "Wishlists & Preferences",
    question: "How do I set my gift preferences?",
    answer: "In your profile settings, you can specify your interests, preferred price ranges, favorite brands, and items you want to avoid. This helps our AI and your connections choose better gifts for you."
  },

  // AI & Personalization
  {
    category: "AI & Personalization",
    question: "How does Nicole AI help with gift recommendations?",
    answer: "Nicole is our AI assistant that analyzes recipient data, occasion context, and your preferences to suggest personalized gifts. She considers factors like age, interests, relationship type, and budget to provide tailored recommendations."
  },
  {
    category: "AI & Personalization",
    question: "Can I provide feedback on AI recommendations?",
    answer: "Yes, your feedback helps improve our AI recommendations. Like or dislike suggestions, and provide reasons for your preferences. This data helps Nicole learn and provide better recommendations over time."
  },
  {
    category: "AI & Personalization",
    question: "How accurate are the AI gift suggestions?",
    answer: "Our AI continuously learns from user interactions and feedback. While suggestions improve over time, we recommend reviewing all recommendations and considering your personal knowledge of the recipient."
  },

  // Marketplace & Products
  {
    category: "Marketplace & Products",
    question: "Where do the products come from?",
    answer: "Our products are sourced from Amazon's marketplace through our Enhanced Zinc API integration. This gives you access to millions of products with Amazon's quality standards, fast shipping, and return policies."
  },
  {
    category: "Marketplace & Products",
    question: "How do I search for specific products?",
    answer: "Use our AI-enhanced search bar to find products by name, category, or description. You can also browse by categories or use our gift finder tool for occasion-based recommendations."
  },
  {
    category: "Marketplace & Products",
    question: "Are prices competitive with Amazon?",
    answer: "Our pricing reflects Amazon's marketplace prices plus any applicable service fees. We're transparent about all costs during checkout, including shipping and taxes."
  },

  // Technical & Security
  {
    category: "Technical & Security",
    question: "Is it safe to shop on Elyphant?",
    answer: "Yes, we use industry-standard security measures including SSL encryption for all transactions. Payments are processed through Stripe, a certified PCI compliant payment processor. We never store your payment information."
  },
  {
    category: "Technical & Security",
    question: "What browsers does Elyphant support?",
    answer: "Elyphant works on all modern web browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for the best experience."
  },
  {
    category: "Technical & Security",
    question: "Can I use Elyphant on my mobile device?",
    answer: "Yes, Elyphant is fully responsive and works great on mobile devices and tablets. We don't currently have a dedicated mobile app, but our web interface is optimized for mobile use."
  },

  // Billing & Subscriptions
  {
    category: "Billing & Subscriptions",
    question: "Does Elyphant charge subscription fees?",
    answer: "Elyphant operates on a transaction-based model. We may include service fees with certain orders, but there are no monthly subscription charges. All fees are clearly disclosed before purchase."
  },
  {
    category: "Billing & Subscriptions",
    question: "How do I view my purchase history?",
    answer: "You can view all your orders and purchase history in your account under the 'Orders' section. This includes order details, tracking information, and receipt downloads."
  },
  {
    category: "Billing & Subscriptions",
    question: "Can I get receipts for my purchases?",
    answer: "Yes, digital receipts are automatically sent to your email after each purchase. You can also download receipts from your account's order history section."
  }
];

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openItems, setOpenItems] = useState<number[]>([]);

  const categories = Array.from(new Set(faqData.map(item => item.category)));

  const filteredFAQs = faqData.filter(
    faq =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const groupedFAQs = categories.reduce((acc, category) => {
    acc[category] = filteredFAQs.filter(faq => faq.category === category);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground text-lg">
            Find answers to common questions about Elyphant's features and services
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {categories.map(category => {
            const categoryFAQs = groupedFAQs[category];
            if (categoryFAQs.length === 0) return null;

            return (
              <div key={category} className="bg-card rounded-lg border p-6">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">
                  {category}
                </h2>
                <div className="space-y-3">
                  {categoryFAQs.map((faq, index) => {
                    const globalIndex = faqData.indexOf(faq);
                    const isOpen = openItems.includes(globalIndex);

                    return (
                      <div key={globalIndex} className="border-b border-border last:border-0 pb-3 last:pb-0">
                        <Button
                          variant="ghost"
                          onClick={() => toggleItem(globalIndex)}
                          className="w-full justify-between text-left p-0 h-auto font-medium hover:bg-transparent"
                        >
                          <span className="text-foreground">{faq.question}</span>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                          )}
                        </Button>
                        {isOpen && (
                          <div className="mt-3 text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {filteredFAQs.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No FAQs found matching "{searchTerm}". Try a different search term.
            </p>
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-12 text-center bg-muted/50 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <Button asChild>
            <a href="/contact">Contact Support</a>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default FAQ;