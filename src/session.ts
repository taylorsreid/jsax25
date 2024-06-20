import { FrameFactory } from "frames"
import { LocalStorage } from 'node-localstorage'
import { OutgoingConstructor } from "types"

export class Session {

    private ff: FrameFactory
    private ls: LocalStorage = new LocalStorage('./modulo128Cache')

    constructor(args: FrameFactory | OutgoingConstructor) {
        if (args instanceof FrameFactory) {
            this.ff = args
        }
        else {
            this.ff = new FrameFactory(args)
        }
    }

    public async connect() {
        const cached: string | null = this.ls.getItem(`${this.ff.getDestinationCallsign()}-${this.ff.getDestinationSsid()}`)
        const inCache: boolean = cached !== null
        const supports128: boolean = cached === 'true'
        
        if (!inCache || supports128) {
            
        }
    }

}