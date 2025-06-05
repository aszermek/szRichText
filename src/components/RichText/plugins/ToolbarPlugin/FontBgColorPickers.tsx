import { Palette, PaintBucket } from "@phosphor-icons/react";
import { Colorpicker } from "../../../UI/Colorpicker";

interface FontBgColorPickersProps {
    fontColor: string;
    onFontColorSelect: (color: string) => void;
    bgColor: string;
    onBgColorSelect: (color: string) => void;
}

export function FontBgColorPickers({
    fontColor,
    onFontColorSelect,
    bgColor,
    onBgColorSelect,
}: FontBgColorPickersProps) {
    return (
        <>
            <Colorpicker
                labelIcon={{ size: 16, color: "#0a0b0f", icon: Palette }}
                color={fontColor}
                onChanged={onFontColorSelect}
                title="Font color"
            />
            <Colorpicker
                labelIcon={{
                    size: 16,
                    color: "#0a0b0f",
                    icon: PaintBucket,
                }}
                color={bgColor.replace("#", "")}
                onChanged={onBgColorSelect}
                title="Background color"
            />
        </>
    );
}
