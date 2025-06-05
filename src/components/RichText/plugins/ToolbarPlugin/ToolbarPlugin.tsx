import "../../RichText.scss";

import { $createCodeNode } from "@lexical/code";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
    $isListNode,
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    ListNode,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import {
    $createHeadingNode,
    $createQuoteNode,
    $isHeadingNode,
    $isQuoteNode,
    HeadingTagType,
} from "@lexical/rich-text";
import {
    $getSelectionStyleValueForProperty,
    $isAtNodeEnd,
    $patchStyleText,
    $setBlocksType,
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
    Code,
    Eraser,
    LineVertical,
    Link,
    ListBullets,
    ListNumbers,
    PaintBucket,
    Palette,
    Paragraph,
    Quotes,
    TextAlignCenter,
    TextAlignJustify,
    TextAlignLeft,
    TextAlignRight,
    TextB,
    TextHOne,
    TextHThree,
    TextHTwo,
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
    LexicalEditor,
    LexicalNode,
    REDO_COMMAND,
    RangeSelection,
    SELECTION_CHANGE_COMMAND,
    UNDO_COMMAND,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Colorpicker from "../../../UI/Colorpicker";
import Dropdown, { IDropdownOption } from "../../../UI/Dropdown";
import { IIconButtonProps, IconButton } from "../../../UI/IconButton";

export interface IRichTextToolbarPluginParams {}

function getSelectedNode(selection: RangeSelection) {
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
}

function sendEditorState(editor: LexicalEditor): string {
    return JSON.stringify(editor.getEditorState());
}

interface IBlockOptionsProps {
    editor: LexicalEditor;
    blockType: string;
    toolbarRef: React.MutableRefObject<HTMLDivElement>;
}

function BlockOptionsDropdownList({
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
            options={[
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
            ]}
            onChange={onChange}
            initialKey="paragraph"
            displayKey={blockType}
            width={172}
        />
    );
}

function positionEditorElement(editor: any, rect: any) {
    if (rect === null) {
        editor.style.opacity = "0";
        editor.style.top = "-1000px";
        editor.style.left = "-1000px";
    } else {
        editor.style.opacity = "1";
        editor.style.top = `${
            rect.top + rect.height + window.pageYOffset + 10
        }px`;
        editor.style.left = `${
            rect.left +
            window.pageXOffset -
            editor.offsetWidth / 2 +
            rect.width / 2
        }px`;
    }
}

function FloatingLinkEditor({ editor }) {
    const editorRef = useRef(null);
    const inputRef = useRef(null);
    const mouseDownRef = useRef(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [isEditMode, setEditMode] = useState(true);
    const [lastSelection, setLastSelection] = useState(null);

    const formatUrl = (url) => {
        if (!/^https?:\/\//i.test(url)) {
            return `http://${url}`;
        }
        return url;
    };

    const updateLinkEditor = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const node = getSelectedNode(selection);
            const parent = node.getParent();
            if ($isLinkNode(parent)) {
                setLinkUrl(parent.getURL());
            } else if ($isLinkNode(node)) {
                setLinkUrl(node.getURL());
            } else {
                setLinkUrl("");
            }
        }
        const editorElem = editorRef.current;
        const nativeSelection = window.getSelection();
        const activeElement = document.activeElement;

        if (editorElem === null) {
            return;
        }

        const rootElement = editor.getRootElement();
        if (
            selection !== null &&
            nativeSelection !== null &&
            rootElement !== null &&
            rootElement.contains(nativeSelection.anchorNode) &&
            editor.isEditable()
        ) {
            const domRange = nativeSelection.getRangeAt(0);
            let rect;
            if (nativeSelection.anchorNode === rootElement) {
                let inner = rootElement;
                while (inner.firstElementChild != null) {
                    inner = inner.firstElementChild;
                }
                rect = inner.getBoundingClientRect();
            } else {
                rect = domRange.getBoundingClientRect();
            }

            if (!mouseDownRef.current) {
                positionEditorElement(editorElem, rect);
            }
            setLastSelection(selection);
        } else if (!activeElement || activeElement.className !== "link-input") {
            positionEditorElement(editorElem, null);
            setLastSelection(null);
            setEditMode(false);
            setLinkUrl("");
        }

        return true;
    }, [editor]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateLinkEditor();
                });
            }),

            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    updateLinkEditor();
                    return true;
                },
                1
            )
        );
    }, [editor, updateLinkEditor]);

    useEffect(() => {
        editor.getEditorState().read(() => {
            updateLinkEditor();
        });
    }, [editor, updateLinkEditor]);

    return (
        <div ref={editorRef} className="RichText-LinkEditor">
            {/* <Input
                isCompact
                ref={inputRef}
                inactive={!isEditMode}
                extraProps={{
                    input: {
                        // autoFocus: true,
                        onClick: (e) => {
                            e.stopPropagation();
                        },
                        onFocus: (e) => {
                            e.stopPropagation();
                        },
                    },
                }}
                // className="link-input"
                value={linkUrl}
                onChanged={setLinkUrl}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        if (lastSelection !== null) {
                            if (linkUrl !== "") {
                                editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
                                    url: formatUrl(linkUrl),
                                    target: "_blank",
                                });
                            }
                            setEditMode(false);
                        }
                    } else if (event.key === "Escape") {
                        event.preventDefault();
                        setEditMode(false);
                    }
                }}
                suffix={{
                    noBorder: true,
                    value: (
                        <div className="RichText-LinkEditor-Buttons">
                            {!isEditMode ? (
                                <Icon
                                    color="Primary"
                                    size={16}
                                    icon={PencilSimple}
                                    onClick={() => setEditMode(true)}
                                />
                            ) : (
                                <Icon
                                    color="Primary"
                                    size={16}
                                    icon={
                                        FloppyDisk
                                    }
                                    onClick={() => {
                                        if (linkUrl !== "") {
                                            editor.dispatchCommand(
                                                TOGGLE_LINK_COMMAND,
                                                {
                                                    url: formatUrl(linkUrl),
                                                    target: "_blank",
                                                }
                                            );
                                        }
                                        setEditMode(false);
                                    }}
                                />
                            )}
                            <Icon
                                color="Primary"
                                size={16}
                                icon={Trash}
                                onClick={() => {
                                    editor.dispatchCommand(
                                        TOGGLE_LINK_COMMAND,
                                        null
                                    );
                                }}
                            />
                        </div>
                    ),
                }}
            /> */}
        </div>
    );
}

export default function ToolbarPlugin({
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
