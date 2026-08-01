import { ErrorHandler, Injectable } from '@angular/core';

const RELOAD_FLAG = 'chunk_reload_attempted';

@Injectable()
export class ChunkErrorHandler implements ErrorHandler {

  handleError(error: unknown): void {
    const message = this.extractMessage(error);

    if (this.isChunkLoadError(message)) {
      const alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG);

      if (!alreadyReloaded) {
        sessionStorage.setItem(RELOAD_FLAG, '1');
        // Recarga completa: obtiene index.html fresco (no-cache)
        // y con él las referencias a los bundles nuevos
        window.location.reload();
        return;
      }
      // Ya se intentó recargar una vez y sigue fallando:
      // no entrar en loop, dejar que el error se loguee
    }

    console.error(error);
  }

  private extractMessage(error: unknown): string {
    if (error instanceof Error) {
      return `${error.message} ${error.stack ?? ''}`;
    }
    if (typeof error === 'object' && error !== null) {
      const e = error as { message?: string; rejection?: { message?: string } };
      return e.message ?? e.rejection?.message ?? String(error);
    }
    return String(error);
  }

  private isChunkLoadError(message: string): boolean {
    return [
      /Failed to fetch dynamically imported module/i,
      /error loading dynamically imported module/i,
      /Expected a JavaScript.*module script/i,
      /Importing a module script failed/i,   // Safari
      /ChunkLoadError/i,
      /Loading chunk .* failed/i,
    ].some(pattern => pattern.test(message));
  }
}