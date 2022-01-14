import * as path from 'path';

import { workspace, ExtensionContext, notebooks } from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    Executable,
    ExecutableOptions,
    TransportKind
} from 'vscode-languageclient/node';

import { NotebookKernel, NotebookSerializer } from './notebook';


let client: LanguageClient;

export function activate(context: ExtensionContext) : void {
    let blossomLocation = workspace.getConfiguration('blossom')['location'];
    let blossomPort = '4567';

    let serverOptions: Executable = {
        command: blossomLocation,
        args: ['http', '--port', blossomPort]
    };

    let clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'blossom' }],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
        }
    };

    client = new LanguageClient(
        'blossomLanguageServer',
        serverOptions,
        clientOptions
    );

    client.start();

    context.subscriptions.push(
        new NotebookKernel(blossomPort),
        workspace.registerNotebookSerializer('blossom-book', new NotebookSerializer())
    );

    

    // const extension = new Extension(context);
}

export function deactivate() : Promise<void> {
    if (!client) {
        return undefined;
    }

    return client.stop();
}

export class Extension {
    context: ExtensionContext;

    constructor(context: ExtensionContext) {
        this.context = context;
    };

}