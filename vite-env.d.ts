/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_LIVEKIT_TOKEN_URL: string
    readonly VITE_LIVEKIT_SERVER_URL: string
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
