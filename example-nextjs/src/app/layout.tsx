import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// import { createGlobalStyle, css, styled, StyleSheetManager, ThemeProvider } from 'next-styled-components';
import { createGlobalStyle, css, styled, StyleSheetManager, ThemeProvider } from '@/react-component-lib';
import { PropsWithChildren } from 'react';

const inter = Inter({ subsets: ['latin'] });

const SomeComponent = ({ className, children }: PropsWithChildren<{ className?: string }>) => (
  <div className={className}>{children}</div>
);

const SomeStyledComponent = styled(SomeComponent)`
  width: 150px;
  height: 150px;
  padding: 10px;
  background-color: ${({ theme }) => theme.primaryColor};
`;

const GlobalStyle = createGlobalStyle<{ bg: string; color: string }>`
  html, body {
    color: ${css`
      ${({ color }) => color}
    `};
    background-color: ${({ bg }) => bg};
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  ${SomeStyledComponent} {
    position: absolute;
    bottom: 20px;
    right: 20px;
  }
`;

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StyleSheetManager>
          <ThemeProvider theme={{ primaryColor: 'blue' }}>
            <GlobalStyle bg="black" color="white" />
            {children}
            <SomeStyledComponent>Server Component in Layout</SomeStyledComponent>
          </ThemeProvider>
        </StyleSheetManager>
      </body>
    </html>
  );
}
