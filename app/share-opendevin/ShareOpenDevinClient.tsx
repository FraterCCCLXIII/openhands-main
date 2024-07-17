'use client'

import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../../components/NavBar';
import Footer from '../../components/Footer';
import ShareHero from '../../components/ShareHero';
import { MessageCircle, Terminal, PenTool, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ShareOpenDevin = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shareId, setShareId] = useState('');
  const [sharedContent, setSharedContent] = useState(null);

  useEffect(() => {
    const id = searchParams.get('share_id');
    if (id) {
      setShareId(id);
      fetchSharedContent(id);
    }
  }, [searchParams]);

  const fetchSharedContent = async (id) => {
    try {
      const response = await fetch('https://show-od-trajectory-3u9bw9tx.uc.gateway.dev/show-od-trajectory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ feedback_id: id })
      });
      const data = await response.json();
      setSharedContent(data);
    } catch (error) {
      toast.error('Error fetching shared content');
      console.error(error);
    }
  };

  const updateShare = (id) => {
    setShareId(id);
    router.push(`/share-opendevin?share_id=${id}`);
    fetchSharedContent(id);
  };

  const renderTrajectory = (trajectory) => {
    return trajectory.map((item, index) => {
      if (item.action === 'message') {
        return (
          <div key={index} className="mb-4 bg-gray-100 rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-200 px-4 py-2 font-bold flex items-center">
              <MessageCircle className="mr-2" size={20} />
              User Message
            </div>
            {/* <div className="px-4 py-2">{item.args.content}</div> */}
            <div className="px-4 py-2">
                <ReactMarkdown
                components={{
                    code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                        <CodeBlock
                        language={match[1]}
                        value={String(children).replace(/\n$/, '')}
                        {...props}
                        />
                    ) : (
                        <code className={className} {...props}>
                        {children}
                        </code>
                    );
                    },
                }}
                >
                {item.args.content}
                </ReactMarkdown>
            </div>
          </div>
        );
      } else if (item.action === 'run_ipython') {
        return (
          <div key={index} className="mb-4 bg-blue-100 rounded-lg shadow-md overflow-hidden">
            <div className="bg-blue-200 px-4 py-2 font-bold flex items-center">
              <PenTool className="mr-2" size={20} />
              IPython Cell Execution
            </div>
            <div className="px-4 py-2">
              <SyntaxHighlighter language="python" style={tomorrow}>
                {item.args.code}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      } else if (item.action === 'run') {
        return (
          <div key={index} className="mb-4 bg-green-100 rounded-lg shadow-md overflow-hidden">
            <div className="bg-green-200 px-4 py-2 font-bold flex items-center">
              <Terminal className="mr-2" size={20} />
              Bash Command Execution
            </div>
            <div className="px-4 py-2">
              <SyntaxHighlighter language="bash" style={tomorrow}>
                {item.args.command}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      } else if (item.observation === 'run_ipython' || item.observation === 'run') {
        return (
          <div key={index} className="mb-4 bg-yellow-100 rounded-lg shadow-md overflow-hidden">
            <div className="bg-yellow-200 px-4 py-2 font-bold flex items-center">
              <Eye className="mr-2" size={20} />
              Observation
            </div>
            <div className="px-4 py-2">
              <pre className="whitespace-pre-wrap">{item.content}</pre>
            </div>
          </div>
        );
      }
      return null;
    });
  };

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
              <h2 className="text-2xl font-semibold mb-4">Shared Trajectory</h2>
              {renderTrajectory(sharedContent.trajectory)}
            </div>
          )}
          <ToastContainer />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ShareOpenDevin;
