import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "../App";

describe("public portal", () => {
  afterEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("shows the club introduction at the public home route without authentication", async () => {
    window.history.replaceState({}, "", "/");
    render(<App />);
    expect(await screen.findByRole("heading", { name: /apprendre en construisant des projets numériques/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /rejoindre le club/i })).toBeInTheDocument();
  });
});
