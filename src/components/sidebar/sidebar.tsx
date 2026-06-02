import { motion } from 'framer-motion';
import React from 'react';
import { Link } from 'react-router';
import {
  DESKTOP_NAV_ITEMS,
  HEADER_GET_OPENHANDS_URL,
  PRODUCT_DROPDOWN_ITEMS,
  RESOURCE_LINK_GROUPS,
  type SiteLink,
} from '~/constants/site-shell';

interface SidebarProps {
  isHidden: boolean;
  onClose: () => void;
  onClickGitHubButton?: () => void;
}

type MenuGroup = 'product' | 'resources';

const menuLinkClassName =
  'flex w-full items-center justify-start gap-2 text-left text-base leading-[22.4px] text-brand-bg hover:text-brand-accent';

function InternalOrExternalMenuLink({
  item,
  children,
  onClose,
  className = menuLinkClassName,
}: {
  item: SiteLink;
  children?: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  if (item.external) {
    return (
      <a
        href={item.to}
        target='_blank'
        rel='noopener noreferrer'
        className={className}
        onClick={onClose}
      >
        {children ?? item.name}
      </a>
    );
  }

  return (
    <Link to={item.to} className={className} onClick={onClose}>
      {children ?? item.name}
    </Link>
  );
}

function MenuGroupButton({
  id,
  label,
  isOpen,
  onClick,
}: {
  id: MenuGroup;
  label: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      className={menuLinkClassName}
      aria-expanded={isOpen}
      aria-controls={`compact-menu-${id}`}
      onClick={onClick}
    >
      <span>{label}</span>
      <span aria-hidden='true' className={isOpen ? 'rotate-180' : undefined}>
        ▾
      </span>
    </button>
  );
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ isHidden, onClose, onClickGitHubButton }, ref) => {
    const [openGroup, setOpenGroup] = React.useState<MenuGroup | null>(null);
    const productIsOpen = openGroup === 'product';
    const resourcesIsOpen = openGroup === 'resources';

    React.useEffect(() => {
      if (isHidden) {
        setOpenGroup(null);
      }
    }, [isHidden]);

    const toggleGroup = (group: MenuGroup) => {
      setOpenGroup((currentGroup) => (currentGroup === group ? null : group));
    };

    return (
      <motion.aside
        ref={ref}
        hidden={isHidden}
        initial={{ y: '-100%' }}
        animate={{ y: isHidden ? '-100%' : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        data-testid='sidebar'
        aria-label='Main menu'
        className='fixed inset-0 z-40 h-screen w-screen overflow-y-auto'
        style={{
          backgroundColor: 'rgb(34, 21, 13)',
          color: 'rgb(249, 240, 217)',
          padding: '128px 2.5vw 48px',
        }}
      >
        <nav aria-label='Compact navigation'>
          <ul className='flex max-w-[720px] list-none flex-col gap-8 p-0 m-0'>
            <li>
              <MenuGroupButton
                id='product'
                label='Product'
                isOpen={productIsOpen}
                onClick={() => toggleGroup('product')}
              />
              {productIsOpen ? (
                <ul
                  id='compact-menu-product'
                  className='mt-4 flex list-none flex-col gap-4 p-0'
                >
                  {PRODUCT_DROPDOWN_ITEMS.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.to}
                        className='flex flex-col gap-1 text-brand-bg hover:text-brand-accent'
                        onClick={onClose}
                      >
                        <span>{item.name}</span>
                        <span className='text-sm leading-[21.6px] text-[#b3a88c]'>
                          {item.description}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>

            {DESKTOP_NAV_ITEMS.filter((item) => item.name !== 'Product').map((item) => (
              <li key={item.name}>
                <InternalOrExternalMenuLink item={item} onClose={onClose} />
              </li>
            ))}

            <li>
              <MenuGroupButton
                id='resources'
                label='Resources'
                isOpen={resourcesIsOpen}
                onClick={() => toggleGroup('resources')}
              />
              {resourcesIsOpen ? (
                <div id='compact-menu-resources' className='mt-4 flex flex-col gap-6'>
                  {RESOURCE_LINK_GROUPS.map((group) => (
                    <div key={group.title} className='flex flex-col gap-3'>
                      <div className='font-mono text-sm leading-[16.8px] text-brand-bg'>
                        {group.title}
                      </div>
                      <ul className='flex list-none flex-col gap-4 p-0 m-0'>
                        {group.links.map((item) => (
                          <li key={item.name}>
                            <InternalOrExternalMenuLink item={item} onClose={onClose} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}
            </li>

            <li className='pt-3'>
              <a
                href='https://docs.openhands.dev/sdk'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex text-brand-bg no-underline hover:text-brand-accent'
                onClick={onClose}
              >
                SDK
              </a>
            </li>
            <li>
              <a
                href={HEADER_GET_OPENHANDS_URL}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex text-brand-bg no-underline hover:text-brand-accent'
                onClick={onClose}
              >
                Get OpenHands
              </a>
            </li>
            <li>
              <a
                href='https://app.all-hands.dev/'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex text-brand-bg no-underline hover:text-brand-accent'
                onClick={onClose}
              >
                Try it live
              </a>
            </li>
            {onClickGitHubButton ? (
              <li>
                <button
                  type='button'
                  className='text-brand-bg no-underline hover:text-brand-accent'
                  onClick={() => {
                    onClose();
                    onClickGitHubButton();
                  }}
                >
                  Start with OSS
                </button>
              </li>
            ) : null}
          </ul>
        </nav>
      </motion.aside>
    );
  },
);

Sidebar.displayName = 'Sidebar';
