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
  // Understanding Elyphant
  {
    category: "Understanding Elyphant",
    question: "What is Elyphant and how is it different from other e-commerce sites?",
    answer: "Elyphant is a social gifting platform that combines wishlist technology, AI-powered recommendations, and automated gifting to eliminate unwanted gifts. Unlike traditional e-commerce sites, we focus on ensuring every gift is something the recipient actually wants through verified wishlists, preference matching, and smart connection features."
  },
  {
    category: "Understanding Elyphant",
    question: "How does Elyphant reduce unwanted gifts?",
    answer: "We use a three-pronged approach: (1) Wishlist verification ensures recipients directly choose what they want, (2) Nicole AI analyzes recipient preferences and interests to suggest perfect matches, and (3) Address verification confirms delivery accuracy. This data-driven approach reduces gift returns by up to 80% compared to traditional gift-giving."
  },
  {
    category: "Understanding Elyphant",
    question: "Why should I use Elyphant instead of shopping directly on Amazon?",
    answer: "Elyphant adds a social layer on top of Amazon's product selection. You get wishlist access to see what friends and family actually want, AI recommendations based on their verified preferences, automated gifting for birthdays and holidays, group gift coordination, and privacy-protected gift messaging. We make Amazon shopping more thoughtful and personal."
  },

  // Returns & Exchanges Policy (New Section - Shopper Friendly)
  {
    category: "Returns & Exchanges",
    question: "Does Elyphant offer returns or exchanges?",
    answer: "We understand that sometimes gifts don't work out perfectly. At this time, Elyphant doesn't directly process returns or exchanges due to our fulfillment partnership with our third-party fulfillment provider. However, we've designed our platform to help you avoid unwanted gifts in the first place through wishlists, preferences, and AI-powered recommendations!\n\nFor recipients: All orders are sent as Amazon gift orders, which means you'll receive a gift receipt with your package. This gift receipt allows you to easily return or exchange items directly through Amazon's return process without affecting the gift-giver. Simply follow the instructions on your Amazon gift receipt."
  },
  {
    category: "Returns & Exchanges",
    question: "Why doesn't Elyphant process returns directly?",
    answer: "Elyphant partners with Amazon for order fulfillment to give you access to millions of products with fast, reliable shipping. Since Amazon handles the physical delivery, they also manage the return process. This actually works in your favor - Amazon has one of the best return policies in e-commerce, with easy drop-offs at Amazon lockers, UPS stores, Whole Foods, and more!"
  },
  {
    category: "Returns & Exchanges",
    question: "How do I return a gift I received through Elyphant?",
    answer: "It's easy! All Elyphant gifts are sent as Amazon gift orders with gift receipts. Here's how to return:\n\n1. Locate the gift receipt that came with your package (or check your email for the Amazon order details)\n2. Visit Amazon.com and sign in to your account\n3. Go to 'Returns & Orders'\n4. Find the order using your gift receipt details\n5. Follow Amazon's standard return process - you can print a label or drop off at a return location\n\nThe best part? Gift-givers won't see the reason for your return, protecting everyone's privacy."
  },

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
  {
    category: "Getting Started & Account",
    question: "How do I update my profile information?",
    answer: "Navigate to Settings in the top-right menu, then select the General tab. You can update your name, email, date of birth, shipping address, and other profile details from there."
  },
  {
    category: "Getting Started & Account",
    question: "Can I delete my Elyphant account?",
    answer: "Yes, you can delete your account from Settings > General > Delete Account. Please note that this action is permanent and will remove all your data, including wishlists, connections, and order history."
  },

  // Order Fulfillment & Delivery
  {
    category: "Order Fulfillment & Delivery",
    question: "How does ordering work on Elyphant?",
    answer: "Elyphant integrates with Amazon's marketplace through our third-party fulfillment partner to provide access to millions of products. When you place an order, we process it through Amazon's fulfillment network, ensuring fast delivery and reliable service."
  },
  {
    category: "Order Fulfillment & Delivery",
    question: "How long does delivery take?",
    answer: "Delivery times vary by product and location, but most orders are fulfilled within 2-5 business days. You'll receive tracking information via email once your order ships."
  },
  {
    category: "Order Fulfillment & Delivery",
    question: "Can I track my order?",
    answer: "Yes! After placing an order, you'll receive tracking information via email. You can also track your orders in your Elyphant account under 'Orders' or through the Amazon tracking system using the provided tracking number."
  },
  {
    category: "Order Fulfillment & Delivery",
    question: "What happens if my package doesn't arrive?",
    answer: "If your package is marked as delivered but you haven't received it, please check with neighbors, your building's mailroom, or common delivery areas. If you still can't locate it, contact our support team at support@elyphant.com and we'll work with the carrier to resolve the issue."
  },
  {
    category: "Order Fulfillment & Delivery",
    question: "What areas do you deliver to?",
    answer: "We deliver to all addresses serviced by Amazon in the United States. Our address verification system ensures your delivery location is valid before accepting orders."
  },

  // Auto-Gifting Features
  {
    category: "Auto-Gifting",
    question: "What is auto-gifting and how does it work?",
    answer: "Auto-gifting lets you set up automated gift deliveries for birthdays, anniversaries, holidays, and other special occasions. Once you create a rule with a recipient, budget, and occasion, Elyphant will automatically select and send gifts based on their wishlist or AI recommendations before the date arrives."
  },
  {
    category: "Auto-Gifting",
    question: "Can I approve auto-gifts before they're sent?",
    answer: "Yes! You can choose to receive approval notifications 7 days before an auto-gift is scheduled to send. You'll see the selected gift and can approve, modify, or skip it before it's sent."
  },
  {
    category: "Auto-Gifting",
    question: "How do I set up recurring gifts for birthdays and holidays?",
    answer: "Navigate to Gifting > Auto-Gifting, click 'Create Rule', select your recipient, choose the occasion (birthday, Christmas, Mother's Day, etc.), set your budget, and confirm. Elyphant will handle the rest automatically each year."
  },
  {
    category: "Auto-Gifting",
    question: "Will the recipient know the gift is automated?",
    answer: "No! Auto-gifts look exactly like regular gifts. The recipient receives a beautifully wrapped package with your personalized gift message - there's no indication that it was automated."
  },
  {
    category: "Auto-Gifting",
    question: "Can I change or cancel an auto-gift rule?",
    answer: "Yes, you can edit or delete auto-gift rules at any time from the Auto-Gifting dashboard. Changes must be made before the 7-day pre-notification window to affect upcoming gifts."
  },

  // Scheduled Delivery
  {
    category: "Scheduled Delivery",
    question: "Can I schedule a gift to be delivered on a specific date?",
    answer: "Yes! During checkout, you can choose a scheduled delivery date. We'll hold your payment and process the order to arrive as close to your selected date as possible."
  },
  {
    category: "Scheduled Delivery",
    question: "When does Elyphant charge my card for scheduled gifts?",
    answer: "For scheduled deliveries, we authorize your card when you place the order but only capture the payment 2-3 days before the scheduled delivery date to ensure the order arrives on time."
  },
  {
    category: "Scheduled Delivery",
    question: "What happens if I need to change a scheduled delivery date?",
    answer: "If you need to modify a scheduled delivery, contact our support team at support@elyphant.com as soon as possible. We can adjust dates if the order hasn't entered final processing yet (typically 48 hours before the scheduled date)."
  },

  // Group Gifts
  {
    category: "Group Gifts",
    question: "How do group gifts work on Elyphant?",
    answer: "Group gifts let multiple people contribute to a larger gift. The organizer creates a group gift project, invites contributors, sets a target amount, and shares the contribution link. Once funded, the organizer can purchase the gift using the pooled contributions."
  },
  {
    category: "Group Gifts",
    question: "How are contributions collected for group gifts?",
    answer: "Contributors pledge their amount and their payment methods are authorized (not charged) when they commit. Once the group gift reaches its funding goal and the organizer triggers the purchase, all contributions are captured simultaneously and the gift is ordered."
  },
  {
    category: "Group Gifts",
    question: "What happens if a group gift doesn't reach its funding goal?",
    answer: "If the deadline passes without reaching the goal, all authorized payments are released and contributors are not charged. The organizer can choose to extend the deadline, reduce the target amount, or cancel the project."
  },
  {
    category: "Group Gifts",
    question: "Can I see who contributed to a group gift?",
    answer: "Yes, group members can see who contributed and their pledge amounts. However, you can choose to contribute anonymously if you prefer, which hides your name from other contributors (though the organizer can still see all contributions for coordination purposes)."
  },

  // Connections & Invitations
  {
    category: "Connections & Invitations",
    question: "How do I invite friends and family to Elyphant?",
    answer: "You can invite connections from the Connections page by clicking 'Add Connection' and entering their email. They'll receive an invitation to join Elyphant and connect with you."
  },
  {
    category: "Connections & Invitations",
    question: "What happens when I send a connection invitation?",
    answer: "Your invitee receives an email invitation to join Elyphant. When they sign up using your invitation link, you're automatically connected, giving you both access to each other's wishlists (based on privacy settings) and enabling features like auto-gifting."
  },
  {
    category: "Connections & Invitations",
    question: "Can my connections see my personal information?",
    answer: "Connections can only see information you've shared in your privacy settings. By default, connections can see your wishlist and gift preferences. Your full address, payment information, and other sensitive data are always private unless you explicitly choose to share."
  },
  {
    category: "Connections & Invitations",
    question: "How do I manage my connection privacy settings?",
    answer: "Go to Settings > Privacy & Data Sharing to control what information each type of connection can see. You can adjust wishlist visibility, address sharing, and gift preference visibility individually."
  },

  // Address Verification
  {
    category: "Address Verification",
    question: "Why does Elyphant verify addresses?",
    answer: "Address verification ensures gifts are delivered successfully to valid locations. This reduces failed deliveries, lost packages, and the frustration of gifts not arriving on time for special occasions."
  },
  {
    category: "Address Verification",
    question: "What if my address doesn't verify automatically?",
    answer: "If automatic verification fails, you can manually confirm your address. We'll mark it as 'user-confirmed' which still allows you to receive gifts. Common reasons for verification failure include new construction, rural routes, or recently changed street names."
  },
  {
    category: "Address Verification",
    question: "Can I update my address after verification?",
    answer: "Yes, you can update your address at any time in Settings > Address. When you change your address, you'll need to verify the new address to ensure it's valid for deliveries."
  },
  {
    category: "Address Verification",
    question: "Is address verification required for all gifts?",
    answer: "Address verification is strongly recommended and required for auto-gifts and connection-based gifts to protect both givers and recipients. For traditional checkout where you're providing a shipping address, verification helps ensure successful delivery but isn't strictly required."
  },

  // Payment & Pricing
  {
    category: "Payment & Pricing",
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) and debit cards through our secure payment processor, Stripe. Your payment information is encrypted and never stored on our servers."
  },
  {
    category: "Payment & Pricing",
    question: "When will my card be charged?",
    answer: "For immediate orders, your card is charged when you complete checkout. For scheduled deliveries, we authorize your card at checkout but only capture the payment 2-3 days before delivery. For group gifts, payment is captured when the organizer triggers the purchase."
  },
  {
    category: "Payment & Pricing",
    question: "Why is there a gifting fee?",
    answer: "The gifting fee (10% + $1.00) covers gift wrapping, personalized message cards, platform maintenance, and customer support. This small fee enables us to provide a premium gifting experience with features like auto-gifting, AI recommendations, and wishlist coordination."
  },
  {
    category: "Payment & Pricing",
    question: "Is my payment information secure?",
    answer: "Absolutely. We use Stripe, a PCI-DSS Level 1 certified payment processor trusted by millions of businesses worldwide. Your payment data is encrypted end-to-end and we never store your full card details on our servers."
  },
  {
    category: "Payment & Pricing",
    question: "Can I save payment methods for future purchases?",
    answer: "Yes! During checkout, you can check 'Save this card for future use' to securely store your payment method. You can manage saved payment methods in Settings > Payments."
  },

  // Gift Messages & Privacy
  {
    category: "Gift Messages & Privacy",
    question: "Can I include a personal message with my gift?",
    answer: "Yes! Every gift can include a personalized message. You'll be prompted to add a message during checkout. Your message will be included on a card with the gift delivery."
  },
  {
    category: "Gift Messages & Privacy",
    question: "Will the recipient see the price of the gift?",
    answer: "No, gift recipients never see pricing information. All gifts are sent with gift receipts that omit prices, ensuring the surprise and thoughtfulness of your gift remain intact."
  },
  {
    category: "Gift Messages & Privacy",
    question: "How does Elyphant protect gift surprise?",
    answer: "When sending gifts, recipients only see your gift message and that a gift is on the way - they don't see what the gift is, how much it cost, or delivery tracking details until after delivery (unless you choose to share). For wishlist items, we notify recipients of general 'activity' without revealing who purchased what."
  },
  {
    category: "Gift Messages & Privacy",
    question: "Can I send an anonymous gift?",
    answer: "While you can omit your name from the gift message, the recipient will receive a gift receipt showing the order originated from Elyphant. For true anonymity, you would need to coordinate with our support team."
  },

  // Nicole AI Assistant
  {
    category: "Nicole AI",
    question: "What is Nicole and how can she help me?",
    answer: "Nicole is Elyphant's AI shopping assistant. She can help you find perfect gifts based on recipient preferences, answer questions about products, suggest gift ideas for occasions, and guide you through the platform's features. Think of her as your personal gifting concierge!"
  },
  {
    category: "Nicole AI",
    question: "How does Nicole choose gift recommendations?",
    answer: "Nicole analyzes multiple data points: recipient wishlist items, browsing history, stated interests, past gift feedback, occasion context, and your budget. She uses machine learning to match these factors with product attributes to suggest gifts with high likelihood of being loved."
  },
  {
    category: "Nicole AI",
    question: "Is Nicole available 24/7?",
    answer: "Yes! Nicole is available anytime you need help. You can access her through the chat icon on most pages or by visiting the Nicole AI page directly."
  },
  {
    category: "Nicole AI",
    question: "Can Nicole help me find gifts for multiple people?",
    answer: "Absolutely! Nicole can help you plan gifts for multiple recipients at once. Just tell her who you're shopping for, the occasion, and your budget constraints, and she'll coordinate recommendations across all recipients."
  },
];

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(faqData.map(item => item.category)))];

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-lg text-muted-foreground">
            Find answers to common questions about Elyphant
          </p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category === "all" ? "All Topics" : category}
              </Button>
            ))}
          </div>
        </div>

        {filteredFAQs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No questions found matching "{searchTerm}"
            </p>
            <Button
              variant="link"
              onClick={() => setSearchTerm("")}
              className="mt-4"
            >
              Clear search
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFAQs.map((item, index) => (
              <div
                key={index}
                className="border rounded-lg overflow-hidden bg-card"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                >
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground mb-1">
                      {item.category}
                    </div>
                    <h3 className="font-medium">{item.question}</h3>
                  </div>
                  {openItems.has(index) ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-4" />
                  )}
                </button>
                {openItems.has(index) && (
                  <div className="px-6 py-4 bg-accent/30 border-t">
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 p-6 bg-accent/50 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">Still have questions?</h2>
          <p className="text-muted-foreground mb-4">
            Can't find what you're looking for? Contact our support team.
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
