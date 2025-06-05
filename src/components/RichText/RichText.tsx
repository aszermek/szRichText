import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { $generateNodesFromDOM } from "@lexical/html";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import classNames from "classnames";
import { $insertNodes, TextNode } from "lexical";
import { useEffect, useRef, useState } from "react";
import { theme } from "../../config/theme";
import "./RichText.scss";
import { ExtendedTextNode } from "./plugins/ExtendedTextNodePlugin";
import { HtmlFromNodesPlugin } from "./plugins/HtmlFromNodesPlugin";
import {
    IRichTextUserMentionPluginParams,
    MentionNode,
    MentionsPlugin,
} from "./plugins/MentionsPlugin";
import {
    IRichTextToolbarPluginParams,
    ToolbarPlugin,
} from "./plugins/ToolbarPlugin/ToolbarPlugin";
import { TreeViewPlugin } from "./plugins/TreeViewPlugin";

function onError(error: Error) {
    console.error(error);
}

function SetInitialStatePlugin({
    value,
    isHtml,
}: {
    value: string;
    isHtml?: boolean;
}) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!value) return;

        try {
            editor.update(() => {
                if (isHtml) {
                    const parser = new DOMParser();
                    const dom = parser.parseFromString(value, "text/html");
                    const nodes = $generateNodesFromDOM(editor, dom);
                    $insertNodes(nodes);
                } else {
                    const editorState = editor.parseEditorState(value);
                    if (!editorState.isEmpty()) {
                        editor.setEditorState(editorState);
                    }
                }
            });
        } catch (error) {
            onError(error as any);
        }
    }, [editor, isHtml]);

    return null;
}

export interface IRichTextProps {
    value: string;
    placeholder?: string;
    onChange?: (value: string) => void;
    onChangeHtml?: (value: string) => void;
    readOnly?: boolean;
    plugins?: {
        toolbar?: IRichTextToolbarPluginParams;
        userMention?: IRichTextUserMentionPluginParams;
    };
    isHtml?: boolean;
    label?: string;
}

export const RichText = ({
    value,
    placeholder,
    onChange,
    onChangeHtml,
    readOnly,
    plugins = { toolbar: {} },
    isHtml,
    label,
}: IRichTextProps): React.ReactNode => {
    const [editorState, setEditorState] = useState<string>(value);
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentEditableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setEditorState(value);
    }, [value]);

    useEffect(() => {
        if (onChange) {
            onChange(editorState);
        }
        if (onChangeHtml) {
            onChangeHtml(value);
        }
    }, [editorState, value]);

    const handleFocus = () => {
        if (!isFocused) {
            setIsFocused(true);
        }
    };

    const handleBlur = () => {
        if (isFocused) {
            setIsFocused(false);
        }
    };

    const handleContainerClick = (e: React.MouseEvent) => {
        if (readOnly) return;

        if (
            !isFocused &&
            contentEditableRef.current &&
            !contentEditableRef.current.contains(e.target as Node)
        ) {
            contentEditableRef.current.focus();
            handleFocus();
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                isFocused &&
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                handleBlur();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const initialConfig = {
        namespace: "szRichText",
        theme,
        onError,
        editable: !readOnly,
        nodes: [],
        placeholder: label,
        editorState: () => {},
    };

    if (isHtml) {
        const extendedTextNodes = [
            ExtendedTextNode,
            {
                replace: TextNode,
                with: (node: TextNode) => new ExtendedTextNode(node.__text),
            },
            ListNode,
            ListItemNode,
        ];
        initialConfig.nodes.push(...extendedTextNodes);
    }

    if (plugins?.toolbar) {
        const toolbarNodes = [
            HeadingNode,
            ListNode,
            ListItemNode,
            QuoteNode,
            CodeNode,
            CodeHighlightNode,
            AutoLinkNode,
            LinkNode,
        ];
        initialConfig.nodes.push(...toolbarNodes);
    }
    if (plugins?.userMention) {
        const mentionNodes = [MentionNode];
        initialConfig.nodes.push(...mentionNodes);
    }

    const containerClasses = classNames({
        [`RichText-Container`]: true,
        [`RichText-Container-Focused`]: isFocused,
    });

    return (
        <div className="RichText">
            <LexicalComposer initialConfig={initialConfig}>
                {readOnly ? (
                    <div>
                        <RichTextPlugin
                            contentEditable={<ContentEditable />}
                            placeholder={
                                !value ? <>{placeholder}</> : undefined
                            }
                            ErrorBoundary={LexicalErrorBoundary}
                        />
                        <SetInitialStatePlugin value={value} isHtml={isHtml} />
                    </div>
                ) : (
                    <>
                        <div
                            className={containerClasses}
                            ref={containerRef}
                            onMouseUp={handleContainerClick}
                        >
                            <div className="RichText-LabelContainer">
                                <span className="RichText-Label">{label}</span>
                            </div>
                            <ToolbarPlugin
                                onChange={setEditorState}
                                hide={!plugins.toolbar}
                            />
                            <div className="RichText-Content">
                                <div className="RichText-Content-Scroll">
                                    <RichTextPlugin
                                        contentEditable={
                                            <ContentEditable
                                                ref={contentEditableRef}
                                                className="RichText-ContentEditable"
                                                onFocus={handleFocus}
                                                onBlur={handleBlur}
                                            />
                                        }
                                        placeholder={null}
                                        ErrorBoundary={LexicalErrorBoundary}
                                    />
                                    <AutoFocusPlugin />
                                    {plugins.toolbar ? (
                                        <>
                                            <ListPlugin />
                                            <LinkPlugin />
                                            {readOnly ? (
                                                <ClickableLinkPlugin newTab />
                                            ) : null}
                                        </>
                                    ) : null}
                                    {plugins.userMention ? (
                                        <MentionsPlugin
                                            {...plugins.userMention}
                                        />
                                    ) : null}
                                    <SetInitialStatePlugin
                                        value={value}
                                        isHtml={isHtml}
                                    />
                                    <HtmlFromNodesPlugin
                                        onChange={onChangeHtml}
                                    />
                                </div>
                            </div>
                        </div>
                        <TreeViewPlugin />
                        <HistoryPlugin />
                    </>
                )}
            </LexicalComposer>
        </div>
    );
};
