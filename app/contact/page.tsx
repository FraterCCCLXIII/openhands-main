import React from 'react';
import Contact from '../../components/Contact';
import Navbar from '../../components/NavBar';
import Footer from '../../components/Footer';

const ContactPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-grow">
      <Contact />
    </main>
    <Footer />
  </div>
  );
};

export default ContactPage;
