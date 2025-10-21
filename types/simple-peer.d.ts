/**
 * Type declarations for simple-peer
 */

declare module 'simple-peer' {
  interface SimplePeerOptions {
    initiator?: boolean
    trickle?: boolean
    config?: {
      iceServers?: RTCIceServer[]
    }
    stream?: MediaStream
    streams?: MediaStream[]
    channelConfig?: RTCDataChannelInit
    channelName?: string
    objectMode?: boolean
  }

  interface SignalData {
    type: 'offer' | 'answer' | 'candidate'
    sdp?: string
    candidate?: RTCIceCandidateInit
  }

  class SimplePeer extends EventEmitter {
    static Instance: SimplePeer
    constructor(opts?: SimplePeerOptions)
    
    // Connection methods
    signal(data: SignalData | string): void
    connect(): void
    destroy(): void
    send(data: string | Buffer): void
    
    // Properties
    readonly connected: boolean
    readonly destroyed: boolean
    readonly readable: boolean
    readonly writable: boolean
    
    // Events
    on(event: 'signal', listener: (data: SignalData) => void): this
    on(event: 'connect', listener: () => void): this
    on(event: 'close', listener: () => void): this
    on(event: 'data', listener: (data: Buffer) => void): this
    on(event: 'error', listener: (error: Error) => void): this
    on(event: 'iceConnectionStateChange', listener: (state: string) => void): this
    on(event: 'stream', listener: (stream: MediaStream) => void): this
    
    // Generic event handler
    on(event: string, listener: (...args: any[]) => void): this
  }

  export = SimplePeer
}
