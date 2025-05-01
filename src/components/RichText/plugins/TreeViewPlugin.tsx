import type { EditorState, LexicalEditor } from "lexical";
import type { JSX } from "react";

import {
    CustomPrintNodeFn,
    generateContent,
    TreeView as TreeViewCore,
    useLexicalCommandsLog,
} from "@lexical/devtools-core";
import { mergeRegister } from "@lexical/utils";
import * as React from "react";
import { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export function TreeView({
    editor,
    customPrintNode,
}: {
    editor?: LexicalEditor;
    customPrintNode?: CustomPrintNodeFn;
}): JSX.Element {
    const treeElementRef = React.createRef<HTMLPreElement>();

    const [editorCurrentState, setEditorCurrentState] = useState<EditorState>(
        editor.getEditorState()
    );

    const commandsLog = useLexicalCommandsLog(editor);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                setEditorCurrentState(editorState);
            }),
            editor.registerEditableListener(() => {
                setEditorCurrentState(editor.getEditorState());
            })
        );
    }, [editor]);

    useEffect(() => {
        const element = treeElementRef.current;

        if (element !== null) {
            // Assigns the editor instance to the tree view DOM element for internal tracking
            // @ts-ignore Internal field used by Lexical
            element.__lexicalEditor = editor;

            return () => {
                // Cleans up the reference when the component is unmounted
                // @ts-ignore Internal field used by Lexical
                element.__lexicalEditor = null;
            };
        }
    }, [editor, treeElementRef]);

    const handleEditorReadOnly = (isReadonly: boolean) => {
        const rootElement = editor.getRootElement();
        if (rootElement == null) {
            return;
        }

        rootElement.contentEditable = isReadonly ? "false" : "true";
    };

    return (
        <div className="RichText-TreeView">
            <TreeViewCore
                viewClassName="RichText-TreeView-View"
                treeTypeButtonClassName="RichText-TreeView-Button"
                timeTravelButtonClassName="RichText-TreeView-Button"
                timeTravelPanelSliderClassName={
                    "RichText-TreeView-TimeTravel-PanelSlider"
                }
                timeTravelPanelButtonClassName={
                    "RichText-TreeView-TimeTravel-PanelButton"
                }
                timeTravelPanelClassName={"RichText-TreeView-TimeTravel-Panel"}
                setEditorReadOnly={handleEditorReadOnly}
                editorState={editorCurrentState}
                setEditorState={(state) => editor.setEditorState(state)}
                generateContent={async function (exportDOM) {
                    // Generates the content for the tree view, allowing customization with exportDOM and customPrintNode
                    return generateContent(
                        editor,
                        commandsLog,
                        exportDOM,
                        customPrintNode
                    );
                }}
                ref={treeElementRef}
            />
        </div>
    );
}

export function TreeViewPlugin(): JSX.Element {
    const [editor] = useLexicalComposerContext();
    return <TreeView editor={editor} />;
}
