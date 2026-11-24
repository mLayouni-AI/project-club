import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Signup from "../pages/Signup";
import { useAuth } from "../context/AuthContext";

vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

describe("Signup", () => {
  beforeEach(() => useAuth.mockReturnValue({ signup: vi.fn() }));

  it("communicates the same ten-character password minimum as the server", () => {
    render(<MemoryRouter><Signup /></MemoryRouter>);
    const password = screen.getByLabelText("Mot de passe");
    expect(password.minLength).toBe(10);
    expect(password.placeholder).toMatch(/10 caractères minimum/i);
  });
});
