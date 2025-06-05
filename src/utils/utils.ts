import { $isAtNodeEnd } from "@lexical/selection";
import { RangeSelection } from "lexical";

export const calculateLuminance = (color: string) => {
    // Convert the color to RGB values
    const rgb = color
        .substring(1)
        .match(/.{2}/g)
        .map((c) => parseInt(c, 16));

    // Calculate the relative luminance using the formula from WCAG
    const [r, g, b] = rgb.map((c) => {
        const sRGB = c / 255;
        return sRGB <= 0.03928
            ? sRGB / 12.92
            : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    return luminance;
};

export const getSelectedNode = (selection: RangeSelection) => {
    const anchor = selection.anchor;
    const focus = selection.focus;
    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();
    if (anchorNode === focusNode) {
        return anchorNode;
    }
    const isBackward = selection.isBackward();
    if (isBackward) {
        return $isAtNodeEnd(focus) ? anchorNode : focusNode;
    } else {
        return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
    }
};
