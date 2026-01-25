import { ReactNode } from "react";

interface FormInputProps {
  label: string;
  // error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormInput({
  label,
  // error,
  required,
  children,
  className = "",
}: FormInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {children}
      {/* {error && <p className="mt-1 text-sm text-red-600">{error}</p>} */}
    </div>
  );
}
