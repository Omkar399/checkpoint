"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pollMessages } from "@/lib/api/messages";
import type { Message, WsEvent } from "@/lib/api/types";

export type FeedItem = Message | (WsEvent & { type: "new_checkin" })["message"];

export type ReactionEvent =
  | Extract<WsEvent, { type: "reaction_added" }>
  | Extract<WsEvent, { type: "reaction_removed" }>;

interface UseWebSocketOptions {
  onMessage?: (item: FeedItem) => void;
  onReaction?: (event: ReactionEvent) => void;
}

type ConnectionType = "websocket" | "polling" | null;

export function useWebSocket(channelId: number | null, { onMessage, onReaction }: UseWebSocketOptions = {}) {
  const [connected, setConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<ConnectionType>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMessageIdRef = useRef<number | null>(null);
  const onMessageRef = useRef(onMessage);
  const onReactionRef = useRef(onReaction);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onReactionRef.current = onReaction;
  }, [onReaction]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (!channelId) return;
    stopPolling();
    setConnectionType("polling");
    setConnected(true);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await pollMessages(channelId, lastMessageIdRef.current);
        const messages = res.data;
        if (messages && messages.length > 0) {
          for (const msg of messages) {
            onMessageRef.current?.(msg);
          }
          lastMessageIdRef.current = messages[messages.length - 1].id;
        }
      } catch {
        // retry on next tick
      }
    }, 10_000);
  }, [channelId, stopPolling]);

  useEffect(() => {
    if (!channelId) return;
    const token = window.localStorage.getItem("token");
    if (!token) return;

    const wsBase = process.env.NEXT_PUBLIC_WS_URL ?? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/v1/ws`;
    const url = `${wsBase}/${channelId}?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setConnectionType("websocket");
      stopPolling();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsEvent;

        if (data.type === "new_message") {
          lastMessageIdRef.current = data.message.id;
          onMessageRef.current?.(data.message);
        } else if (data.type === "new_checkin") {
          onMessageRef.current?.(data.message);
        } else if (data.type === "reaction_added" || data.type === "reaction_removed") {
          onReactionRef.current?.(data);
        }
        // user_joined / user_left intentionally ignored for parity with legacy
      } catch {
        // malformed frame, skip
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setConnectionType(null);
      startPolling();
    };

    ws.onerror = () => {
      ws.close();
    };

    return () => {
      stopPolling();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnected(false);
      setConnectionType(null);
    };
  }, [channelId, startPolling, stopPolling]);

  const send = useCallback((payload: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const sendMessage = useCallback((content: string) => send({ type: "send_message", content }), [send]);
  const sendCheckin = useCallback(
    (
      value: number | null,
      note: string | null,
      payload?: {
        checkedItems?: number[] | null;
        fieldStates?: Array<{ idx: number; checked?: boolean; value?: number }> | null;
      },
    ) =>
      send({
        type: "send_checkin",
        value,
        note,
        checked_items: payload?.checkedItems ?? null,
        field_states: payload?.fieldStates ?? null,
      }),
    [send],
  );
  const sendReaction = useCallback(
    (checkinId: number, emoji: string) => send({ type: "add_reaction", checkin_id: checkinId, emoji }),
    [send],
  );
  const removeReaction = useCallback(
    (checkinId: number, emoji: string) => send({ type: "remove_reaction", checkin_id: checkinId, emoji }),
    [send],
  );

  return { connected, connectionType, sendMessage, sendCheckin, sendReaction, removeReaction };
}
