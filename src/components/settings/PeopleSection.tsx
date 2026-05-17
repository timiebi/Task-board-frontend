"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useConnections, useInvitesSent, useSharingMutations } from "@/hooks/queries";
import { Button } from "../ui/Button";

export function PeopleSection() {
  const [email, setEmail] = useState("");
  const { data: connections = [] } = useConnections();
  const { data: invites = [] } = useInvitesSent();
  const { invite } = useSharingMutations();

  const pending = invites.filter((i) => i.status === "pending");

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await invite.mutateAsync(email.trim());
    setEmail("");
  };

  return (
    <section className="surface-section">
      <header className="surface-section-header">
        <h3>People</h3>
      </header>
      <div className="surface-section-body">
        <p className="surface-section-hint">
          Invite someone by the email on their account. They get a notification to accept, then
          you can share tasks and notes.
        </p>
        <form className="people-invite-form" onSubmit={(e) => void sendInvite(e)}>
          <input
            type="email"
            className="input"
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" loading={invite.isPending}>
            <UserPlus className="h-4 w-4" /> Invite
          </Button>
        </form>

        {pending.length > 0 && (
          <div className="people-block">
            <h4 className="people-block-title">Pending invites</h4>
            <ul className="people-list">
              {pending.map((i) => (
                <li key={i.id}>{i.invite_email}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="people-block">
          <h4 className="people-block-title">Connected ({connections.length})</h4>
          {connections.length === 0 ? (
            <p className="dash-empty">No connections yet.</p>
          ) : (
            <ul className="people-list">
              {connections.map((c) => (
                <li key={c.user_id}>
                  <strong>{c.username}</strong>
                  {c.email && <span className="people-email">{c.email}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
