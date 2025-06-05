import { useEffect, useMemo, useRef, useState } from "react";
import "./Dropdown.scss";
import { IIconProps, Icon } from "./Icon";
import { CaretDown } from "@phosphor-icons/react";

export interface IDropdownOption {
    key: string;
    value: string;
    icon?: Partial<IIconProps>;
}

export interface IDropdownProps {
    label?: string;
    options?: IDropdownOption[];
    initialKey?: string;
    displayKey?: string;
    width?: number;
    onClick?: () => void;
    onChange?: (key: string, option: IDropdownOption) => void;
}

export const Dropdown = ({
    label,
    options,
    initialKey,
    displayKey,
    width,
    onClick,
    onChange,
}: IDropdownProps) => {
    const [selectedKey, setSelectedKey] = useState<string>(initialKey);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const initialIcon = () => {
        if (initialKey) {
            return options?.find((option) => option?.key === initialKey)?.icon;
        }
    };

    const selectedOption = useMemo(() => {
        return options?.find((option) => option.key === selectedKey);
    }, [options, selectedKey]);

    const displayOption = useMemo(() => {
        return options?.find((option) => option.key === displayKey);
    }, [options, selectedKey]);

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
        const isInDropdown = path.some((p) => p === dropdownRef.current);

        if (!isInDropdown) {
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

    const handleChange = (e: any, option: IDropdownOption) => {
        setSelectedKey(option.key as string);
        if (onChange) {
            e.preventDefault();
            onChange(option.key, option);
        }
        setIsOpen(false);
    };

    return (
        <div className="Dropdown" style={{ width: `${width}px` }}>
            <button
                className="Dropdown-Button"
                onClick={(e: any) => handleClick(e)}
                tabIndex={-1}
            >
                {selectedKey ? (
                    <div className="Dropdown-Selected">
                        {displayKey && displayOption?.icon ? (
                            <Icon size={12} {...displayOption.icon} />
                        ) : selectedOption?.icon ? (
                            <Icon size={12} {...selectedOption.icon} />
                        ) : (
                            initialIcon() && (
                                <Icon size={12} {...initialIcon()} />
                            )
                        )}
                        <div className="Dropdown-Selected-Title">
                            {displayOption?.value || selectedOption?.value}
                        </div>
                    </div>
                ) : (
                    label
                )}
                <CaretDown size={12} />
            </button>
            {isOpen && (
                <div ref={dropdownRef} className="Dropdown-OptionsContainer">
                    <div
                        ref={dropdownRef}
                        className="Dropdown-OptionsContainer-Scroll"
                    >
                        {options.map((option, index) => (
                            <div
                                key={index}
                                className="Dropdown-Option"
                                onClick={(e: any) => handleChange(e, option)}
                            >
                                {option.icon && (
                                    <Icon size={12} {...option.icon} />
                                )}
                                {option.value}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
