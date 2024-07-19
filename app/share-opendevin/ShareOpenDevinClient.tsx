'use client'

import React, { useEffect, useState } from 'react';
import { Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trajectory, TrajectoryItem } from './trajectoryTypes';
import Footer from '../../components/Footer';
import Navbar from '../../components/NavBar';
import ShareHero from '../../components/ShareHero';
import { Bot, CirclePause, Clock, Code, Eye, Loader, Lock, MessageCircle, Search, Terminal, ThumbsUp } from 'lucide-react';

const MetadataDisplay: React.FC<{
  feedback: string;
  permissions: string;
  timestamp: string;
  agent: string;
  confirmationMode: boolean;
  language: string;
  llmModel: string;
}> = ({ feedback, permissions, timestamp, agent, confirmationMode, language, llmModel }) => (
  <div className="bg-white shadow-md rounded-lg p-6 mb-6">
    <h3 className="text-xl font-semibold mb-4">Trajectory Metadata</h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center">
        <ThumbsUp className="mr-2 text-green-500" size={20} />
        <span>Feedback: {feedback}</span>
      </div>
      <div className="flex items-center">
        <Lock className="mr-2 text-blue-500" size={20} />
        <span>Permissions: {permissions}</span>
      </div>
      <div className="flex items-center">
        <Clock className="mr-2 text-yellow-500" size={20} />
        <span>Timestamp: {timestamp}</span>
      </div>
      <div className="flex items-center">
        <Bot className="mr-2 text-purple-500" size={20} />
        <span>Agent: {agent}</span>
      </div>
      <div className="flex items-center">
        <Code className="mr-2 text-red-500" size={20} />
        <span>Confirmation Mode: {confirmationMode ? 'On' : 'Off'}</span>
      </div>
      <div className="flex items-center">
        <MessageCircle className="mr-2 text-indigo-500" size={20} />
        <span>Language: {language}</span>
      </div>
      <div className="flex items-center col-span-2">
        <Terminal className="mr-2 text-gray-500" size={20} />
        <span>LLM Model: {llmModel}</span>
      </div>
    </div>
  </div>
);

const ShareOpenDevin: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShareOpenDevinContent />
    </Suspense>
  );
};

const ShareOpenDevinContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shareId, setShareId] = useState<string>('');
  const [sharedContent, setSharedContent] = useState<Trajectory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const id = searchParams.get('share_id');
    if (id) {
      setShareId(id);
      fetchSharedContent(id);
    }
  }, [searchParams]);

  const fetchSharedContent = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://show-od-trajectory-3u9bw9tx.uc.gateway.dev/show-od-trajectory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ feedback_id: id })
      });
      const data = await response.json() as Trajectory;
      setSharedContent(data);
    } catch (error) {
      toast.error('Error fetching shared content');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateShare = (id: string) => {
    setShareId(id);
    router.push(`/share-opendevin?share_id=${id}`);
    fetchSharedContent(id);
  };

  const renderTrajectory = (trajectory: TrajectoryItem[]) => {
    return trajectory.map((item: TrajectoryItem, index: number) => {
      if (item.action === 'message') {
        return (
          <div key={index} className="mb-4 bg-gray-100 rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-200 px-4 py-2 font-bold flex items-center">
              <MessageCircle className="mr-2" size={20} />
              User Message
            </div>
            <div className="px-4 py-2">
              <ReactMarkdown>
                {item.args?.content || ''}
              </ReactMarkdown>
            </div>
          </div>
        );
      } else if (item.action === 'run_ipython') {
        return (
          <div key={index} className="mb-4 bg-blue-100 rounded-lg shadow-md overflow-hidden">
            <div className="bg-blue-200 px-4 py-2 font-bold flex items-center">
              <Code className="mr-2" size={20} />
              IPython Cell Execution
            </div>
            <div className="px-4 py-2">
              <SyntaxHighlighter language="python" style={tomorrow}>
                {item.args?.code || ''}
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
                {item.args?.command || ''}
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
              <SyntaxHighlighter language="plaintext" style={tomorrow}>
                {item.content || ''}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      } else if (item.observation === 'agent_state_changed') {
        return (
          <div key={index} className="mb-4 bg-gray-100 rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-200 text-gray-500 px-4 py-2 font-bold flex items-center">
              <Bot className="mr-2" size={20} />
              Agent State Changed to [{item.extras?.agent_state}] triggered by [{item.source}]
            </div>
          </div>
        );
      }
      else if (item.action === 'initialize' || item.status) {
        return null;
      }
      else if (item.action === 'finish') {
        return (
          <div key={index} className="mb-4 bg-gray-100 rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-200 px-4 py-2 font-bold flex items-center">
              <CirclePause className="mr-2" size={20} />
              Finished
            </div>
            <div className="px-4 py-2">
              <ReactMarkdown>
                {item.args?.thought || ''}
              </ReactMarkdown>
            </div>
          </div>
        );
      }

      // else show json content of item
      return (
        <div key={index} className="mb-4 bg-gray-100 rounded-lg shadow-md overflow-hidden">
          <div className="bg-yellow-200 px-4 py-2 font-bold flex items-center">
              <Eye className="mr-2" size={20} />
              Raw Data
            </div>
            <div className="px-4 py-2">
              <SyntaxHighlighter language="json" style={tomorrow}>
                {JSON.stringify(item, null, 2)}
              </SyntaxHighlighter>
            </div>
          </div>
        );
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="grow">
        <ShareHero />
        <div className="container mx-auto w-full max-w-7xl px-4 py-8">
          <div className="mb-8 flex justify-center">
            <div className="flex w-full max-w-xl">
              <input
                type="text"
                value={shareId}
                onChange={(e) => setShareId(e.target.value)}
                className="grow px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-l-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
                placeholder="Enter Share ID"
              />
              <button
                onClick={() => updateShare(shareId)}
                className="bg-blue-500 text-white px-6 py-2 rounded-r-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader className="animate-spin" size={20} />
                ) : (
                  <>
                    <Search size={20} className="mr-2" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </div>
          {isLoading && (
            <div className="flex justify-center items-center">
              <Loader className="animate-spin text-blue-500" size={40} />
            </div>
          )}
          {!isLoading && sharedContent && (
            <div>
              <MetadataDisplay
                feedback={sharedContent.feedback}
                permissions={sharedContent.permissions}
                timestamp={sharedContent.timestamp}
                agent={sharedContent.trajectory[0]?.args?.AGENT || 'Unknown'}
                confirmationMode={sharedContent.trajectory[0]?.args?.CONFIRMATION_MODE || false}
                language={sharedContent.trajectory[0]?.args?.LANGUAGE || 'Unknown'}
                llmModel={sharedContent.trajectory[0]?.args?.LLM_MODEL || 'Unknown'}
              />
              <h2 className="text-2xl font-semibold mb-4">Shared Trajectory</h2>
              {renderTrajectory(sharedContent.trajectory)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ShareOpenDevin;
