"use client";

import { useMemo, useRef, useState } from "react";
import { createContract } from "@/app/actions";
import { PLATFORM_LABEL } from "@/lib/constants";

type ClientOption = {
  id: string;
  name: string;
  contactName: string;
  platforms: string;
  monthlyRetainer: number;
};

type Template = { id: string; name: string; type: string; body: string };

function fillTemplate(body: string, client: ClientOption) {
  const platforms = client.platforms
    .split(",")
    .filter(Boolean)
    .map((p) => PLATFORM_LABEL[p] ?? p)
    .join(", ");
  return body
    .replaceAll("{{clientName}}", client.name)
    .replaceAll("{{contactName}}", client.contactName || client.name)
    .replaceAll("{{platforms}}", platforms || "social platforms")
    .replaceAll("{{retainer}}", `$${client.monthlyRetainer}`)
    .replaceAll(
      "{{startDate}}",
      new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    );
}

export function NewContractForm({
  clients,
  templates,
}: {
  clients: ClientOption[];
  templates: Template[];
}) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [templateId, setTemplateId] = useState("");
  const [content, setContent] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId]
  );

  function applyTemplate(id: string) {
    setTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (tpl && selectedClient) setContent(fillTemplate(tpl.body, selectedClient));
  }

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2.2} strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New contract
      </button>
    );
  }

  return (
    <div className="card w-full p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-ink">New contract</h3>
        <button className="text-ink-faint hover:text-ink" onClick={() => setOpen(false)} aria-label="Close">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={2} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <form
        ref={formRef}
        action={async (formData) => {
          await createContract(clientId, formData);
          formRef.current?.reset();
          setContent("");
          setTemplateId("");
          setOpen(false);
        }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div>
          <label className="label">Client</label>
          <select
            className="select-base"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Start from template</label>
          <select
            className="select-base"
            value={templateId}
            onChange={(e) => applyTemplate(e.target.value)}
          >
            <option value="">Blank</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Title</label>
          <input name="title" required className="input-base" placeholder="Monthly Retainer Agreement" />
        </div>
        <div>
          <label className="label">Type</label>
          <select name="type" className="select-base" defaultValue="RETAINER">
            <option value="RETAINER">Retainer</option>
            <option value="PROJECT">Project</option>
            <option value="ONE_TIME">One-time</option>
          </select>
        </div>
        <div>
          <label className="label">Value ($)</label>
          <input
            name="value"
            type="number"
            min="0"
            step="50"
            defaultValue={selectedClient ? selectedClient.monthlyRetainer * 12 : 0}
            className="input-base"
          />
        </div>
        <div>
          <label className="label">Start date</label>
          <input
            name="startDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="input-base"
          />
        </div>
        <div>
          <label className="label">End date</label>
          <input name="endDate" type="date" className="input-base" />
        </div>
        <label className="flex items-center gap-2 text-[13.5px] text-ink-dim sm:col-span-2">
          <input type="checkbox" name="autoRenew" className="h-3.5 w-3.5 accent-brand" />
          Auto-renews unless cancelled
        </label>
        <div className="sm:col-span-2">
          <label className="label">Contract text</label>
          <textarea
            name="content"
            className="input-base min-h-48 font-mono text-[12.5px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Pick a template above, or write it from scratch."
          />
        </div>
        <div className="flex items-center gap-2.5 sm:col-span-2">
          <button type="submit" className="btn-primary">Create contract</button>
          <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
