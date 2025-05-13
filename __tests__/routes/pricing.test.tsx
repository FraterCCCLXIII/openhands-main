import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import Pricing from "../../src/routes/pricing";
import { HelmetProvider } from "react-helmet-async";

describe("Pricing Page", () => {
  it("renders the pricing page with correct content", () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <Pricing />
        </MemoryRouter>
      </HelmetProvider>
    );

    // Check main heading
    expect(screen.getByText("Flexible Pricing")).toBeInTheDocument();

    // Check pricing tiers
    expect(screen.getByText("Open Source")).toBeInTheDocument();
    expect(screen.getByText("Pay-as-you-go")).toBeInTheDocument();
    expect(screen.getByText("Business")).toBeInTheDocument();

    // Check descriptions
    expect(screen.getByText("The world's leading open source AI coding agent")).toBeInTheDocument();
    expect(screen.getByText("Great for individuals")).toBeInTheDocument();
    expect(screen.getByText("Great for teams with multiple users")).toBeInTheDocument();
    
    // Check OpenHands Cloud banner
    expect(screen.getByText("OpenHands Cloud")).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText("Get it on GitHub")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
    expect(screen.getByText("Contact Us")).toBeInTheDocument();

    // Check Open Source features
    expect(screen.getByText("Run OpenHands locally")).toBeInTheDocument();
    expect(screen.getByText("Bring your own LLM or API key")).toBeInTheDocument();
    expect(screen.getByText("Active open source community")).toBeInTheDocument();
    
    // Check Pay-as-you-go features
    expect(screen.getByText("Immediate access from any device")).toBeInTheDocument();
    expect(screen.getByText("No LLM account required")).toBeInTheDocument();
    expect(screen.getByText("No rate limits")).toBeInTheDocument();
    expect(screen.getByText("GitHub and GitLab support")).toBeInTheDocument();
    expect(screen.getByText("API support")).toBeInTheDocument();
    expect(screen.getByText("Refill as low as $10")).toBeInTheDocument();
    
    expect(screen.getByText("Everything in pay-as-you-go, plus:")).toBeInTheDocument();
    expect(screen.getByText("Additional integrations")).toBeInTheDocument();
    expect(screen.getByText("Competitive token pricing")).toBeInTheDocument();
    expect(screen.getByText("Self-hosted option")).toBeInTheDocument();
    expect(screen.getByText("Support package")).toBeInTheDocument();
  });
});