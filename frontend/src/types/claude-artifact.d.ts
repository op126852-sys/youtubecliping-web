// Ambient type for the `downloads` runtime capability exposed by the Claude
// Artifact viewer (only present when this app is running as a published
// artifact with `capabilities: { downloads: true }`). See:
// https://claude.ai (Artifact "downloads" capability, runtime contract 0.1.x)
export {}

declare global {
  interface Window {
    claude?: {
      downloads?: {
        save(request: {
          filename: string
          data: string | Blob | ArrayBuffer | ArrayBufferView
        }): Promise<{ status: 'saved' }>
      }
    }
  }
}
