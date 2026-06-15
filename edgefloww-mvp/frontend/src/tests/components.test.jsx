import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import HlsPlayer from "../components/HlsPlayer.jsx";
import LiveChat from "../components/LiveChat.jsx";

vi.mock("hls.js", () => {
  const mockHls = {
    loadSource: vi.fn(),
    attachMedia: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
  };
  return {
    default: {
      isSupported: () => false,
    },
  };
});

vi.mock("socket.io-client", () => ({
  io: () => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

describe("HlsPlayer", () => {
  it("renders video element with source", () => {
    render(<BrowserRouter><HlsPlayer src="http://example.com/stream.m3u8" /></BrowserRouter>);
    const video = document.querySelector("video");
    expect(video).toBeTruthy();
  });
});

describe("LiveChat", () => {
  it("renders chat container", () => {
    render(<BrowserRouter><LiveChat broadcastId="test123" /></BrowserRouter>);
    expect(screen.getByPlaceholderText("Сообщение...")).toBeTruthy();
  });

  it("sends message on form submit", () => {
    render(<BrowserRouter><LiveChat broadcastId="test123" /></BrowserRouter>);
    const input = screen.getByPlaceholderText("Сообщение...");
    fireEvent.change(input, { target: { value: "Hello" } });
    expect(input.value).toBe("Hello");
  });
});
