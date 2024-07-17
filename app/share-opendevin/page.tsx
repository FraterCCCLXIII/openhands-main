import React from 'react'
import Link from 'next/link'
import Navbar from '../../components/NavBar'
import Footer from '../../components/Footer'

const ShareOpenDevin: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Share OpenDevin</h1>
        <Link href="/share-opendevin/show" className="text-blue-500 hover:underline">
          Show Shared Content
        </Link>
      </main>
      <Footer />
    </div>
  )
}

export default ShareOpenDevin
