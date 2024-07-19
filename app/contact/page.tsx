import { Metadata } from "next"
import React from 'react';
import Contact from '../../components/Contact';
import Footer from '../../components/Footer';
import Navbar from '../../components/NavBar';


export const metadata: Metadata = {
  title: "Contact | All Hands AI",
}

const ContactPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="grow flex">
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
