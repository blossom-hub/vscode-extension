import internal = require('stream');
import * as vscode from 'vscode';

export class Project {

    private readonly _loadedJournals = new Map<number, string>();

    assignJournal(id: number, filename: string){
        this._loadedJournals.set(id, filename);
    }

    closeJournal(id: number) {
        this._loadedJournals.delete(id);
    }

    ownsJournal(id: number) : boolean {
        return this._loadedJournals.has(id);
    }
}

export class ProjectContainer {

    private readonly _disposables: vscode.Disposable[] = [];
    private readonly _associations = new Map<vscode.NotebookDocument, Project>();

    constructor() {
        this._disposables.push(
            vscode.workspace.onDidOpenNotebookDocument(notebook => {
                if (notebook.notebookType !== 'blossom-book')
                    return;
                
                if (this._associations.has(notebook)){
                    throw new Error('Notebook already registered');
                }

                const project = new Project();
                this._associations.set(notebook, project);

            })
        );

        this._disposables.push(
            vscode.workspace.onDidCloseNotebookDocument(notebook => {
                const project = this._associations.get(notebook);
                if (project) {
                    this._associations.delete(notebook);
                }
            })
        );
    }

    lookup(uri: vscode.Uri) : Project | undefined
    {
        for (let [notebook, project] of this._associations) {
            if (notebook.uri.toString() === uri.toString())
            {
                return project;
            }

            for (let cell of notebook.getCells()) {
                if (cell.document.uri.toString() === uri.toString())
                {
                    return project;
                }
            }
        }

        return undefined;
    }

}