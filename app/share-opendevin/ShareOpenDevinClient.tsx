'use client'

import React, { useEffect, useState } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '../../components/NavBar'
import Footer from '../../components/Footer'
import ShareHero from '../../components/ShareHero'

const ShareOpenDevinClient: React.FC = () => {
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
    router.push(`/share-opendevin?share_id=${id}`)
    fetchSharedContent(id)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <ShareHero />
        <div className="container mx-auto w-full max-w-7xl px-4 py-8">
          <div className="mb-8 flex justify-center">
            <input
              type="text"
              value={shareId}
              onChange={(e) => updateShare(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2 mr-2 w-64"
              placeholder="Enter Share ID"
            />
            <button
              onClick={() => updateShare(shareId)}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              Show Shared Content
            </button>
          </div>
          {sharedContent && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Shared Content</h2>
              <SyntaxHighlighter language="json" style={tomorrow} className="rounded">
                {JSON.stringify(sharedContent, null, 2)}
              </SyntaxHighlighter>
            </div>
          )}
          <ToastContainer />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default ShareOpenDevinClient
