import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { addPaymentMethod, deletePaymentMethod, getPaymentMethods, setPricing } from "../services/api";
import { useProfile } from "../profileContext";

const TYPES = ["BANK_TRANSFER", "CASH", "MOBILE_WALLET", "OTHER"];

const PaymentSettings = () => {
  const { profile, refreshProfile } = useProfile();
  const [price, setPrice] = useState(profile?.coachPriceCents ? String(profile.coachPriceCents / 100) : "");
  const [currency, setCurrency] = useState(profile?.currency ?? "USD");
  const [methods, setMethods] = useState([]);
  const [draft, setDraft] = useState({ type: "BANK_TRANSFER", label: "", instructions: "" });
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setMethods((await getPaymentMethods()).data);
    } catch {
      setMessage("Could not load payment methods.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action, success) => {
    try {
      await action();
      setMessage(success);
      await load();
      refreshProfile?.();
    } catch {
      setMessage("Could not save. Check the values and try again.");
    }
  };

  return (
    <Box component="section" className="coach-panel">
      <h2>Pricing &amp; payment methods</h2>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <TextField label="Price (blank = free)" size="small" type="number" value={price}
          onChange={(e) => setPrice(e.target.value)} />
        <TextField label="Currency" size="small" value={currency} slotProps={{ htmlInput: { maxLength: 3 } }}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
        <Button variant="contained"
          onClick={() => run(() => setPricing(Math.round(Number(price || 0) * 100), currency), "Pricing saved.")}>
          Save pricing
        </Button>
      </Box>
      {methods.map((m) => (
        <Box key={m.id} className="coach-card">
          <Typography>{m.type.replace("_", " ")}: {m.label}</Typography>
          {m.instructions && <Typography>{m.instructions}</Typography>}
          <Button onClick={() => run(() => deletePaymentMethod(m.id), "Method removed.")}>Remove</Button>
        </Box>
      ))}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
        <TextField select label="Type" size="small" value={draft.type}
          onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
          {TYPES.map((t) => <MenuItem key={t} value={t}>{t.replace("_", " ")}</MenuItem>)}
        </TextField>
        <TextField label="Method name" size="small" value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
        <TextField label="How to pay" size="small" value={draft.instructions}
          onChange={(e) => setDraft({ ...draft, instructions: e.target.value })} />
        <Button disabled={!draft.label.trim()}
          onClick={() => run(async () => {
            await addPaymentMethod(draft);
            setDraft({ type: "BANK_TRANSFER", label: "", instructions: "" });
          }, "Method added.")}>
          Add method
        </Button>
      </Box>
      {message && <Typography>{message}</Typography>}
    </Box>
  );
};

export default PaymentSettings;
