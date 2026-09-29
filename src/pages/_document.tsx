import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="th" suppressHydrationWarning>
      <Head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
