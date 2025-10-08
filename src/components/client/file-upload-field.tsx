"use client";

import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FileUploadFieldProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  accept?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  allowExternalUrl?: boolean;
  onBlur?: () => void;
}

interface UploadResponse {
  publicUrl: string;
  width?: number;
  height?: number;
}

export function FileUploadField({
  id,
  label,
  value,
  onChange,
  accept,
  description,
  disabled,
  className,
  placeholder,
  allowExternalUrl = true,
  onBlur,
}: FileUploadFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setStatus("uploading");
      setMessage("Uploading…");
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const json = (await response.json()) as UploadResponse;
      if (!json.publicUrl) {
        throw new Error("Upload response missing URL");
      }

      onChange(json.publicUrl);
      onBlur?.();
      setStatus("success");
      setMessage("Upload complete");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId}>{label}</Label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {allowExternalUrl ? (
          <Input
            id={inputId}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="sm:flex-1"
            onBlur={onBlur}
          />
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          Upload file
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            disabled={disabled}
          >
            Clear
          </Button>
        ) : null}
      </div>
      {value ? (
        <p className="text-xs text-[hsl(var(--fg-muted))]">
          Current: <a href={value} target="_blank" rel="noreferrer" className="underline">View file</a>
        </p>
      ) : null}
      {description ? (
        <p className="text-xs text-[hsl(var(--fg-muted))]">{description}</p>
      ) : null}
      {status !== "idle" ? (
        <p
          className={cn(
            "text-xs",
            status === "error"
              ? "text-red-600"
              : "text-[hsl(var(--fg-muted))]",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
