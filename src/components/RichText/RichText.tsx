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
import { useEffect, useState } from "react";
import "./RichText.scss";
import { ExtendedTextNode } from "./plugins/ExtendedTextNodePlugin";
import HtmlFromNodesPlugin from "./plugins/HtmlFromNodesPlugin";
import MentionsPlugin, {
    IRichTextUserMentionPluginParams,
    MentionNode,
} from "./plugins/MentionsPlugin";
import ToolbarPlugin, {
    IRichTextToolbarPluginParams,
} from "./plugins/ToolbarPlugin";
import { TreeViewPlugin } from "./plugins/TreeViewPlugin";

const theme = {
    heading: {
        h1: "RichText-Editor-H1",
        h2: "RichText-Editor-H2",
        h3: "RichText-Editor-H3",
    },
    list: {
        nested: {
            listitem: "RichText-Editor-NestedItem",
        },
        ol: "RichText-Editor-Ol",
        ul: "RichText-Editor-Ul",
        listitem: "RichText-Editor-Item",
    },
    quote: "RichText-Editor-Quote",
    code: "RichText-Editor-Code",
    link: "RichText-Editor-Link",
    text: {
        bold: "RichText-Editor-TextBold",
        italic: "RichText-Editor-TextItalic",
        strikethrough: "RichText-Editor-TextStrikethrough",
        underline: "RichText-Editor-TextUnderline",
        underlineStrikethrough: "RichText-Editor-TextUnderlineStrikethrough",
    },
};

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

    const handleFocus = (e?: React.FocusEvent<HTMLDivElement>) => {
        setIsFocused(true);
    };

    const handleBlur = (e?: React.FocusEvent<HTMLDivElement>) => {
        setIsFocused(false);
    };

    const initialConfig = {
        namespace: "MyEditor",
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
                        <div className={containerClasses}>
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
