import * as React from "react";
import {useCallback} from "react";
import {LinkMatch, LinkTargetCandidate, PreferrableItem, Replacement} from "../../../../pkg";
import {generateMockupMdLink} from "../../util";
import {useApp, useLinkFinderResult, useLinkMatch, useLinkTargetCandidate, useNoteFiles,} from "../../hooks";

interface ReplacementItemComponentProps {
    selectedReplacement: Replacement,
    setSelectedReplacement: React.Dispatch<React.SetStateAction<Replacement>>,
    replacementCandidate: PreferrableItem
}

export const ReplacementItemComponent = ({
                                                        selectedReplacement,
                                                        setSelectedReplacement,
                                                        replacementCandidate
                                                    }: ReplacementItemComponentProps) => {
    const {fileManager} = useApp();
    const parentNote = useLinkFinderResult().note;
    const linkMatch = useLinkMatch();
    const linkTargetCandidate = useLinkTargetCandidate();
    const noteFiles = useNoteFiles();


    const isSelected = useCallback(() => {
        if (selectedReplacement === undefined) return false;
        return selectedReplacement.position.is_equal_to(linkMatch.position) &&
            selectedReplacement.targetNotePath == linkTargetCandidate.path &&
            selectedReplacement.originalSubstitute == replacementCandidate.content
    }, [selectedReplacement]);


    const subtractReplacement = () => {
        setSelectedReplacement(undefined);
    }

    const addReplacement = (noteChangeOperationToAdd: Replacement) => {
        setSelectedReplacement(noteChangeOperationToAdd);
    }

    const handleSelect = (replacementCandidate: PreferrableItem, candidate: LinkTargetCandidate, doAdd: boolean, linkMatch: LinkMatch) => {
        // Support heading targets where candidate.path may be "note/path.md#anchor".
        const fullPath: string = candidate.path;
        const hasAnchor = fullPath.indexOf("#") > -1;
        const basePath = hasAnchor ? fullPath.split("#")[0] : fullPath;
        const anchor = hasAnchor ? fullPath.split("#").slice(1).join("#") : null;

        const tfile = noteFiles ? noteFiles.get(basePath) : undefined;

        // build the base markdown link using Obsidian's fileManager so it respects settings
        let mdLink = fileManager.generateMarkdownLink(
            tfile,
            parentNote.path,
            null,
            replacementCandidate.content == parentNote.title ? null : replacementCandidate.content
        );

        // if there is an anchor, inject it into the generated link before any alias or closing brackets
        if (anchor) {
            // mdLink is like [[path|alias]] or [[path]]
            const closingIndex = mdLink.lastIndexOf("]]");
            if (closingIndex > -1) {
                // find alias separator '|' if present between the brackets
                const openIndex = mdLink.indexOf("[[");
                const inner = mdLink.substring(openIndex + 2, closingIndex);
                const pipeIndex = inner.indexOf("|");
                let newInner: string;
                if (pipeIndex > -1) {
                    // insert anchor before the pipe
                    const pathPart = inner.substring(0, pipeIndex);
                    const aliasPart = inner.substring(pipeIndex + 1);
                    newInner = `${pathPart}#${anchor}|${aliasPart}`;
                } else {
                    newInner = `${inner}#${anchor}`;
                }
                mdLink = `[[${newInner}]]`;
            }
        }

        const replacement = new Replacement(
            linkMatch.position,
            mdLink,
            replacementCandidate.content,
            candidate.path
        );

        if (doAdd) addReplacement(replacement)
        else subtractReplacement()
    }

    return (
        <li className={"replacement-item"}
            onClick={() => handleSelect(replacementCandidate, linkTargetCandidate, !isSelected(), linkMatch)}>
            <input
                className={"task-list-item-checkbox"}
                type={"checkbox"}
                checked={isSelected()}
                onChange={() => {
                }}
            />
            <span className={"matched-text"}>
                "{replacementCandidate.content}"
            </span>
            <div className={"replacement-context"}>
                <span className={"arrow-icon"}>→</span>
                <span className={"context-tail"}>
                    "... {linkMatch.context.leftContextTail.text}
                </span>
                <span className={"link-preview"}>
                    {(() => {
                        // show anchor-aware preview when linking to a heading
                        const fullPath: string = linkTargetCandidate.path;
                        if (fullPath.indexOf("#") > -1) {
                            const basePath = fullPath.split("#")[0];
                            const anchor = fullPath.split("#").slice(1).join("#");
                            const alias = replacementCandidate.content == parentNote.title ? null : replacementCandidate.content;
                            return alias ? `[[${basePath}#${anchor}|${alias}]]` : `[[${basePath}#${anchor}]]`;
                        }
                        return generateMockupMdLink(replacementCandidate.content, linkTargetCandidate.title);
                    })()}
                </span>
                <span className={"context-tail"}>
                    {linkMatch.context.rightContextTail.text} ..."
                </span>
            </div>
        </li>
    );
};
