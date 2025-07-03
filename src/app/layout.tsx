import { Providers } from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>
          <AppLayoutWrapper>
            {children}
          </AppLayoutWrapper>
        </Providers>
      </body>
    </html>
  )
}