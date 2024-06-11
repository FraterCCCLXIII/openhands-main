import { Metadata } from "next"
import Head from 'next/head';
import Navbar from '../components/NavBar';
import Hero from '../components/Hero';
import Footer from '../components/Footer'; 
import About from '../components/About'; 

export const metadata: Metadata = {
  title: "All Hands AI",
  openGraph: {
    url: "https://all-hands.dev/"
  },
}

export default function Web() {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>All Hands AI</title>
        <link rel="icon" href="/public/favicon.ico" />
      </Head>
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <About /> 
      </main>
      <Footer />
    </div>
  );
}
