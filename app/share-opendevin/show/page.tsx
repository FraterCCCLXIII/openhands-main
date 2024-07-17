'use client'

import React, { useState, useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '../../../components/NavBar'
import Footer from '../../../components/Footer'

const ShowSharedContent: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [shareId, setShareId] = useState<string>('')
  const [sharedContent, setSharedContent] = useState<any>(null)

  useEffect(() => {
    const id = searchParams.get('share_id')
    if (id) {
      setShareId(id)
      fetchSharedContent(id)
    }
  }, [searchParams])

  const fetchSharedContent = async (id: string) => {
    try {
      const response = await fetch('https://show-od-trajectory-3u9bw9tx.uc.gateway.dev/show-od-trajectory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ feedback_id: id })
      })
      const data = await response.json()
      setSharedContent(data)
    } catch (error) {
      toast.error('Error fetching shared content')
      console.error(error)
    }
  }

  const updateShare = (id: string) => {
    setShareId(id)
    router.push(`/share-opendevin/show?share_id=${id}`)
    fetchSharedContent(id)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Show Shared OpenDevin Content</h1>
        <div className="mb-4">
          <input
            type="text"
            value={shareId}
            onChange={(e) => updateShare(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 mr-2"
          />
          <button
            onClick={() => updateShare(shareId)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Update Share ID
          </button>
        </div>
        {sharedContent && (
          <div>
            <h2 className="text-2xl font-semibold mb-2">Shared Content</h2>
            <SyntaxHighlighter language="json" style={tomorrow}>
              {JSON.stringify(sharedContent, null, 2)}
            </SyntaxHighlighter>
          </div>
        )}
        <ToastContainer />
      </main>
      <Footer />
    </div>
  )
}

export default ShowSharedContent
