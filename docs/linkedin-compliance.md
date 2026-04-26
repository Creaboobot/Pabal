# LinkedIn Compliance

LinkedIn enrichment is manual user-provided context only.

Step 12B allows:

- optional `Person.linkedinUrl`;
- optional `Person.salesNavigatorUrl`;
- manual LinkedIn-context notes with `RecordSourceType.LINKEDIN_USER_PROVIDED`.

URL validation uses pure parsing only. The app requires HTTPS LinkedIn profile
or Sales Navigator paths where practical, but it does not fetch the URL, verify
profile ownership, scrape metadata, or preview LinkedIn content.

ADR-004 remains the boundary:

- User-provided URLs and pasted text may be stored.
- Scraping, browser automation, headless navigation, monitoring, cookie/session
  handling, LinkedIn API integration, Sales Navigator sync, and automated
  LinkedIn activity are prohibited.
- LinkedIn-derived notes must be source-labeled as user-provided.
- Users are responsible for only pasting content they are allowed to use.
