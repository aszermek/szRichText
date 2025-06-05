import {
    $createParagraphNode,
    $getSelection,
    $isRangeSelection,
    LexicalEditor,
} from "lexical";
import {
    $createHeadingNode,
    $createQuoteNode,
    HeadingTagType,
} from "@lexical/rich-text";
import { $createCodeNode } from "@lexical/code";
import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { useEffect, useRef } from "react";
import {
    Paragraph,
    TextHOne,
    TextHTwo,
    TextHThree,
    ListBullets,
    ListNumbers,
    Quotes,
    Code,
} from "@phosphor-icons/react";
import { $patchStyleText, $setBlocksType } from "@lexical/selection";
import { Dropdown, IDropdownOption } from "../../../UI/Dropdown";

const dropdownOptions: IDropdownOption[] = [
    {
        key: "paragraph",
        value: "Paragraph",
        icon: { size: 16, color: "#0a0b0f", icon: Paragraph },
    },
    {
        key: "h1",
        value: "H1",
        icon: { size: 16, color: "#0a0b0f", icon: TextHOne },
    },
    {
        key: "h2",
        value: "H2",
        icon: { size: 16, color: "#0a0b0f", icon: TextHTwo },
    },
    {
        key: "h3",
        value: "H3",
        icon: { size: 16, color: "#0a0b0f", icon: TextHThree },
    },
    {
        key: "ul",
        value: "Bullet list",
        icon: { size: 16, color: "#0a0b0f", icon: ListBullets },
    },
    {
        key: "ol",
        value: "Numbered list",
        icon: { size: 16, color: "#0a0b0f", icon: ListNumbers },
    },
    {
        key: "quote",
        value: "Quote",
        icon: { size: 16, color: "#0a0b0f", icon: Quotes },
    },
    {
        key: "code",
        value: "Code",
        icon: { size: 16, color: "#0a0b0f", icon: Code },
    },
];

interface IBlockOptionsProps {
    editor: LexicalEditor;
    blockType: string;
    toolbarRef: React.MutableRefObject<HTMLDivElement>;
}

export function BlockOptionsDropdownList({
    editor,
    blockType = "paragraph",
    toolbarRef,
}: IBlockOptionsProps) {
    const dropDownRef = useRef(null);

    useEffect(() => {
        const toolbar = toolbarRef.current;
        const dropDown = dropDownRef.current;

        if (toolbar !== null && dropDown !== null) {
            const { top, left } = toolbar.getBoundingClientRect();
            dropDown.style.top = `${top + 40}px`;
            dropDown.style.left = `${left}px`;
        }
    }, [dropDownRef, toolbarRef]);

    const formatParagraph = () => {
        if (blockType !== "paragraph") {
            editor.update(() => {
                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createParagraphNode());
                }
            });
        }
    };

    const formatHeading = (key: string) => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $patchStyleText(selection, {
                    ["font-size"]: null,
                });
                $setBlocksType(selection, () =>
                    $createHeadingNode(key as HeadingTagType)
                );
            }
        });
    };

    const formatList = (key: string) => {
        if (key === "ul") {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        }
        if (key === "ol") {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }
    };

    const formatQuote = () => {
        if (blockType !== "quote") {
            editor.update(() => {
                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createQuoteNode());
                }
            });
        }
    };

    const formatCode = () => {
        if (blockType !== "code") {
            editor.update(() => {
                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createCodeNode());
                }
            });
        }
    };

    const onChange = (key: string) => {
        switch (key) {
            case "paragraph":
                formatParagraph();
                break;
            case "h1":
            case "h2":
            case "h3":
                formatHeading(key);
                break;
            case "ol":
            case "ul":
                formatList(key);
                break;
            case "quote":
                formatQuote();
                break;
            case "code":
                formatCode();
                break;
        }
    };

    return (
        <Dropdown
            options={dropdownOptions}
            onChange={onChange}
            initialKey="paragraph"
            displayKey={blockType}
            width={172}
        />
    );
}
