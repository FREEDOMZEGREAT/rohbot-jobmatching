This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Test trainer QR registration locally

The trainer QR workflow is a local development demo. It is not enabled by `npm start` or a production build, and trainer verification email is simulated rather than delivered. The `npm run dev` script explicitly sets development mode and listens on the local network.

1. Stop any running production server, then start the app with `npm run dev`.
2. Find the computer's private Wi-Fi IPv4 address with `ipconfig`.
3. Open the app on the computer using `http://<computer-ip>:3000`, sign in as the demo admin, and activate the trainer QR.
4. Scan the refreshed QR from a phone on the same Wi-Fi network and register with a name and email.
5. On successful registration, use the displayed **Verify this email** test link. Trainer emails are also recorded in the local demo inbox.

The registration state is kept in server memory and is lost when the development server restarts. Allow the development server through the computer's firewall for the private network if the phone cannot connect.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
