import * as React from "react";
import { useEffect, useRef, useState } from "react";
import "./Colorpicker.scss";
import { HSB } from "./HSB";
import { IIconProps, Icon } from "./Icon";
import { CaretDown } from "@phosphor-icons/react";

export interface IColorpickerProps
    extends React.HTMLAttributes<HTMLDivElement> {
    label?: string;
    labelIcon?: Partial<IIconProps>;
    color: string;
    displayColor?: string;
    onClick?: () => void;
    onChanged?: (color: string) => void;
}

export const Colorpicker = ({
    label,
    labelIcon,
    color,
    displayColor,
    onClick,
    onChanged,
    ...rest
}: IColorpickerProps) => {
    const [selectedColor, setSelectedColor] = useState<string>("ffffff");
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleClick = (e: any) => {
        e.preventDefault();
        setIsOpen(!isOpen);
        if (onClick) {
            onClick();
        }
    };

    const onClickOutside = (e: MouseEvent) => {
        const path =
            ((e as any).path as HTMLDivElement[]) || e.composedPath
                ? e.composedPath()
                : [];
        const isInColorpicker = path.some((p) => p === dropdownRef.current);

        if (!isInColorpicker) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        setTimeout(() => {
            if (isOpen) {
                document.addEventListener("click", onClickOutside);
            } else {
                document.removeEventListener("click", onClickOutside);
            }
        }, 10);
        return () => {
            document.removeEventListener("click", onClickOutside);
        };
    }, [isOpen]);

    const handleChange = (color: string) => {
        setSelectedColor(color);
        if (onChanged) {
            onChanged(color);
        }
    };

    const colorIndicator = displayColor || selectedColor;

    return (
        <div className="Colorpicker" {...rest}>
            <button
                className="Colorpicker-Button"
                onClick={handleClick}
                tabIndex={-1}
            >
                {labelIcon && <Icon size={12} {...labelIcon} />}
                {label}
                <CaretDown size={12} />
                {colorIndicator && (
                    <div
                        className="Colorpicker-ColorIndicator"
                        style={{ backgroundColor: colorIndicator }}
                    />
                )}
            </button>
            {isOpen && (
                <div ref={dropdownRef} className="Colorpicker-Container">
                    <HSB color={selectedColor} onChange={handleChange} />
                </div>
            )}
        </div>
    );
};
