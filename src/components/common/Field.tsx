import type { ChangeEventHandler, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type BaseFieldProps = {
  label: string;
  error?: string;
};

type InputFieldProps = BaseFieldProps & {
  as?: "input";
  inputProps: InputHTMLAttributes<HTMLInputElement>;
};

type TextareaFieldProps = BaseFieldProps & {
  as: "textarea";
  textareaProps: TextareaHTMLAttributes<HTMLTextAreaElement>;
};

type FieldProps = InputFieldProps | TextareaFieldProps;

export function Field(props: FieldProps) {
  return (
    <label className="field">
      <span className="field__label">{props.label}</span>
      {props.as === "textarea" ? (
        <textarea className="field__control field__control--textarea" {...props.textareaProps} />
      ) : (
        <input className="field__control" {...props.inputProps} />
      )}
      {props.error ? <span className="field__error">{props.error}</span> : null}
    </label>
  );
}
