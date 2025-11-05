import fs from 'node:fs/promises';
import path from 'node:path';
import type { ServerDefinition, ServerSource } from './config.js';

export type CliArtifactKind = 'template' | 'bundle' | 'binary';

export interface SerializedServerDefinition {
  readonly name: string;
  readonly description?: string;
  readonly command:
    | {
        kind: 'http';
        url: string;
        headers?: Record<string, string>;
      }
    | {
        kind: 'stdio';
        command: string;
        args: string[];
        cwd: string;
      };
  readonly env?: Record<string, string>;
  readonly auth?: string;
  readonly tokenCacheDir?: string;
  readonly clientName?: string;
  readonly oauthRedirectUrl?: string;
}

export interface CliArtifactMetadata {
  readonly schemaVersion: 1;
  readonly generatedAt: string;
  readonly generator: {
    readonly name: string;
    readonly version: string;
  };
  readonly server: {
    readonly name: string;
    readonly source?: ServerSource;
    readonly definition: SerializedServerDefinition;
  };
  readonly artifact: {
    readonly path: string;
    readonly kind: CliArtifactKind;
  };
  readonly invocation: {
    serverRef?: string;
    configPath?: string;
    rootDir?: string;
    runtime: 'node' | 'bun';
    outputPath?: string;
    bundle?: boolean | string;
    compile?: boolean | string;
    timeoutMs: number;
    minify: boolean;
  };
}

export interface WriteCliMetadataOptions {
  readonly artifactPath: string;
  readonly kind: CliArtifactKind;
  readonly generator: { name: string; version: string };
  readonly server: {
    name: string;
    source?: ServerSource;
    definition: ServerDefinition;
  };
  readonly invocation: CliArtifactMetadata['invocation'];
}

export async function writeCliMetadata(options: WriteCliMetadataOptions): Promise<string> {
  const metadata: CliArtifactMetadata = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    generator: options.generator,
    server: {
      name: options.server.name,
      source: options.server.source,
      definition: serializeDefinition(options.server.definition),
    },
    artifact: {
      path: path.resolve(options.artifactPath),
      kind: options.kind,
    },
    invocation: options.invocation,
  };

  const metadataPath = metadataPathForArtifact(options.artifactPath);
  await fs.mkdir(path.dirname(metadataPath), { recursive: true });
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  return metadataPath;
}

export function metadataPathForArtifact(artifactPath: string): string {
  return `${artifactPath}.metadata.json`;
}

export async function readCliMetadata(artifactPath: string): Promise<CliArtifactMetadata> {
  const target = metadataPathForArtifact(artifactPath);
  const buffer = await fs.readFile(target, 'utf8');
  return JSON.parse(buffer) as CliArtifactMetadata;
}

export function serializeDefinition(definition: ServerDefinition): SerializedServerDefinition {
  if (definition.command.kind === 'http') {
    return {
      name: definition.name,
      description: definition.description,
      command: {
        kind: 'http',
        url: definition.command.url.toString(),
        headers: definition.command.headers,
      },
      env: definition.env,
      auth: definition.auth,
      tokenCacheDir: definition.tokenCacheDir,
      clientName: definition.clientName,
      oauthRedirectUrl: definition.oauthRedirectUrl,
    };
  }
  return {
    name: definition.name,
    description: definition.description,
    command: {
      kind: 'stdio',
      command: definition.command.command,
      args: [...definition.command.args],
      cwd: definition.command.cwd,
    },
    env: definition.env,
    auth: definition.auth,
    tokenCacheDir: definition.tokenCacheDir,
    clientName: definition.clientName,
    oauthRedirectUrl: definition.oauthRedirectUrl,
  };
}
