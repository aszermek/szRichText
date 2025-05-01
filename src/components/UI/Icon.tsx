import { IconWeight } from "@phosphor-icons/react";
import React, { HTMLAttributes } from "react";

export interface IIconProps extends HTMLAttributes<HTMLDivElement> {
    icon?: React.ElementType | ((p: any) => React.ReactNode);
    size?: number;
    color?: string;
    weight?: IconWeight;
}

export const Icon = ({
    icon,
    size = 24,
    color = "#0a0b0f",
    weight,
    className,
}: IIconProps) => {
    if (!icon) {
        console.error("Icon is not defined", { icon });

        return null;
    }

    const IconComponent = icon as React.ElementType;

    return (
        <IconComponent
            size={size}
            color={color}
            weight={weight}
            className={className}
        />
    );
};
