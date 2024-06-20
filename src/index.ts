// this file is only for managing exports

export { KissConnection } from "./kissconnection"
export * from './frames'

// "type" must be included for Bun compatibility, using Bun version 1.1.10 as of writing
export type { SerialKissConstructor as SerialConstructor, MockKissConstructor as MockModemConstructor, Repeater, SFrameConstructor, TestFrameConstructor, UIFrameConstructor, IFrameConstructor } from "./types"