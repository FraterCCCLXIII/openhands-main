import { GoogleAnalytics } from '@next/third-parties/google'
import "styles/tailwind.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
      <GoogleAnalytics gaId="G-WBNNY7SH54" />
    </html>
  )
}
