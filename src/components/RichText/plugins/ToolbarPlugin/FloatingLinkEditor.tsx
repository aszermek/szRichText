import { useRef, useState, useCallback, useEffect } from "react";
import {
    $getSelection,
    $isRangeSelection,
    SELECTION_CHANGE_COMMAND,
} from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { mergeRegister } from "@lexical/utils";
import {
    getSelectedNode,
    positionEditorElement,
} from "../../../../utils/utils";

export function FloatingLinkEditor({ editor }) {
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
