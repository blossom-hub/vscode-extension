import * as vscode from 'vscode';
const axios = require('axios').default;

import { TextDecoder, TextEncoder } from 'util';
import { ProjectContainer } from './project';
import { renderTable } from './renderers';

export class NotebookKernel {
    readonly id = 'blossom-book-kernel';
    readonly notebookType = 'blossom-book';
    readonly label = 'Blossom';
    readonly supportedLanguages = ['blossom-book'];

    private readonly _controller: vscode.NotebookController;
    private readonly _blossomPort: string;
    private readonly _container = new ProjectContainer();
    private _executionOrder = 0;

    constructor(blossomPort: string) 
    {
        this._blossomPort = blossomPort;
        this._controller = vscode.notebooks.createNotebookController(
            this.id,
            this.notebookType,
            this.label
        );
        this._controller.supportedLanguages = this.supportedLanguages;
        this._controller.supportsExecutionOrder = true;
        this._controller.description = 'A notebook for exploring blossom financial data';
        this._controller.executeHandler = this._executeAll.bind(this);
    }

    dispose() : void {
        this._controller.dispose();
    }

    private _executeAll(
        cells: vscode.NotebookCell[],
        _notebook: vscode.NotebookDocument,
        _controller: vscode.NotebookController) : void 
    {
        for (let cell of cells) {
            this._executeOne(cell);
        }
    }

    private _executeOne(cell: vscode.NotebookCell) : Promise<void>
    {
        const project = this._container.lookup(cell.document.uri);

        const execution = this._controller.createNotebookCellExecution(cell);
        execution.executionOrder = ++this._executionOrder;
        execution.start(Date.now());

        let text = cell.document.getText();
        let boundary = text.indexOf(' ');
        let word0 = text.substring(0, boundary);

        try {
            switch (word0) {
                case "load":
                    let filename = text.substring(boundary+1);
                    return axios.get(`http://localhost:${this._blossomPort}/rest/load/${filename}`) 
                        .then(function (response) 
                        {
                            project.assignJournal(parseInt(response.data), filename);
                            execution.replaceOutput([new vscode.NotebookCellOutput([
                                vscode.NotebookCellOutputItem.text(`Journal #${response.data} loaded.`)
                            ])]);
                    
                            execution.end(true, Date.now());
                        });;
                default:
                    // temporary!
                    let doesOwn = project.ownsJournal(parseInt(word0));
                    if (!doesOwn) { 
                        execution.replaceOutput([new vscode.NotebookCellOutput([
                            vscode.NotebookCellOutputItem.text("Unknown journal for this notebook.")
                        ])]);
                        execution.end(false, Date.now());
                    }

                    let command = text.substring(boundary+1);
                    return axios.post(`http://localhost:${this._blossomPort}/rest/${word0}/execute`, command) 
                        .then(function (response) 
                        {
                            let html = renderTable(response.data);
                            execution.replaceOutput([new vscode.NotebookCellOutput([
                                vscode.NotebookCellOutputItem.json(response.data),
                                vscode.NotebookCellOutputItem.text(html, 'text/html')
                            ])]);
                    
                            execution.end(true, Date.now());
                        });;
            }
        } catch (error)
        {
            execution.replaceOutput([new vscode.NotebookCellOutput([
                vscode.NotebookCellOutputItem.error(error)
            ])]);
            execution.end(false, Date.now());
        }
    }
}

interface RawCellOutput {
    mime: string;
    value: any;
}

interface RawNotebookCell {
    language: string;
    value: string;
    kind: vscode.NotebookCellKind;
}

export class NotebookSerializer implements vscode.NotebookSerializer {

    async deserializeNotebook(content: Uint8Array, token: vscode.CancellationToken): Promise<vscode.NotebookData> {
        var contents = new TextDecoder().decode(content);
        let raw: RawNotebookCell[];
        try {
            raw = <RawNotebookCell[]>JSON.parse(contents);
        }
        catch {
            raw = [];
        }

        const cells = raw.map (
            item => new vscode.NotebookCellData(item.kind, item.value, item.language)
        )
        return new vscode.NotebookData(cells);
    }

    async serializeNotebook(data: vscode.NotebookData, token: vscode.CancellationToken): Promise<Uint8Array> {
        let contents: RawNotebookCell[] = [];
        for (const cell of data.cells)
        {
            contents.push({
                kind: cell.kind,
                language: cell.languageId,
                value: cell.value
            });
        }

        return new TextEncoder().encode(JSON.stringify(contents));

    }

}