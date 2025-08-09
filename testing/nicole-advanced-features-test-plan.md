# Nicole Advanced Features Testing Plan

## Test Overview
**Features Under Test:**
- Friend Search & Connection (`useFriendSearch`)
- Invitation Email System (`send-invitation-email` Edge Function)
- Product Curation (`useNicoleProductCuration`)
- Enhanced Invitation Flow
- Smart Auto-Gift CTA & Rules (`setupAutoGiftWithUnifiedSystems`)
- Curated Gift Flow (`useEnhancedGiftRecommendations`)
- Unified Nicole Conversation Continuity (`useUnifiedNicoleAI`)
- Nicole Wishlist Contextual Awareness (wishlist integration)
- Nicole Interest-Based Recommendations (user interests integration)
- Analytics Tracking (recommendation events)

---

## Test Cases

### 1. Friend Search Functionality

| Test ID | Test Case | Steps | Expected Result | Priority | Status |
|---------|-----------|-------|-----------------|----------|--------|
| FS001 | Search for existing connected user | 1. Enter name of connected friend<br>2. Execute search | User found with "Connected" status | High | |
| FS002 | Search for existing non-connected user | 1. Enter name of platform user not connected<br>2. Execute search | User found with "Send Request" option | High | |
| FS003 | Search for non-existent user | 1. Enter random/fake name<br>2. Execute search | "No users found" message displayed | High | |
| FS004 | Send connection request | 1. Find non-connected user<br>2. Click "Send Request" | Request sent, status updates to "Pending" | High | |
| FS005 | Search with minimum query length | 1. Enter 1-2 characters<br>2. Attempt search | No search executed (minimum length validation) | Medium | |
| FS006 | Search error handling | 1. Disconnect network<br>2. Attempt search | Error message displayed gracefully | Medium | |
| FS007 | Privacy settings impact | 1. Search for user with private profile<br>2. Verify results | Respects privacy settings (limited info shown) | High | |
| FS008 | Realtime pending count updates | 1. Trigger a connection request from another session<br>2. Observe Social Hub badge/count | Pending count updates via realtime without refresh | Medium | |
| FS009 | Mixed status badges | 1. Search where results include Connected/Pending/Invite<br>2. Verify each badge | Correct statuses shown with proper actions | Medium | |

### 2. Invitation Email System

| Test ID | Test Case | Steps | Expected Result | Priority | Status |
|---------|-----------|-------|-----------------|----------|--------|
| IE001 | Send invitation email - valid data | 1. Fill invitation form completely<br>2. Submit | Email sent successfully, analytics recorded | High | |
| IE002 | Email content validation | 1. Send test invitation<br>2. Check received email | Proper personalization, correct links, branding | High | |
| IE003 | Analytics tracking | 1. Send invitation<br>2. Check `gift_invitation_analytics` table | Record created with correct data | High | |
| IE004 | Invalid email address | 1. Enter invalid email format<br>2. Submit | Validation error displayed | Medium | |
| IE005 | Missing required fields | 1. Leave required fields empty<br>2. Submit | Form validation prevents submission | Medium | |
| IE006 | CORS handling | 1. Send invitation from different origin<br>2. Verify response | CORS headers properly set | Medium | |
| IE007 | API failure handling | 1. Temporarily break Resend API key<br>2. Attempt send | Graceful error handling, user notified | High | |
| IE008 | Authentication check | 1. Send request without auth<br>2. Verify response | 401 Unauthorized returned | High | |

### 3. Product Curation

| Test ID | Test Case | Steps | Expected Result | Priority | Status |
|---------|-----------|-------|-----------------|----------|--------|
| PC001 | Basic keyword search | 1. Enter product keyword<br>2. Execute search | Relevant products returned (max 24) | High | |
| PC002 | Price filtering | 1. Set price range<br>2. Search with keyword | Products filtered by price range | High | |
| PC003 | Empty search results | 1. Search for nonsense keyword<br>2. Verify response | Empty array returned, no errors | Medium | |
| PC004 | Error handling | 1. Simulate API failure<br>2. Attempt search | Error state handled gracefully | Medium | |
| PC005 | Loading states | 1. Execute search<br>2. Observe loading indicator | Loading shown during search, cleared after | Low | |

### 4. Integration Testing

| Test ID | Test Case | Steps | Expected Result | Priority | Status |
|---------|-----------|-------|-----------------|----------|--------|
| IT001 | End-to-end invitation flow | 1. Start in Nicole interface<br>2. Search for non-user<br>3. Complete invitation | Full flow works, email sent, analytics tracked | High | |
| IT002 | Nicole AI integration | 1. Mention person's name in Nicole<br>2. Verify search triggered | Nicole recognizes names and suggests actions | High | |
| IT003 | Connection to auto-gifting | 1. Connect with user<br>2. Set up auto-gifting | Connected users available in auto-gift setup | High | |
| IT004 | Mobile responsiveness | 1. Test all flows on mobile<br>2. Verify usability | All interfaces work properly on mobile | Medium | |

### 5. Smart Auto-Gift CTA (Hands‑Free)

| Test ID | Test Case | Steps | Expected Result | Priority | Status |
|---------|-----------|-------|-----------------|----------|--------|
| HF001 | CTA appears when recipient+occasion known | 1. Progress chat until both are set | CTA shown with two options | High | |
| HF002 | Let Nicole handle it -> rule created | 1. Click hands‑free option | Auto-gift rule created; success message; ruleId stored | High | |
| HF003 | Budget fallback | 1. Omit budget<br>2. Choose hands‑free | Sensible default budget applied; rule created | Medium | |
| HF004 | Error fallback | 1. Force rule creation failure | Nicole apologizes and suggests curated flow | Medium | |
| HF005 | Scheduling default | 1. Choose hands‑free | Schedule set N days before event | Medium | |

### 6. Curated Recommendations Flow

| Test ID | Test Case | Steps | Expected Result | Priority | Status |
|---------|-----------|-------|-----------------|----------|--------|
| CQ001 | Start curated flow | 1. Click “Let’s curate together” | Bot asks for interests/budget | High | |
| CQ002 | Generate ideas | 1. Provide brief prefs<br>2. Say “show ideas” | 3–5 recs rendered in chat | High | |
| CQ003 | Tracking views | 1. Open ideas | 'viewed' events recorded for top items | Medium | |
| CQ004 | Select gift | 1. Click “Select This Gift” on a card | Rule created with selected_product; toast + confirmation | High | |
| CQ005 | Track click | 1. Select gift | 'clicked' event recorded with productId/price | Medium | |
| CQ006 | Dismiss recommendation | 1. Dismiss one card | 'dismissed' event recorded; card removed | Low | |
| CQ007 | Recommendation failure | 1. Simulate API error | Graceful error + optional QuickGiftIdeas fallback | Medium | |
| CQ008 | Budget respect | 1. Set budget range | Shown items mostly within range | Medium | |

### 7. Conversation Context & Continuity

| Test ID | Test Case | Steps | Expected Result | Priority | Status |
|---------|-----------|-------|-----------------|----------|--------|
| CC001 | Context merge after rule creation | 1. Create rule | Context includes ruleId, mode, scheduleDate | High | |
| CC002 | Continue dialog after actions | 1. Complete hands‑free or selection | Assistant follows up with next helpful options | Medium | |
| CC003 | Persist context across refresh | 1. Refresh mid-flow | Context restored; CTA logic consistent | Medium | |

### 8. Analytics & Event Tracking

| Test ID | Test Case | Steps | Expected Result | Priority | Status |
|---------|-----------|-------|-----------------|----------|--------|
| AN001 | Recommendation analytics record | 1. Generate ideas | recommendationId present; events attach to it | High | |
| AN002 | Purchase/selection tracking | 1. Select gift | 'clicked' then rule created; analytics updated | High | |
| AN003 | Error logging visibility | 1. Simulate failures | Errors logged to console & edge logs | Medium | |

### 9. Nicole Wishlist Contextual Awareness

| Test ID | Test Case | Steps | Expected Result | Priority | Status |
|---------|-----------|-------|-----------------|----------|--------|
| WC001 | Nicole accesses user wishlists | 1. User with existing wishlists chats with Nicole<br>2. Ask for gift suggestions | Nicole references user's existing wishlists in recommendations | High | |
| WC002 | Wishlist privacy compliance | 1. Set wishlist sharing to private<br>2. Chat with Nicole | Nicole respects privacy settings for wishlist data | High | |
| WC003 | Empty wishlist handling | 1. User with no wishlists chats with Nicole<br>2. Ask for gift recommendations | Nicole gracefully handles empty wishlist state | Medium | |
| WC004 | Recipient wishlist access | 1. Chat about gifting to connection<br>2. Connection has accessible wishlists | Nicole fetches and references recipient's wishlist data | High | |
| WC005 | Recipient wishlist suggestions | 1. Ask about what Justin likes<br>2. Justin has wishlists in profile | Nicole says "I see Justin has wishlists for [categories]" | High | |

### 10. Nicole Interest-Based Recommendations

| Test ID | Test Case | Steps | Expected Result | Priority | Status |
|---------|-----------|-------|-----------------|----------|--------|
| IB001 | User interest integration | 1. User with profile interests chats with Nicole<br>2. Ask for gift suggestions | Nicole considers user's interests in recommendations | High | |
| IB002 | Recipient interest matching | 1. Chat about gifting to connection with known interests<br>2. Ask "what does [name] like?" | Nicole references recipient's stored profile interests | High | |
| IB003 | Interest-category alignment | 1. User has specific interests (e.g., tech, books)<br>2. Ask for gift ideas | Nicole suggests gifts aligned with interest categories | High | |
| IB004 | Combined interest-wishlist logic | 1. User with both interests and wishlists active<br>2. Request gift recommendations | Nicole intelligently combines both data sources | High | |
| IB005 | Missing interest graceful handling | 1. User with minimal profile interests<br>2. Chat with Nicole | Nicole gracefully handles sparse interest data | Medium | |

### 11. Nicole Recipient Profile Context Awareness

| Test ID | Test Case | Steps | Expected Result | Priority | Status |
|---------|-----------|-------|-----------------|----------|--------|
| RPC001 | Connection profile data retrieval | 1. Mention a connection (e.g., "Can you locate Justin Meeks?")<br>2. Ask about their interests | Nicole fetches and stores full recipient profile data including interests, wishlists, special dates | High | |
| RPC002 | Contextual interest responses | 1. Connected to someone with profile interests<br>2. Ask "what are some things he likes?" | Nicole responds with specific interests from recipient's profile: "I see Justin likes [specific interests]" | High | |
| RPC003 | Wishlist context awareness | 1. Connected to someone with wishlists<br>2. Ask about gift suggestions for them | Nicole mentions recipient's wishlist categories and suggests browsing them | High | |
| RPC004 | Privacy-compliant data access | 1. Connection has private interests/wishlists<br>2. Ask about their preferences | Nicole respects privacy settings and doesn't access restricted data | High | |
| RPC005 | Special dates integration | 1. Connection has birthday in profile<br>2. Ask about their birthday | Nicole uses fetched special dates data for occasion-based recommendations | Medium | |
| RPC006 | No concatenated responses | 1. Any chat with Nicole after connection detection<br>2. Observe response format | Nicole provides clean, single responses without duplicated action prompts | High | |

### 11. Edge Cases & Error Scenarios

| Test ID | Test Case | Steps | Expected Result | Priority | Status |
|---------|-----------|-------|-----------------|----------|--------|
| EC001 | Concurrent connection requests | 1. Two users send requests simultaneously<br>2. Verify handling | No duplicate connections created | Medium | |
| EC002 | Invalid invitation tokens | 1. Use malformed invitation URL<br>2. Access page | Graceful error handling | Medium | |
| EC003 | Expired invitation links | 1. Use old invitation link<br>2. Attempt access | Appropriate expiration message | Low | |
| EC004 | Special characters in names | 1. Search for names with special chars<br>2. Verify handling | Search works correctly, no SQL issues | Medium | |

---

## Test Environment Setup

### Prerequisites
- Test user accounts (connected & non-connected)
- Valid Resend API key configured
- Supabase test database access
- Network monitoring tools

### Test Data Requirements
- Sample user profiles with various privacy settings
- Test email addresses for invitation testing
- Product catalog for curation testing

---

## Acceptance Criteria

### Must Pass (Blockers)
- All High priority test cases pass
- No security vulnerabilities in search/invitation flows
- Email delivery works reliably
- Analytics tracking functions correctly

### Should Pass (Important)
- All Medium priority test cases pass
- Error handling works gracefully
- Mobile experience is fully functional

### Nice to Have
- All Low priority test cases pass
- Performance optimization verified

---

## Test Execution Notes

### Automated Testing
- Unit tests for hooks (`useFriendSearch`, `useNicoleProductCuration`)
- Integration tests for edge function
- E2E tests for critical user flows

### Manual Testing Focus
- UI/UX validation
- Email content review
- Cross-browser compatibility
- Real-world scenario testing

### Performance Testing
- Search response times
- Email sending latency
- Database query performance
- Analytics recording speed

---

## Sign-off Requirements

- [ ] Development Team Lead
- [ ] QA Team Lead  
- [ ] Product Owner
- [ ] Security Review (for invitation system)

---

**Test Plan Version:** 1.0  
**Created:** January 2025  
**Test Environment:** Staging  
**Estimated Test Duration:** 2-3 days