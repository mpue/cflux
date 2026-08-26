import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { AuthRequest } from '../types/auth';

/**
 * Ausliefern des MCP-Client-Pakets.
 *
 * Das Paket wird ausserhalb der Anwendung gebaut (mcp-server, npm run
 * package:windows) und in dieses Verzeichnis gelegt. Die Anwendung baut es
 * nicht selbst — sie reicht nur weiter, was dort liegt. Dadurch bleibt das
 * Docker-Image schlank und der Bau unabhaengig vom Deployment.
 *
 * Die Route haengt am api-keys-Router und damit hinter denyApiKey: das Paket
 * bekommt nur, wer sich wirklich angemeldet hat. Ein API-Schluessel soll sich
 * nicht selbst den Client herunterladen koennen.
 */

const DOWNLOAD_DIR = process.env.CLIENT_DOWNLOAD_DIR || path.join(__dirname, '../../downloads');

/** Dateiname des Windows-Pakets, wie ihn das Bau-Skript erzeugt. */
const WINDOWS_PATTERN = /^cflux-mcp-(.+)-windows\.zip$/;

interface ClientPackage {
  filename: string;
  filepath: string;
  version: string;
  size: number;
  builtAt: Date;
}

/**
 * Sucht das Windows-Paket. Liegen mehrere Versionen im Verzeichnis, gewinnt
 * die zuletzt gebaute — so wirkt ein neues Paket, sobald es abgelegt wird,
 * ohne dass jemand das alte loeschen muss.
 */
const findWindowsPackage = (): ClientPackage | null => {
  if (!fs.existsSync(DOWNLOAD_DIR)) return null;

  const candidates = fs
    .readdirSync(DOWNLOAD_DIR)
    .map((filename) => ({ filename, match: filename.match(WINDOWS_PATTERN) }))
    .filter((entry): entry is { filename: string; match: RegExpMatchArray } => entry.match !== null)
    .map(({ filename, match }) => {
      const filepath = path.join(DOWNLOAD_DIR, filename);
      const stat = fs.statSync(filepath);
      return { filename, filepath, version: match[1], size: stat.size, builtAt: stat.mtime };
    })
    .filter((entry) => entry.size > 0);

  if (!candidates.length) return null;

  return candidates.sort((a, b) => b.builtAt.getTime() - a.builtAt.getTime())[0];
};

/**
 * Sagt der Oberflaeche, ob es etwas zum Herunterladen gibt. Fehlt das Paket,
 * blendet sie den Knopf aus, statt einen toten Link anzubieten.
 */
export const getClientPackageInfo = async (req: AuthRequest, res: Response) => {
  try {
    const pkg = findWindowsPackage();

    if (!pkg) {
      return res.json({ available: false });
    }

    res.json({
      available: true,
      platform: 'windows',
      filename: pkg.filename,
      version: pkg.version,
      size: pkg.size,
      builtAt: pkg.builtAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Client package info error:', error);
    res.status(500).json({ error: 'Failed to read client package info' });
  }
};

export const downloadClientPackage = async (req: AuthRequest, res: Response) => {
  try {
    const pkg = findWindowsPackage();

    if (!pkg) {
      return res.status(404).json({
        error: 'Client package not available',
        message:
          'Es liegt kein Windows-Paket bereit. Es wird mit "npm run package:windows" ' +
          'im Ordner mcp-server gebaut und in das Download-Verzeichnis des Backends gelegt.',
      });
    }

    // Der Pfad wird ausschliesslich aus dem Verzeichnisinhalt gebildet, nie aus
    // einer Eingabe — deshalb ist hier keine Pfadpruefung noetig.
    res.download(pkg.filepath, pkg.filename);
  } catch (error: any) {
    console.error('Client package download error:', error);
    res.status(500).json({ error: 'Failed to download client package' });
  }
};
