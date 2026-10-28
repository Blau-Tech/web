# BlauTech Platform

The community platform behind [blau-tech.de](https://www.blau-tech.de): events, hackathons and programs for builders in Berlin and Munich, filtered by city and type, without an account.

This is a public copy of the platform's web code, published for reference. The database, the workflows that find and review listings and their data are private, so this copy doesn't run end to end on its own.

## What's here

- `src/`: the React app (Vite): the home page, the event and program showcases, discovery with city and type filters, opportunity details and the partner page
- `supabase/functions/newsletter/`: the Edge Function that sends the weekly newsletter
- `tests/`: the discovery, layout and newsletter checks

## Run the checks

```sh
npm install
npm run test:contracts
npm run lint
npm run build
```

There is no open-source license: you're welcome to read the code, and all rights are reserved.
