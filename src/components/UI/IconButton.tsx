import { HTMLAttributes } from "react";
import { IIconProps, Icon } from "./Icon";
import { Spinner } from "./Spinner";
import "./IconButton.scss";

export interface IIconButtonProps extends HTMLAttributes<HTMLButtonElement> {
    onClick?: () => void;
    icon?: Partial<IIconProps>;
    disabled?: boolean;
    isLoading?: boolean;
}

export const IconButton = ({
    onClick,
    icon,
    disabled,
    isLoading,
    className,
    ...rest
}: IIconButtonProps) => {
    return (
        <button
            className={`IconButton ${disabled && "IconButton-Disabled"} ${
                className || ""
            }`}
            disabled={disabled}
            onClick={() => {
                if (onClick) {
                    onClick();
                }
            }}
            {...rest}
        >
            {!isLoading ? <Icon {...icon} /> : <Spinner {...icon} />}
        </button>
    );
};
