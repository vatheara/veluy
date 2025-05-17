import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import './globals.css'
import './fonts/font.css'

export const metadata = {
   title: "Veluy",
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
const footer = <Footer>
  <div className='flex flex-col text-gray-700 gap-2 w-full items-start'>
    <p className='text-md'>Powered by <span className='font-semibold text-2xl text-black'>Domnossray</span></p>
    {/* {new Date().getFullYear()} */}
    <p className='text-md'>MIT 2025 © Veluy Project.</p>
  </div>
</Footer>
 
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
    >
      <Head
      // ... Your additional head options
      >
        {/* Your additional tags should be passed as `children` of `<Head>` element */}
      </Head>
      <body className='font-en'>
        <Layout
          banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          sidebar={{ autoCollapse: true }}
          docsRepositoryBase="https://github.com/vatheara/veluy"
          feedback ={{
            content: "Have feedback? Let us know!",
            labels: "feedback",
          }}
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}