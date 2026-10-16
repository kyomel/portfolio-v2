import { useState, type SubmitEvent } from "react";
import { profile } from "../data/profile";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = encodeURIComponent(
      `${form.message}\n\n- ${form.name} (${form.email})`,
    );
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(form.subject)}&body=${body}`;
  }

  return (
    <form onSubmit={submit}>
      <label className="field">
        Your Name
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>
      <label className="field">
        Your Email
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </label>
      <label className="field">
        Subject
        <input
          required
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
      </label>
      <label className="field">
        Your Message
        <textarea
          rows={5}
          required
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </label>
      <button className="btn btn-primary" type="submit">
        Send Message
      </button>
    </form>
  );
}
