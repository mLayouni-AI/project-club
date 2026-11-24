import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Events from "../pages/Events";
import { useAuth } from "../context/AuthContext";
import { eventsAPI } from "../services/api";

const mocks = vi.hoisted(() => ({ getAll: vi.fn(), register: vi.fn(), cancelRegistration: vi.fn(), create: vi.fn(), update: vi.fn(), participants: vi.fn(), attendance: vi.fn() }));
vi.mock("../services/api", () => ({ eventsAPI: mocks, errorMessage: (error) => error.message }));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

describe("Events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { id: 5 },
      hasCapability: () => false,
      hasRole: (role) => role === "member",
    });
    mocks.getAll
      .mockResolvedValueOnce([{ id: 14, name: "Atelier données", status: "published", audience: "members", starts_at: "2026-11-10T10:00:00Z", capacity_remaining: 1, is_registered: false }])
      .mockResolvedValue([{ id: 14, name: "Atelier données", status: "published", audience: "members", starts_at: "2026-11-10T10:00:00Z", capacity_remaining: 0, is_registered: true }]);
    mocks.register.mockResolvedValue({ data: { status: "registered" } });
  });

  it("sends registrations to the API and updates the card from the refreshed result", async () => {
    render(<MemoryRouter><Events /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "M'inscrire" }));
    expect(mocks.register).toHaveBeenCalledWith(14);
    expect(await screen.findByRole("button", { name: "Annuler mon inscription" })).toBeInTheDocument();
  });
});
