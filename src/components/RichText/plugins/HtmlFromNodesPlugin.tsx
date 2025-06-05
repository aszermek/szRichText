import { $generateHtmlFromNodes } from "@lexical/html";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export function HtmlFromNodesPlugin({
    onChange,
}: {
    onChange: (state: string) => void;
}) {
    const [editor] = useLexicalComposerContext();

    if (onChange) {
        editor.update(() => {
            const htmlFromNodes = $generateHtmlFromNodes(editor, null);
            onChange(htmlFromNodes);
        });
    }

    return null;
}
