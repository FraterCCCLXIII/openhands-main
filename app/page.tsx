import { Metadata } from "next"
import Head from 'next/head';
import Navbar from '../components/NavBar';
import Hero from '../components/Hero';

export const metadata: Metadata = {
  title: "All Hands AI",
  openGraph: {
    url: "https://all-hands.dev/"
  },
}

export default function Web() {
  return (
    <div>
      <Head>
        <title>All Hands AI</title>
        <link rel="icon" href="/public/favicon.ico" />
      </Head>
      <Navbar />
      <Hero />
    </div>
  );
}
