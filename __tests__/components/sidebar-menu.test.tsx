import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Header } from '../../src/components/header';
import { Sidebar } from '../../src/components/sidebar/sidebar';

const renderSidebar = (onClose = vi.fn()) => {
  const view = render(
    <MemoryRouter>
      <Sidebar isHidden={false} onClose={onClose} />
    </MemoryRouter>,
  );

  return { ...view, onClose };
};

describe('compact sidebar menu parity', () => {
  it('renders as a dark full-width overlay', () => {
    renderSidebar();

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('fixed', 'inset-0', 'w-screen');
    expect(sidebar).not.toHaveClass('lg:w-[323px]');
    expect(sidebar).toHaveStyle({
      backgroundColor: 'rgb(24, 24, 24)',
      color: 'rgb(247, 243, 238)',
    });
  });

  it('keeps product and resource groups collapsed until opened', async () => {
    const user = userEvent.setup();
    renderSidebar();

    const productButton = screen.getByRole('button', { name: /product/i });
    const resourcesButton = screen.getByRole('button', { name: /resources/i });

    expect(productButton).toHaveAttribute('aria-expanded', 'false');
    expect(resourcesButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: /agent canvas/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^docs$/i })).not.toBeInTheDocument();

    await user.click(productButton);

    expect(productButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /agent canvas/i })).toHaveAttribute(
      'href',
      '/product/gui',
    );
    expect(screen.getByRole('link', { name: /automations/i })).toHaveAttribute(
      'href',
      'https://openhands.dev/product',
    );
    expect(screen.getByRole('link', { name: /cloud/i })).toHaveAttribute(
      'href',
      'https://openhands.dev/product',
    );
    expect(screen.getByRole('link', { name: /agent control plane/i })).toHaveAttribute(
      'href',
      '/enterprise#control-plane',
    );

    await user.click(resourcesButton);

    expect(productButton).toHaveAttribute('aria-expanded', 'false');
    expect(resourcesButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('link', { name: /agent canvas/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^docs$/i })).toHaveAttribute(
      'href',
      'https://docs.openhands.dev/',
    );
  });

  it('closes the overlay when a product subpage link is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderSidebar();

    await user.click(screen.getByRole('button', { name: /product/i }));
    await user.click(screen.getByRole('link', { name: /agent canvas/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('compact header menu controls', () => {
  it('uses the compact menu at live breakpoint widths and exposes close behavior', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const { container, rerender } = render(
      <MemoryRouter>
        <Header
          width={1200}
          showMenuIcon
          onClickMenuButton={onOpen}
          onClickCloseMenuButton={onClose}
        />
      </MemoryRouter>,
    );

    expect(container.querySelector('[data-wf-el="nav_grid"]')).toHaveStyle({ display: 'none' });
    await user.click(screen.getByRole('button', { name: /open menu/i }));
    expect(onOpen).toHaveBeenCalledTimes(1);

    rerender(
      <MemoryRouter>
        <Header
          width={1200}
          showMenuIcon={false}
          onClickMenuButton={onOpen}
          onClickCloseMenuButton={onClose}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(container.querySelector('[data-wf-el="nav_wrap"]')).toHaveStyle({
      backgroundColor: 'rgb(24, 24, 24)',
    });

    await user.click(screen.getByRole('button', { name: /close menu/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
