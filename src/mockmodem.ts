export class MockModem {

    public closed: boolean = false;

    public on(event: string, listener: any) {
    }

    public write(encoded: string | Uint8Array, cb?: (err?: Error) => void): boolean | void {
        console.log(`NullModem.write(): ${JSON.stringify(encoded)}`);
    }

    public end() {
        this.closed = true;
    }
}
