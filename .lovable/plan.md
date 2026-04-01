

## Save Elyphant Gift Credit as Future Enhancement Doc

### What

Create a markdown file documenting the Elyphant Gift Credit feature concept for future implementation.

### File

**`src/docs/FUTURE_ELYPHANT_GIFT_CREDIT.md`**

Contents will capture the key points from our earlier discussion:

- **Concept**: Users purchase Elyphant credit as a gift for someone else to spend on the platform
- **Infrastructure**: Leverages existing `beta_credit_transactions` ledger, `get_beta_credit_balance` RPC, and checkout credit-deduction logic
- **Stripe flow**: Digital product checkout session (no Zinc involvement at purchase time); webhook deposits credit into recipient's account via new `gift_credit` transaction type
- **Zinc**: Only involved when recipient redeems credit for physical goods (already wired)
- **Key changes needed**:
  - New transaction type (`gift_credit`) in the ledger
  - "Gift Credit" purchase UI (amount selector, recipient picker)
  - Lightweight digital-only checkout session (no shipping)
  - Webhook handler branch to deposit credit on payment confirmation
  - Notification to recipient ("You received $X in Elyphant credit!")
  - Remove or make configurable the $25 per-order cap for general credits
- **Revenue model**: Elyphant keeps float on unspent credits; drives platform retention

One file, documentation only, no code changes.

