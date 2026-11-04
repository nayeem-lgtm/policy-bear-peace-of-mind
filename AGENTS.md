<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the final expense landing page at `/`, with a dedicated browser-safe wizard component using URL hashes for the brief's question steps; this preserves phone Back navigation without duplicating content routes.
- Keep the complete final expense journey presentation-only: browser-generated mock pricing and decisions, no network submissions (address suggestions are the only server lookup), and never persist SSN or payment details.
- Keep form focus changes tied to screen navigation only, never to answer updates, so typing remains uninterrupted.
- Scroll the phone wizard into view only on screen navigation, and map signature pointer coordinates to canvas dimensions so touch strokes follow the finger at every size.
- Keep electronic signing browser-only, offering typed style previews and an ephemeral draw pad without persisting drawn signatures.
- Define PolicyBear visual styles and role colors centrally in `src/styles.css`; controls use the shared Button and accessible radio primitives for consistent, readable interaction.
- Scope recipient radio-card styles separately from generic answer-card selectors and size them by their container, so narrow desktop columns and selected indicators cannot distort their layout.
- Share the PolicyBear header and legal footer through the browser-safe policy-site module on the landing and legal content routes, so legal navigation and disclosures remain consistent.
- Keep footer resource navigation, disclosure navigation and contact/social links in separate accessible groups within the shared footer; this keeps the compact layout navigable without duplicating links.
- Keep the landing page free of standalone reassurance badge bands or mark strips; footer credentials remain owner-confirmed, while the Social Security step imports original security-seal asset pointers without redrawing their artwork to preserve brand integrity.
- Keep the contact page browser-only with the existing phone contact and no submission form; this preserves the presentation-only scope without undelivered messages.
- Render the five legal content routes from shared browser-safe structured owner-supplied copy, preserving existing public URLs; keep general disclaimer separate from final expense disclosures so each document remains independently shareable.
- Share contact consent across quote and callback screens, with legal links opening in new tabs so reviewing policies never interrupts entered answers; consent copy requires compliance approval before launch.
- Auto-advance every coverage-recipient choice to contact details, preserve the insured-person guidance there, and keep marketing permission optional: ticking it auto-advances and a skip link continues without it; revisited steps show a small Next button instead of auto-advancing; this avoids extra steps without conflating reconnection and automated marketing consent.
- Derive quote order and progress from the shared quote sequence and identify chapter boundaries by named steps, so reordered questions preserve Back navigation and chapter placement.
- Order pre-qualification as recipient, contact (with optional middle name, phone verification and contact permission together on the same page), then height/weight before address entry, mapping legacy personal-detail hashes to address; reuse earlier contact answers and street-address suggestions come from Google Places through server functions gated by a short-lived signed guest session (no customer sign-in), with fields still editable manually; never show fabricated lookup results.
- Show the quote sidebar only after the illustration screen; the illustration already contains the editable estimate and coverage, so duplicating them distracts from the selection.
- Keep Social Security and policy ownership as consecutive independent hash steps, with ownership choices auto-advancing; this separates sensitive entry from the ownership decision while preserving Back navigation.
- Keep eligibility routing separate from the post-application celebration so declined offers remain available without repeating congratulations before beneficiary questions.
