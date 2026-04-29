import React, { useState } from 'react';
import { formatDate } from '~/utils/format-date';
import { NewsletterForm } from './newsletter-form';
import { useActionData, useNavigation } from 'react-router';
import type { action } from '~/routes/blog.$slug';

interface BlogFooterProps {
  title: string;
  authors: Array<{ name: string; link?: string | null }>;
  date: string;
  url: string;
}

export const BlogFooter: React.FC<BlogFooterProps> = ({
  title,
  authors,
  date,
  url,
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigation = useNavigation();
  const data = useActionData<typeof action>();

  // Format the date for citation
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = dateObj.toLocaleString('default', { month: 'long' });
  const day = dateObj.getDate();

  // Generate BibTeX citation
  const generateBibTeX = () => {
    // Create a citation key from first author's last name and year
    const firstAuthorLastName = authors[0].name.split(' ').pop() || 'Author';
    const citationKey = `${firstAuthorLastName.toLowerCase()}${year}-${title.split(' ').slice(0, 3).join('-').toLowerCase()}`;

    return `@article{${citationKey},
  title = {${title}},
  author = {${authors.map((author) => author.name).join(' and ')}},
  journal = {OpenHands Blog},
  year = {${year}},
  month = {${month}},
  day = {${day}},
  url = {${url}}
}`;
  };

  const bibtex = generateBibTeX();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bibtex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className='w-full mt-12 mb-8 flex flex-col gap-8'>
      {/* Citation Section */}
      <div>
        <div className='flex justify-between items-center mb-2'>
          <div className='flex items-center gap-2'>
            <h3 className='text-xl font-semibold'>Citation</h3>
            <button
              onClick={toggleExpanded}
              className='text-gray-600 hover:text-blue-600 transition-colors flex items-center'
              title={expanded ? 'Collapse BibTeX' : 'Expand BibTeX'}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </button>
          </div>
          <button
            onClick={copyToClipboard}
            className='text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1'
            title='Copy BibTeX'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3'
              />
            </svg>
            {copied && <span className='text-green-600 text-sm'>Copied!</span>}
          </button>
        </div>

        {/* Citation preview when collapsed */}
        {!expanded && (
          <div
            className='bg-gray-50 p-4 rounded-md text-sm cursor-pointer hover:bg-gray-100 transition-colors'
            onClick={toggleExpanded}
          >
            <p className='text-gray-700 truncate'>
              {authors[0].name.split(' ').pop() || 'Author'},{' '}
              {title.substring(0, 50)}
              {title.length > 50 ? '...' : ''} ({year})
            </p>
          </div>
        )}

        {/* Full BibTeX when expanded */}
        {expanded && (
          <pre className="bg-gray-50 p-4 rounded-md text-xs overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {bibtex}
          </pre>
        )}
      </div>

      {/* Subscribe Section */}
      <div>
        <h3 className='text-xl font-semibold mb-2'>
          Subscribe to our newsletter
        </h3>
        <p className='text-description mb-4'>
          Get the latest updates from OpenHands delivered to your inbox.
        </p>
        <NewsletterForm
          error={data?.result === 'error' ? data.msg : undefined}
          success={data?.result === 'success' ? data.msg : undefined}
          disabled={navigation.state === 'submitting' || !!data}
        />
      </div>
    </div>
  );
};
