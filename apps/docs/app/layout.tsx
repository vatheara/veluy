import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
 
export const metadata = {
   title: "Document | Veluy by Dommosray",
   description: "This Veluy Library",
   icons: {
    icon: '/favicon.ico',
  },
}
 
const banner = <Banner storageKey="some-key">Veluy 1.0 is released 🎉</Banner>
const navbar = (
  <Navbar
    logo={<b>VELUY</b>}
    projectLink='https://github.com/vatheara/veluy'
    logoLink='/'
    align='right'
  />
)
const footer = <Footer>MIT {new Date().getFullYear()} © Veluy.</Footer>
 
export default async function RootLayout({ children }) {
  return (
    <html
      // Not required, but good for SEO
      lang="en"
      // Required to be set
      dir="ltr"
      // Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
      suppressHydrationWarning
    >
      <Head
      // ... Your additional head options
      >
        {/* Your additional tags should be passed as `children` of `<Head>` element */}
      </Head>
      <body>
        <Layout
          banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/shuding/nextra/tree/main/docs"
          footer={footer}
          sidebar={{ autoCollapse: false }}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}