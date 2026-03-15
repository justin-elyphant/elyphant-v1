

## Add Shipping Address Step to Onboarding (Reusing Existing Components)

### Approach
Reuse the existing `ShippingAddressForm` component (from `src/components/profile-setup/steps/shipping-address/`) directly inside a new lightweight stepped-auth wrapper. No new address logic needed — just wrap it in `StepLayout` and wire it into `SteppedAuthFlow`.

### Changes

**1. Create `src/components/auth/stepped/steps/AddressStep.tsx`**
- Thin wrapper: imports `StepLayout` + existing `ShippingAddressForm`
- Props: `address` (ShippingAddress), `onChange`, `onNext`, `onBack`, `stepIndex`, `totalSteps`
- Validation: disable "Next" until `address_line1`, `city`, `state`, `zip_code` are filled
- Pass `showVerification={false}` to skip inline address verification during onboarding (keep it fast)

**2. Update `src/components/auth/stepped/SteppedAuthFlow.tsx`**
- Add `address: ShippingAddress` to `FormState` (default: `{ country: 'US' }`)
- Add `"address"` to `StepId`, `EMAIL_STEPS` (after interests, before photo), and `OAUTH_STEPS` (after interests, before photo)
- Add case `"address"` in `renderStep()` — renders the new `AddressStep`
- In `handleComplete`: include `shipping_address` in the profile upsert/update payload, mapping the `ShippingAddress` object directly (it already uses the DB-compatible field names like `address_line1`, `city`, `state`, `zip_code`, `country`)

That's it — three files touched, zero new address logic. The existing `ShippingAddressForm` with `GooglePlacesAutocomplete`, `StateSelect`, `CountrySelect`, and phone number field all come for free.

