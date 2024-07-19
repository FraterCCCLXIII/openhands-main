import { Metadata } from "next"
import Head from 'next/head';
import About from '../components/About'; 
import Footer from '../components/Footer'; 
import Hero from '../components/Hero';
import Navbar from '../components/NavBar';

export const metadata: Metadata = {
  title: "All Hands AI",
}

export default function Web() {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>All Hands AI</title>
        <link rel="icon" href="/public/favicon.ico" />
      </Head>
      <Navbar />
      <main className="grow">
        <Hero />
        <About /> 
      </main>
      <Footer />
    </div>
  );
}
