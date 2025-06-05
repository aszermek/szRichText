import React from "react";
import "./Input.scss";

interface IInputProps {
    value?: string;
    onChange?: (value: string) => void;
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
    label?: string;
    inactive?: boolean;
}

export const Input = ({
    value,
    onChange,
    prefix,
    suffix,
    label,
    inactive,
    ...rest
}: IInputProps) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e.target.value);
    };

    return (
        <div
            className={`Input-Container ${
                inactive ? "Input-Container--inactive" : ""
            }`}
        >
            {prefix && <span className="Input-Prefix">{prefix}</span>}
            <div className="Input-FieldWrapper">
                <input
                    className="Input-Field"
                    value={value}
                    onChange={handleChange}
                    disabled={inactive}
                    {...rest}
                />
                {label && !value && (
                    <span className="Input-Label">{label}</span>
                )}
            </div>
            {suffix && <span className="Input-Suffix">{suffix}</span>}
        </div>
    );
};
