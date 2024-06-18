export class MockModem {

    public closed: boolean = false;

    public on(event: string, listener: any) {
    }

    public once(event: string, listener: any) {
    }
    
    public write(encoded: string | Uint8Array, cb?: (err?: Error) => void): boolean | void {
        if (encoded instanceof Uint8Array) {
            console.log(`NullModem.write(): ${JSON.stringify(Array.from(encoded))}`);
        }
    }

    public end() {
        this.closed = true;
    }
}
