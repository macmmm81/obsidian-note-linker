import * as React from "react";
import {PreferrableItem, Replacement} from "../../../../pkg";
import {ReplacementItemComponent} from "../list-items/ReplacementItemComponent";
import {useLinkTargetCandidate, useNoteFiles} from "../../hooks";


interface ReplacementsSelectionComponentProps {
    selectedReplacement: Replacement,
    setSelectedReplacement: React.Dispatch<React.SetStateAction<Replacement>>
}

export const ReplacementsSelectionComponent = ({
                                                   selectedReplacement,
                                                   setSelectedReplacement
                                               }: ReplacementsSelectionComponentProps) => {
    const linkTargetCandidate = useLinkTargetCandidate();
    const noteFiles = useNoteFiles();

    const renderTitle = () => {
        if (!linkTargetCandidate) return null;
        const fullPath: string = linkTargetCandidate.path;
        const hasAnchor = fullPath.indexOf('#') > -1;
        if (!hasAnchor) {
            // regular note candidate: show link icon + title
            return <span className={"title"}>🔗{linkTargetCandidate.title}</span>;
        }

        // heading candidate: show heading icon and "Note › Heading"
        const basePath = fullPath.split('#')[0];
        const headingTitle = linkTargetCandidate.title;
        const tfile = noteFiles ? noteFiles.get(basePath) : undefined;
        const noteTitle = tfile ? tfile.basename : basePath;
        return (
            <span className={"title"}>🔖{noteTitle} › {headingTitle}</span>
        );
    };

    return (
        <li className={"replacements-selection"}>
            {renderTitle()}
            <ul className={"hide-list-styling"}>
                {linkTargetCandidate.replacementCandidates.map((replacementCandidate: PreferrableItem, index: number) =>
                    <ReplacementItemComponent selectedReplacement={selectedReplacement}
                                              setSelectedReplacement={setSelectedReplacement}
                                              replacementCandidate={replacementCandidate}
                                              key={`${replacementCandidate.content}-${index}`}
                    />
                )}
            </ul>
        </li>
    );
};
