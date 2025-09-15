import React from 'react';
import { Modal } from './modal';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function WebUIGraphic() {
  return (
    <div className="w-[200px] h-[175px] bg-black rounded-lg flex items-center justify-center mb-4 overflow-hidden relative border border-gray-700 mx-auto">
      {/* Browser window mockup */}
      <div className="w-full h-full bg-black rounded-lg p-2">
        {/* Browser header */}
        <div className="flex items-center mb-2 bg-gray-800 rounded-t px-2 py-1">
          <div className="flex space-x-1 mr-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          <div className="text-gray-400 text-xs">localhost:3000</div>
        </div>
        
        {/* Web UI content */}
        <div className="bg-black rounded-b h-20 p-2 relative">
          {/* Header bar */}
          <div className="bg-gray-700 h-4 rounded mb-1 flex items-center px-2">
            <div className="text-yellow-400 text-xs font-bold">OpenHands</div>
          </div>
          
          {/* Content area with code editor mockup */}
          <div className="flex space-x-1 h-12">
            <div className="bg-gray-800 flex-1 rounded text-green-400 p-1 text-xs font-mono">
              <div className="text-gray-500">1</div>
              <div className="text-gray-500">2</div>
              <div className="text-gray-500">3</div>
            </div>
            <div className="bg-white flex-1 rounded border p-1">
              <div className="bg-gray-200 h-1 w-3/4 mb-1 rounded"></div>
              <div className="bg-gray-200 h-1 w-1/2 mb-1 rounded"></div>
              <div className="bg-blue-200 h-1 w-2/3 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CLIGraphic() {
  return (
    <div className="w-[200px] h-[175px] bg-black rounded-lg flex items-center justify-center mb-4 overflow-hidden relative border border-gray-700 mx-auto">
      {/* Terminal window */}
      <div className="w-full h-full bg-black rounded-lg p-2">
        {/* Terminal header */}
        <div className="flex items-center mb-2 bg-gray-800 rounded-t px-2 py-1">
          <div className="flex space-x-1 mr-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          <div className="text-gray-400 text-xs">Terminal</div>
        </div>
        
        {/* Terminal content */}
        <div className="text-green-400 font-mono text-xs leading-relaxed space-y-1">
          <div className="flex items-center">
            <span className="text-white">$ </span>
            <span className="text-yellow-400">openhands</span>
          </div>
          <div className="text-gray-300">🤖 OpenHands CLI v1.0</div>
          <div className="text-gray-300">Ready to help with your coding tasks!</div>
          <div className="flex items-center">
            <span className="text-blue-400">&gt;</span>
            <span className="text-white ml-1 animate-pulse">|</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GitHubModal({ isOpen, onClose }: GitHubModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="p-8">
        {/* Main title */}
        <h2 className="text-3xl font-bold text-center mb-8 pr-8">
          Get started with OpenHands Open Source
        </h2>
        
        {/* Two options side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Web UI Option */}
          <div className="flex flex-col items-center">
            <div className="h-16 flex flex-col justify-center items-center mb-4">
              <h3 className="text-xl font-bold text-center">Web UI</h3>
              <p className="text-sm text-gray-600 text-center">(requires docker)</p>
            </div>
            <div className="mb-4">
              <WebUIGraphic />
            </div>
            <a
              href="https://docs.all-hands.dev/usage/local-setup#start-the-app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-3/4 bg-black text-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-gray-800 transition-colors"
            >
              Download Web UI
            </a>
          </div>
          
          {/* CLI Option */}
          <div className="flex flex-col items-center">
            <div className="h-16 flex flex-col justify-center items-center mb-4">
              <h3 className="text-xl font-bold text-center">CLI</h3>
            </div>
            <div className="mb-4">
              <CLIGraphic />
            </div>
            <a
              href="https://docs.all-hands.dev/usage/how-to/cli-mode#getting-started"
              target="_blank"
              rel="noopener noreferrer"
              className="w-3/4 bg-black text-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-gray-800 transition-colors"
            >
              Download CLI
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}