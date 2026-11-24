import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Members from "../pages/Members";
import { useAuth } from "../context/AuthContext";
import { membersAPI } from "../services/api";

const mocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  deactivate: vi.fn(),
  assignRoles: vi.fn(),
  export: vi.fn(),
  deactivateMember: vi.fn(),
}));

vi.mock("../services/api", () => ({
  membersAPI: mocks,
  errorMessage: (error, fallback) => error?.message || fallback,
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("Members", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { id: 8, first_name: "Admin", last_name: "Test" },
      hasCapability: (capability) => ["members.manage_members", "members.manage_roles"].includes(capability),
      deactivateMember: mocks.deactivateMember,
    });
    membersAPI.getAll.mockResolvedValue({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [{ id: 3, full_name: "Samira El Amrani", email: "samira@example.test", roles: ["member"], is_active: true }],
      },
    });
  });

  it("renders members returned by the API without showing credentials", async () => {
    render(<Members />);
    expect(await screen.findByText("Samira El Amrani")).toBeInTheDocument();
    expect(screen.getByText("samira@example.test")).toBeInTheDocument();
    expect(screen.getByText("Actif")).toBeInTheDocument();
    expect(screen.queryByText(/password|mot de passe/i)).not.toBeInTheDocument();
  });

  it("deactivates an account only after the confirmation and API call", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    mocks.deactivateMember.mockResolvedValue(undefined);
    render(<Members />);
    fireEvent.click(await screen.findByRole("button", { name: "Désactiver" }));
    await waitFor(() => expect(mocks.deactivateMember).toHaveBeenCalledWith(3));
    expect(confirm).toHaveBeenCalledTimes(1);
    confirm.mockRestore();
  });
});
