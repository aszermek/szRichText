import "../../RichText.scss";

import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $isListNode, ListNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text";
import {
    $getSelectionStyleValueForProperty,
    $patchStyleText,
} from "@lexical/selection";
import {
    $findMatchingParent,
    $getNearestBlockElementAncestorOrThrow,
    $getNearestNodeOfType,
    mergeRegister,
} from "@lexical/utils";
import {
    ArrowClockwise,
    ArrowCounterClockwise,
    Eraser,
    LineVertical,
    Link,
    TextAlignCenter,
    TextAlignJustify,
    TextAlignLeft,
    TextAlignRight,
    TextB,
    TextItalic,
    TextStrikethrough,
    TextUnderline,
} from "@phosphor-icons/react";
import {
    $createParagraphNode,
    $getSelection,
    $isElementNode,
    $isRangeSelection,
    $isTextNode,
    CAN_REDO_COMMAND,
    CAN_UNDO_COMMAND,
    FORMAT_ELEMENT_COMMAND,
    FORMAT_TEXT_COMMAND,
    LexicalNode,
    REDO_COMMAND,
    SELECTION_CHANGE_COMMAND,
    UNDO_COMMAND,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getSelectedNode, sendEditorState } from "../../../../utils/utils";
import { IIconButtonProps, IconButton } from "../../../UI/IconButton";
import { BlockOptionsDropdownList } from "./BlockOptionsDropdownList";
import { FloatingLinkEditor } from "./FloatingLinkEditor";
import { FontBgColorPickers } from "./FontBgColorPickers";
import { IDropdownOption, Dropdown } from "../../../UI/Dropdown";

export interface IRichTextToolbarPluginParams {}

export function ToolbarPlugin({
    onChange,
    hide,
}: {
    onChange: (state: string) => void;
    hide: boolean;
}): React.ReactNode {
    const [editor] = useLexicalComposerContext();
    const toolbarRef = useRef(null);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [blockType, setBlockType] = useState("paragraph");
    const [fontSize, setFontSize] = useState<string>("16px");
    const [fontColor, setFontColor] = useState<string>("#000");
    const [bgColor, setBgColor] = useState<string>("#fff");
    const [isLink, setIsLink] = useState(false);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);
    const [textAlign, setTextAlign] = useState<string>("left");

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            const element =
                anchorNode.getKey() === "root"
                    ? anchorNode
                    : anchorNode.getTopLevelElementOrThrow();
            const elementKey = element.getKey();
            const elementDOM = editor.getElementByKey(elementKey);
            if (elementDOM !== null) {
                if ($isListNode(element)) {
                    const parentList = $getNearestNodeOfType(
                        anchorNode,
                        ListNode
                    );
                    const type = parentList
                        ? parentList.getTag()
                        : element.getTag();
                    setBlockType(type);
                } else {
                    const type = $isHeadingNode(element)
                        ? element.getTag()
                        : element.getType();
                    setBlockType(type);
                }
            }
            // Update text format
            setIsBold(selection.hasFormat("bold"));
            setIsItalic(selection.hasFormat("italic"));
            setIsUnderline(selection.hasFormat("underline"));
            setIsStrikethrough(selection.hasFormat("strikethrough"));
            selection;

            // Update links
            const node = getSelectedNode(selection);
            const parent = node.getParent();
            if ($isLinkNode(parent) || $isLinkNode(node)) {
                setIsLink(true);
            } else {
                setIsLink(false);
            }

            // Update font size, font and bg color
            setFontSize(
                $getSelectionStyleValueForProperty(
                    selection,
                    "font-size",
                    "16px"
                )
            );
            setFontColor(
                $getSelectionStyleValueForProperty(selection, "color", "#000")
            );
            setBgColor(
                $getSelectionStyleValueForProperty(
                    selection,
                    "background-color",
                    "#fff"
                )
            );

            let matchingParent: LexicalNode;
            if ($isLinkNode(parent)) {
                matchingParent = $findMatchingParent(
                    node,
                    (parentNode) =>
                        $isElementNode(parentNode) && !parentNode.isInline()
                );
            }

            setTextAlign(
                $isElementNode(matchingParent)
                    ? matchingParent.getFormatType()
                    : $isElementNode(node)
                    ? node.getFormatType()
                    : parent?.getFormatType() || "left"
            );

            const editorState = sendEditorState(editor);
            onChange(editorState);
        }
    }, [editor, onChange]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar();
                });
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                (_payload, newEditor) => {
                    updateToolbar();
                    return false;
                },
                1
            ),
            editor.registerCommand(
                CAN_UNDO_COMMAND,
                (payload) => {
                    setCanUndo(payload);
                    return false;
                },
                1
            ),
            editor.registerCommand(
                CAN_REDO_COMMAND,
                (payload) => {
                    setCanRedo(payload);
                    return false;
                },
                1
            )
        );
    }, [editor, updateToolbar]);

    const insertLink = useCallback(() => {
        const SUPPORTED_URL_PROTOCOLS = new Set([
            "http:",
            "https:",
            "mailto:",
            "sms:",
            "tel:",
        ]);

        const sanitizeUrl = (url: string): string => {
            try {
                const parsedUrl = new URL(url);
                if (!SUPPORTED_URL_PROTOCOLS.has(parsedUrl.protocol)) {
                    return "about:blank";
                }
            } catch {
                return url;
            }
            return url;
        };

        if (!isLink) {
            setIsLink(true);
            editor.dispatchCommand(
                TOGGLE_LINK_COMMAND,
                sanitizeUrl("https://")
            );
        } else {
            setIsLink(false);
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        }
    }, [editor, isLink, setIsLink]);

    const fontSizeOptions = (): IDropdownOption[] => {
        let options: IDropdownOption[] = [];
        for (let i = 10; i < 25; i++) {
            options.push({
                key: i.toString(),
                value: i + "px",
            });
        }
        return options;
    };

    const onFontSizeSelect = useCallback(
        (key: string, option: IDropdownOption) => {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $patchStyleText(selection, {
                        ["font-size"]: option.value,
                    });
                }
            });
        },
        [editor, "font-size"]
    );

    const applyStyleText = useCallback(
        (styles: Record<string, string>) => {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $patchStyleText(selection, styles);
                }
            });
        },
        [editor]
    );

    const onFontColorSelect = useCallback(
        (value: string) => {
            applyStyleText({ color: value });
        },
        [applyStyleText]
    );

    const onBgColorSelect = useCallback(
        (value: string) => {
            applyStyleText({ "background-color": value });
        },
        [applyStyleText]
    );

    const alignText = (key: string) => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, key as AlignSetting);
    };

    const clearFormatting = useCallback(() => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const anchor = selection.anchor;
                const focus = selection.focus;
                const nodes = selection.getNodes();
                const extractedNodes = selection.extract();

                if (
                    anchor.key === focus.key &&
                    anchor.offset === focus.offset
                ) {
                    return;
                }

                nodes.forEach((node, idx) => {
                    if ($isTextNode(node)) {
                        let textNode = node;
                        if (idx === 0 && anchor.offset !== 0) {
                            textNode =
                                textNode.splitText(anchor.offset)[1] ||
                                textNode;
                        }
                        if (idx === nodes.length - 1) {
                            textNode =
                                textNode.splitText(focus.offset)[0] || textNode;
                        }
                        const extractedTextNode = extractedNodes[0];
                        if (
                            nodes.length === 1 &&
                            $isTextNode(extractedTextNode)
                        ) {
                            textNode = extractedTextNode;
                        }

                        if (textNode.__style !== "") {
                            textNode.setStyle("");
                        }
                        if (textNode.__format !== 0) {
                            textNode.setFormat(0);
                            $getNearestBlockElementAncestorOrThrow(
                                textNode
                            ).setFormat("");
                        }
                        node = textNode;
                    } else if ($isHeadingNode(node) || $isQuoteNode(node)) {
                        node.replace($createParagraphNode(), true);
                    } else if ($isDecoratorBlockNode(node)) {
                        node.setFormat("");
                    }
                });
            }
        });
    }, [editor]);

    const commonIconButtonProps = {
        size: 16,
        tabIndex: -1,
        onMouseDown: (e) => e.preventDefault(),
    } as IIconButtonProps;

    if (hide) {
        return null;
    } else {
        return (
            <div className="RichText-Toolbar" ref={toolbarRef}>
                <div className="RichText-Toolbar-Group">
                    <IconButton
                        {...commonIconButtonProps}
                        disabled={!canUndo}
                        onClick={() => {
                            editor.dispatchCommand(UNDO_COMMAND, undefined);
                        }}
                        icon={{
                            size: 16,
                            // color: "#0a0b0f",
                            icon: ArrowCounterClockwise,
                        }}
                        title="Undo"
                    />
                    <IconButton
                        {...commonIconButtonProps}
                        disabled={!canRedo}
                        onClick={() => {
                            editor.dispatchCommand(REDO_COMMAND, undefined);
                        }}
                        icon={{
                            size: 16,
                            color: "#0a0b0f",
                            icon: ArrowClockwise,
                        }}
                        title="Redo"
                    />

                    <LineVertical color="#999999" />
                </div>

                <div className="RichText-Toolbar-Group">
                    <BlockOptionsDropdownList
                        editor={editor}
                        blockType={blockType}
                        toolbarRef={toolbarRef}
                    />

                    <LineVertical color="#999999" />
                </div>

                {blockType !== "h1" &&
                    blockType !== "h2" &&
                    blockType !== "h3" && (
                        <Dropdown
                            initialKey={"16"}
                            displayKey={fontSize.replace("px", "")}
                            options={fontSizeOptions()}
                            onChange={onFontSizeSelect}
                        />
                    )}

                <div className="RichText-Toolbar-Group">
                    <IconButton
                        {...commonIconButtonProps}
                        onClick={() => {
                            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
                        }}
                        icon={{ size: 16, color: "#0a0b0f", icon: TextB }}
                        className={isBold && "IconButton-Selected"}
                        title="Bold"
                    />
                    <IconButton
                        {...commonIconButtonProps}
                        onClick={() => {
                            editor.dispatchCommand(
                                FORMAT_TEXT_COMMAND,
                                "italic"
                            );
                        }}
                        icon={{ size: 16, color: "#0a0b0f", icon: TextItalic }}
                        className={isItalic && "IconButton-Selected"}
                        title="Italic"
                    />
                    <IconButton
                        {...commonIconButtonProps}
                        onClick={() => {
                            editor.dispatchCommand(
                                FORMAT_TEXT_COMMAND,
                                "underline"
                            );
                        }}
                        icon={{
                            size: 16,
                            color: "#0a0b0f",
                            icon: TextUnderline,
                        }}
                        className={isUnderline && "IconButton-Selected"}
                        title="Underline"
                    />
                    <IconButton
                        {...commonIconButtonProps}
                        onClick={() => {
                            editor.dispatchCommand(
                                FORMAT_TEXT_COMMAND,
                                "strikethrough"
                            );
                        }}
                        icon={{
                            size: 16,
                            color: "#0a0b0f",
                            icon: TextStrikethrough,
                        }}
                        className={isStrikethrough && "IconButton-Selected"}
                        title="Strikethrough"
                    />
                </div>
                <IconButton
                    {...commonIconButtonProps}
                    onClick={insertLink}
                    icon={{ size: 16, color: "#0a0b0f", icon: Link }}
                    title="Link"
                />
                {isLink &&
                    createPortal(
                        <FloatingLinkEditor editor={editor} />,
                        document.body
                    )}

                <FontBgColorPickers
                    fontColor={fontColor}
                    onFontColorSelect={onFontColorSelect}
                    bgColor={bgColor}
                    onBgColorSelect={onBgColorSelect}
                />

                <div className="RichText-Toolbar-Group">
                    <IconButton
                        {...commonIconButtonProps}
                        onClick={() => clearFormatting()}
                        icon={{ size: 16, color: "#0a0b0f", icon: Eraser }}
                        title="Clear formatting"
                    />

                    <LineVertical color="#999999" />
                </div>

                <div className="RichText-Toolbar-Group">
                    <IconButton
                        {...commonIconButtonProps}
                        onClick={() => alignText("left")}
                        icon={{
                            size: 16,
                            color: "#0a0b0f",
                            icon: TextAlignLeft,
                        }}
                        title="Align left"
                        className={
                            textAlign === "left" && "IconButton-Selected"
                        }
                    />
                    <IconButton
                        {...commonIconButtonProps}
                        onClick={() => alignText("center")}
                        icon={{
                            size: 16,
                            color: "#0a0b0f",
                            icon: TextAlignCenter,
                        }}
                        title="Align center"
                        className={
                            textAlign === "center" && "IconButton-Selected"
                        }
                    />
                    <IconButton
                        {...commonIconButtonProps}
                        onClick={() => alignText("right")}
                        icon={{
                            size: 16,
                            color: "#0a0b0f",
                            icon: TextAlignRight,
                        }}
                        title="Align right"
                        className={
                            textAlign === "right" && "IconButton-Selected"
                        }
                    />
                    <IconButton
                        {...commonIconButtonProps}
                        onClick={() => alignText("justify")}
                        icon={{
                            size: 16,
                            color: "#0a0b0f",
                            icon: TextAlignJustify,
                        }}
                        title="Justify"
                        className={
                            textAlign === "justify" && "IconButton-Selected"
                        }
                    />
                </div>
            </div>
        );
    }
}
