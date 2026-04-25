import { useState } from "react";
import { Field } from "../common/Field";
import { StatusBanner } from "../common/StatusBanner";

type AdminLoginFormProps = {
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (credentials: { email: string; password: string }) => Promise<void>;
};

export function AdminLoginForm({
  isSubmitting,
  errorMessage,
  onSubmit,
}: AdminLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ email, password });
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <Field
        label="Email"
        inputProps={{
          type: "email",
          autoComplete: "username",
          inputMode: "email",
          placeholder: "admin@example.com",
          value: email,
          onChange: (event) => setEmail(event.target.value),
          required: true,
        }}
      />
      <Field
        label="Password"
        inputProps={{
          type: "password",
          autoComplete: "current-password",
          placeholder: "Enter the password",
          value: password,
          onChange: (event) => setPassword(event.target.value),
          required: true,
        }}
      />
      {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
      <button className="primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
