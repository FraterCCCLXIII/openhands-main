import React, { createContext, useContext } from 'react';

interface GitHubModalContextType {
  openGitHubModal: () => void;
}

const GitHubModalContext = createContext<GitHubModalContextType | undefined>(undefined);

export const useGitHubModal = () => {
  const context = useContext(GitHubModalContext);
  if (!context) {
    throw new Error('useGitHubModal must be used within a GitHubModalProvider');
  }
  return context;
};

interface GitHubModalProviderProps {
  children: React.ReactNode;
  openGitHubModal: () => void;
}

export const GitHubModalProvider: React.FC<GitHubModalProviderProps> = ({
  children,
  openGitHubModal,
}) => {
  return (
    <GitHubModalContext.Provider value={{ openGitHubModal }}>
      {children}
    </GitHubModalContext.Provider>
  );
};