import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import { ColorModeProvider } from "@/components/ui/color-mode";
import { system } from "@/lib/theme";
import Fonts from "@/components/font";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider>
        <Fonts />
        <Component {...pageProps} />
      </ColorModeProvider>
    </ChakraProvider>
  );
}
