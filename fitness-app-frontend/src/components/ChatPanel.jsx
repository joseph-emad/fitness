import { Box, Button, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { getMessages, sendMessage } from "../services/api";

const POLL_MS = 5000;

const ChatPanel = ({ requestId, currentUserId, readOnly = false }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const lastSeen = useRef(null);

  const poll = useCallback(async () => {
    try {
      const response = await getMessages(requestId, lastSeen.current);
      if (response.data.length > 0) {
        lastSeen.current = response.data[response.data.length - 1].createdAt;
        setMessages((current) => {
          const known = new Set(current.map((m) => m.id));
          return [...current, ...response.data.filter((m) => !known.has(m.id))];
        });
      }
      setError("");
    } catch {
      setError("Could not load messages.");
    }
  }, [requestId]);

  useEffect(() => {
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, [poll]);

  const submit = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    try {
      await sendMessage(requestId, text);
      setText("");
      await poll();
    } catch {
      setError("Could not send your message.");
    }
  };

  return (
    <Box component="section" className="coach-panel">
      <h2>Messages</h2>
      {error && <Typography role="alert">{error}</Typography>}
      {messages.length === 0 && <Typography>No messages yet.</Typography>}
      {messages.map((m) => (
        <Typography key={m.id} sx={{ textAlign: m.senderId === currentUserId ? "right" : "left" }}>
          <strong>{m.senderId === currentUserId ? "You" : "Them"}:</strong> {m.content}
        </Typography>
      ))}
      {!readOnly && (
        <form onSubmit={submit}>
          <TextField
            label="Write a message"
            size="small"
            fullWidth
            margin="dense"
            slotProps={{ htmlInput: { maxLength: 2000 } }}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button type="submit" variant="contained">Send</Button>
        </form>
      )}
    </Box>
  );
};

export default ChatPanel;
