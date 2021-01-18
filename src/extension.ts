import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    Executable,
    ExecutableOptions,
    TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
    let serverOptions: Executable = {
        command: workspace.getConfiguration('blossom')['location'],
        args: []
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

    const extension = new Extension(context);
}

export function deactivate() {
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