# GTM: quote / lead events

`higitotal-lead-events.json` is a Google Tag Manager import that adds:

- Data Layer Variables `DLV - item_id`, `DLV - quantity`, `DLV - lead_type`, `DLV - items`
- Custom Event triggers `CE - add_to_quote`, `CE - generate_lead`
- GA4 Event tags `GA4 Event - add_to_quote` and `GA4 Event - generate_lead` (measurement ID `G-SWG8Q2W0PQ`)

The storefront pushes these events (no personal data): `add_to_quote` {item_id, quantity}
and `generate_lead` {lead_type: quote | product | assistencia | geral, items}.
Consent: GA4 tags have built-in `analytics_storage` checks; the site's banner drives
Consent Mode v2 (`storefront/src/lib/consent/`). Leave the tags' consent settings "Not set".

Import: GTM → Admin → Import Container → choose this file → existing workspace →
**Merge** → "Rename conflicting tags, triggers and variables" → Confirm. Then Preview
(accept cookies, add a product to the quote, send a request), Submit → Publish, and in
GA4 mark `generate_lead` as a Key event.
