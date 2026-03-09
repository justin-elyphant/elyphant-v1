
import React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const ShopifyHowToGuide = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="rounded-lg border border-border bg-card">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex w-full items-center gap-2 p-4 text-left hover:bg-muted/50 transition-colors rounded-lg">
          <HelpCircle className="h-5 w-5 text-primary shrink-0" />
          <span className="font-medium text-sm flex-1">
            Need help connecting? View step-by-step guide
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-6">
            {/* Step-by-step instructions */}
            <div>
              <h4 className="font-medium text-sm mb-3">How to Connect Your Shopify Store</h4>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-sm">Find your store URL</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Log into your{" "}
                      <a href="https://admin.shopify.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                        Shopify admin <ExternalLink className="h-3 w-3" />
                      </a>
                      . Your store URL is shown in the browser address bar — it looks like{" "}
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">yourstore.myshopify.com</code>.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-sm">Enter your store URL</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Paste the URL into the "Store URL" field below and click <strong>Connect</strong>. You can also type <code className="bg-muted px-1 py-0.5 rounded text-xs">development</code> to try a simulated store first.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    3
                  </span>
                  <div>
                    <p className="font-medium text-sm">Authorize access</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      You'll be prompted to grant Elyphant <strong>read-only</strong> access to your product catalog. We never modify your store data.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    4
                  </span>
                  <div>
                    <p className="font-medium text-sm">Review synced products</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Once connected, your products will appear below with sync settings you can customize — including auto-sync frequency and inventory tracking.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* FAQ */}
            <div>
              <h4 className="font-medium text-sm mb-2">Common Questions</h4>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="find-url">
                  <AccordionTrigger className="text-sm py-3">
                    Where do I find my Shopify store URL?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Log into <a href="https://admin.shopify.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">admin.shopify.com</a> and look at your browser's address bar. It will show something like <code className="bg-muted px-1 py-0.5 rounded text-xs">admin.shopify.com/store/yourstore</code>. Your store URL is <code className="bg-muted px-1 py-0.5 rounded text-xs">yourstore.myshopify.com</code>.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="data-access">
                  <AccordionTrigger className="text-sm py-3">
                    What data does Elyphant access?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    We only access <strong>read-only</strong> product and inventory data — titles, descriptions, images, prices, and stock levels. We never modify your Shopify store, process payments through your account, or access customer data.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="affect-store">
                  <AccordionTrigger className="text-sm py-3">
                    Will this affect my existing Shopify store?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    No. Elyphant only reads your product catalog — it does not write, update, or delete anything in your Shopify store. Your existing store continues to operate normally.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="markup">
                  <AccordionTrigger className="text-sm py-3">
                    What is the 30% convenience fee?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Products listed on Elyphant include a 30% markup on top of your retail price. This covers platform services including discovery, gifting features, and customer support. You receive orders at your original price to fulfill directly.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="no-store">
                  <AccordionTrigger className="text-sm py-3">
                    I don't have a Shopify store yet
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    You can create a free development store through the{" "}
                    <a href="https://partners.shopify.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                      Shopify Partners program <ExternalLink className="h-3 w-3" />
                    </a>
                    , or type <code className="bg-muted px-1 py-0.5 rounded text-xs">development</code> in the store URL field to try our simulated store.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ShopifyHowToGuide;
