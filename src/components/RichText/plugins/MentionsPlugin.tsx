import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    LexicalTypeaheadMenuPlugin,
    MenuOption,
    MenuTextMatch,
    useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import classNames from "classnames";
import type { Spread } from "lexical";
import {
    $applyNodeReplacement,
    TextNode,
    type DOMConversionMap,
    type DOMConversionOutput,
    type DOMExportOutput,
    type EditorConfig,
    type LexicalNode,
    type NodeKey,
    type SerializedTextNode,
} from "lexical";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as ReactDOM from "react-dom";
import "../RichText.scss";

export interface IRichTextUserMentionPluginParams {
    getUsers: () => Promise<{ id: number; userName: string }[]>;
    onClickUser?: (user: { id: number; userName: string }) => void;
    triggerOnCapitalizedMatch?: boolean;
}

export type SerializedMentionNode = Spread<
    {
        mentionId: number;
        mentionName: string;
    },
    SerializedTextNode
>;

function convertMentionElement(
    domNode: HTMLElement
): DOMConversionOutput | null {
    const textContent = domNode.textContent;
    const id = domNode.getAttribute("data-lexical-mention-id");

    if (textContent !== null && id !== null) {
        const node = $createMentionNode(parseInt(id, 10), textContent);
        return {
            node,
        };
    }

    return null;
}

export class MentionNode extends TextNode {
    __mentionId: number;
    __mentionName: string;
    __onClick?: (user: { id: number; userName: string }) => void;

    static getType(): string {
        return "mention";
    }

    static clone(node: MentionNode): MentionNode {
        return new MentionNode(
            node.__mentionId,
            node.__mentionName,
            node.__text,
            node.__key
        );
    }

    static importJSON(serializedNode: SerializedMentionNode): MentionNode {
        const node = $createMentionNode(
            serializedNode.mentionId,
            serializedNode.mentionName
        );
        node.setTextContent(serializedNode.text);
        node.setFormat(serializedNode.format);
        node.setDetail(serializedNode.detail);
        node.setMode(serializedNode.mode);
        node.setStyle(serializedNode.style);
        return node;
    }

    constructor(
        mentionId: number,
        mentionName: string,
        text?: string,
        key?: NodeKey
    ) {
        super(text ?? mentionName, key);
        this.__mentionId = mentionId;
        this.__mentionName = mentionName;
    }

    exportJSON(): SerializedMentionNode {
        return {
            ...super.exportJSON(),
            mentionId: this.__mentionId,
            mentionName: this.__mentionName,
            type: "mention",
            version: 1,
        };
    }

    createDOM(config: EditorConfig): HTMLElement {
        const dom = super.createDOM(config);
        if (this.__onClick) {
            dom.addEventListener("click", () => {
                this.__onClick?.({
                    id: this.__mentionId,
                    userName: this.__mentionName,
                });
            });
            dom.className = "RichText-Editor-UserMention-Clickable";
        } else {
            dom.className = "RichText-Editor-UserMention";
        }
        return dom;
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement("span");
        element.setAttribute("data-lexical-mention", "true");
        element.setAttribute(
            "data-lexical-mention-id",
            this.__mentionId.toString()
        );
        element.textContent = this.__text;
        return { element };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            span: (domNode: HTMLElement) => {
                if (!domNode.hasAttribute("data-lexical-mention")) {
                    return null;
                }
                return {
                    conversion: convertMentionElement,
                    priority: 1,
                };
            },
        };
    }

    isTextEntity(): true {
        return true;
    }

    canInsertTextBefore(): boolean {
        return false;
    }

    canInsertTextAfter(): boolean {
        return false;
    }
}

export function $createMentionNode(
    mentionId: number,
    mentionName: string,
    onClick?: (user: { id: number; userName: string }) => void
): MentionNode {
    const mentionNode = new MentionNode(mentionId, mentionName);
    mentionNode.__onClick = onClick;
    mentionNode.setMode("segmented").toggleDirectionless();
    return $applyNodeReplacement(mentionNode);
}

export function $isMentionNode(
    node: LexicalNode | null | undefined
): node is MentionNode {
    return node instanceof MentionNode;
}

const PUNCTUATION =
    "\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%'\"~=<>_:;";
const NAME = "\\b[A-Z][^\\s" + PUNCTUATION + "]";

const DocumentMentionsRegex = {
    NAME,
    PUNCTUATION,
};

const CapitalizedNameMentionsRegex = new RegExp(
    "(^|[^#])((?:" + DocumentMentionsRegex.NAME + "{" + 1 + ",})$)"
);

const PUNC = DocumentMentionsRegex.PUNCTUATION;

const TRIGGERS = ["@"].join("");

// Chars we expect to see in a mention (non-space, non-punctuation).
const VALID_CHARS = "[^" + TRIGGERS + PUNC + "\\s]";

// Non-standard series of chars. Each series must be preceded and followed by
// a valid char.
const VALID_JOINS =
    "(?:" +
    "\\.[ |$]|" + // E.g. "r. " in "Mr. Smith"
    " |" + // E.g. " " in "Josh Duck"
    "[" +
    PUNC +
    "]|" + // E.g. "-' in "Salier-Hellendag"
    ")";

const LENGTH_LIMIT = 75;

const AtSignMentionsRegex = new RegExp(
    "(^|\\s|\\()(" +
        "[" +
        TRIGGERS +
        "]" +
        "((?:" +
        VALID_CHARS +
        VALID_JOINS +
        "){0," +
        LENGTH_LIMIT +
        "})" +
        ")$"
);

// 50 is the longest alias length limit.
const ALIAS_LENGTH_LIMIT = 50;

// Regex used to match alias.
const AtSignMentionsRegexAliasRegex = new RegExp(
    "(^|\\s|\\()(" +
        "[" +
        TRIGGERS +
        "]" +
        "((?:" +
        VALID_CHARS +
        "){0," +
        ALIAS_LENGTH_LIMIT +
        "})" +
        ")$"
);

// At most, 5 suggestions are shown in the popup.
const SUGGESTION_LIST_LENGTH_LIMIT = 10;

const mentionsCache = new Map();

function checkForCapitalizedNameMentions(
    text: string,
    minMatchLength: number
): MenuTextMatch | null {
    const match = CapitalizedNameMentionsRegex.exec(text);
    if (match !== null) {
        const maybeLeadingWhitespace = match[1];
        const matchingString = match[2];
        if (matchingString != null && matchingString.length >= minMatchLength) {
            return {
                leadOffset: match.index + maybeLeadingWhitespace.length,
                matchingString,
                replaceableString: matchingString,
            };
        }
    }
    return null;
}

function checkForAtSignMentions(
    text: string,
    minMatchLength: number
): MenuTextMatch | null {
    let match = AtSignMentionsRegex.exec(text);

    if (match === null) {
        match = AtSignMentionsRegexAliasRegex.exec(text);
    }
    if (match !== null) {
        const maybeLeadingWhitespace = match[1];
        const matchingString = match[3];
        if (matchingString.length >= minMatchLength) {
            return {
                leadOffset: match.index + maybeLeadingWhitespace.length,
                matchingString,
                replaceableString: match[2],
            };
        }
    }
    return null;
}

function getPossibleQueryMatch(
    text: string,
    triggerOnCapitalizedMatch?: boolean
): MenuTextMatch | null {
    const match = checkForAtSignMentions(text, 1);
    if (triggerOnCapitalizedMatch) {
        return match === null
            ? checkForCapitalizedNameMentions(text, 3)
            : match;
    } else {
        return match;
    }
}

class MentionTypeaheadOption extends MenuOption {
    id: number;
    name: string;
    picture: React.ReactNode;

    constructor(id: number, name: string, picture: React.ReactNode) {
        super(name);
        this.id = id;
        this.name = name;
        this.picture = picture;
    }
}

function MentionsTypeaheadMenuItem({
    index,
    isSelected,
    onClick,
    onMouseEnter,
    option,
}: {
    index: number;
    isSelected: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    option: MentionTypeaheadOption;
}) {
    const itemClasses = classNames({
        [`RichText-MentionPopover-Option`]: true,
        [`RichText-MentionPopover-Option-Selected`]: isSelected,
    });

    return (
        <div
            className={itemClasses}
            key={option.key}
            tabIndex={-1}
            ref={option.setRefElement}
            role="option"
            aria-selected={isSelected}
            id={"typeahead-item-" + index}
            onMouseEnter={onMouseEnter}
            onClick={onClick}
        >
            {option.name}
        </div>
    );
}

export default function MentionsPlugin(
    params: IRichTextUserMentionPluginParams
): React.ReactNode | null {
    const [editor] = useLexicalComposerContext();
    const [queryString, setQueryString] = useState<string | null>(null);

    const dummyLookupService = {
        async search(
            string: string,
            callback: (results: { id: number; userName: string }[]) => void
        ): Promise<void> {
            try {
                const users = await params.getUsers();
                const results = users.filter((mention) =>
                    mention.userName
                        .toLowerCase()
                        .includes(string.toLowerCase())
                );
                callback(results);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        },
    };

    const useMentionLookupService = (mentionString: string | null) => {
        const [results, setResults] = useState<
            { id: number; userName: string }[]
        >([]);

        useEffect(() => {
            const cachedResults = mentionsCache.get(mentionString);

            if (mentionString == null) {
                setResults([]);
                return;
            }

            if (cachedResults === null) {
                return;
            } else if (cachedResults !== undefined) {
                setResults(cachedResults);
                return;
            }

            mentionsCache.set(mentionString, null);
            dummyLookupService.search(mentionString, (newResults) => {
                mentionsCache.set(mentionString, newResults);
                setResults(newResults);
            });
        }, [mentionString]);

        return results;
    };

    const results = useMentionLookupService(queryString);

    const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
        minLength: 0,
    });

    const options = useMemo(
        () =>
            results
                .map(
                    (result) =>
                        new MentionTypeaheadOption(
                            result.id,
                            result.userName,
                            <i className="icon user" />
                        )
                )
                .slice(0, SUGGESTION_LIST_LENGTH_LIMIT),
        [results]
    );

    const onSelectOption = useCallback(
        (
            selectedOption: MentionTypeaheadOption,
            nodeToReplace: TextNode | null,
            closeMenu: () => void
        ) => {
            editor.update(() => {
                const mentionNode = $createMentionNode(
                    selectedOption.id,
                    selectedOption.name,
                    () =>
                        params.onClickUser?.({
                            id: selectedOption.id,
                            userName: selectedOption.name,
                        })
                );
                if (nodeToReplace) {
                    nodeToReplace.replace(mentionNode);
                }
                mentionNode.select();
                closeMenu();
            });
        },
        [editor]
    );

    const checkForMentionMatch = useCallback(
        (text: string) => {
            const slashMatch = checkForSlashTriggerMatch(text, editor);
            if (slashMatch !== null) {
                return null;
            }
            return getPossibleQueryMatch(
                text,
                params.triggerOnCapitalizedMatch
            );
        },
        [checkForSlashTriggerMatch, editor]
    );

    return (
        <LexicalTypeaheadMenuPlugin<MentionTypeaheadOption>
            onQueryChange={setQueryString}
            onSelectOption={onSelectOption}
            triggerFn={checkForMentionMatch}
            options={options}
            menuRenderFn={(
                anchorElementRef,
                { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
            ) =>
                anchorElementRef.current && results.length
                    ? ReactDOM.createPortal(
                          <div className="RichText-MentionPopover">
                              <div className="RichText-MentionPopover-Scroll">
                                  {options.map((option, i: number) => (
                                      <MentionsTypeaheadMenuItem
                                          index={i}
                                          isSelected={selectedIndex === i}
                                          onClick={() => {
                                              setHighlightedIndex(i);
                                              selectOptionAndCleanUp(option);
                                          }}
                                          onMouseEnter={() => {
                                              setHighlightedIndex(i);
                                          }}
                                          key={option.key}
                                          option={option}
                                      />
                                  ))}
                              </div>
                          </div>,
                          anchorElementRef.current
                      )
                    : null
            }
        />
    );
}
