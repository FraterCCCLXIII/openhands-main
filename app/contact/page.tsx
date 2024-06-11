import { Metadata } from "next"
import React from 'react';
import Contact from '../../components/Contact';
import Navbar from '../../components/NavBar';
import Footer from '../../components/Footer';


export const metadata: Metadata = {
  title: "Contact | All Hands AI",
}

const ContactPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow flex">
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
