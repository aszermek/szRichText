import { useRef, useState, useCallback, useEffect } from "react";
import {
    $getSelection,
    $isRangeSelection,
    SELECTION_CHANGE_COMMAND,
} from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { mergeRegister } from "@lexical/utils";
import { getSelectedNode } from "../../../../utils/utils";
import { Input } from "../../../UI/Input";
import { PencilSimple, FloppyDisk, Trash } from "@phosphor-icons/react";
import { Icon } from "../../../UI/Icon";
import {
    useFloating,
    offset,
    flip,
    shift,
    autoUpdate,
} from "@floating-ui/react";

export function FloatingLinkEditor({ editor }) {
    const [linkUrl, setLinkUrl] = useState("");
    const [isEditMode, setEditMode] = useState(true);
    const [lastSelection, setLastSelection] = useState(null);
    const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(
        null
    );

    const { refs, floatingStyles } = useFloating({
        open: !!anchorElement,
        middleware: [offset(8), flip(), shift()],
        whileElementsMounted: autoUpdate,
        placement: "bottom-start",
    });

    useEffect(() => {
        refs.setReference(anchorElement);
    }, [anchorElement, refs]);

    const formatUrl = (url: string) => {
        if (!/^https?:\/\//i.test(url)) {
            return `http://${url}`;
        }
        return url;
    };

    const updateLinkEditor = useCallback(() => {
        editor.getEditorState().read(() => {
            const selection = $getSelection();
            let anchorDom: HTMLElement | null = null;
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
                const dom = editor.getElementByKey(node.getKey());
                anchorDom = dom;
                setLastSelection(selection);
            } else {
                setLinkUrl("");
                setLastSelection(null);
            }
            setAnchorElement(anchorDom);
            setEditMode(true);
        });
    }, [editor]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(() => {
                updateLinkEditor();
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
        updateLinkEditor();
    }, [editor, updateLinkEditor]);

    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (
                anchorElement &&
                refs.floating.current &&
                refs.floating.current.contains(e.target as Node)
            ) {
                e.stopPropagation();
            }
        };
        document.addEventListener("mousedown", handleMouseDown, true);
        return () => {
            document.removeEventListener("mousedown", handleMouseDown, true);
        };
    }, [anchorElement, refs.floating]);

    // Prevent Lexical from stealing focus from the input on mouse down/up
    useEffect(() => {
        const handlePointerDown = (e: PointerEvent) => {
            if (
                anchorElement &&
                refs.floating.current &&
                refs.floating.current.contains(e.target as Node)
            ) {
                // Prevent Lexical's event handlers from running
                e.stopPropagation();
            }
        };
        document.addEventListener("pointerdown", handlePointerDown, true);
        return () => {
            document.removeEventListener(
                "pointerdown",
                handlePointerDown,
                true
            );
        };
    }, [anchorElement, refs.floating]);

    if (!anchorElement) return null;

    return (
        <div
            ref={refs.setFloating}
            style={{
                ...floatingStyles,
                zIndex: 1000,
                position: "absolute",
            }}
            className="RichText-LinkEditor"
        >
            <Input
                inactive={!isEditMode}
                value={linkUrl}
                onChange={setLinkUrl}
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
                suffix={
                    <div className="RichText-LinkEditor-Buttons">
                        {!isEditMode ? (
                            <Icon
                                color="#2b59c3"
                                size={16}
                                icon={PencilSimple}
                                onClick={() => setEditMode(true)}
                            />
                        ) : (
                            <Icon
                                color="#2b59c3"
                                size={16}
                                icon={FloppyDisk}
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
                            color="#cc002c"
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
                }
                onMouseDown={(e) => {
                    e.stopPropagation();
                }}
                onMouseUp={(e) => {
                    e.stopPropagation();
                }}
            />
        </div>
    );
}
