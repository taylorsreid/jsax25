/**
 * @attribute serialPort?: string - The path to your TNC or software modem's serial port. If defined, it will override any TCP options that you include. Leave blank to use TCP. No default.
 * @attribute serialBaud?: number - A custom baud rate for your TNC or software modem's serial port. Default 1200 (most common) if not defined.
 * @attribute tcpHost?: string - The IP address or URL to your TNC or software mode. Default '127.0.0.1' (most common) if not defined.
 * @attribute tcpPort?: number - The TCP port to your TNC or software modem. Default 8100 (most common) if not defined.
 * @attribute compression?: boolean - Enable optional compression of the payload/body portion of the packet using the brotli algorithm. Callsigns and SSIDs are not compressed in the spirit of amateur radio. Note that regardless of setting, if for some reason the compressed version is larger than the uncompressed version, the uncompressed version is sent. Default false if not defined.
 * @attribute suppressConnectionErrors?: boolean - Mostly used for development and debugging. SerialPort and Socket will by default print errors to the console, set this to true to disable them. Default false if not defined.
 * @attribute nullModem?: boolean - A fake modem for running tests without a radio. Anything written to it will simply be printed to the console. Setting this to true overrides any and all serial and TCP options. Default to false if not defined.
 */
export interface KissConnectionConstructor {
    /** The path to your TNC or software modem's serial port. If defined, it will override any TCP options that you include. Leave blank to use TCP.  No default. */
    serialPort?: string;
    /** A custom baud rate for your TNC or software modem's serial port. Default 1200 (most common) if not defined. */
    serialBaud?: number;
    /** The IP address or URL to your TNC or software mode. Default '127.0.0.1' (most common) if not defined. */
    tcpHost?: string;
    /** The TCP port to your TNC or software modem. Default 8100 (most common) if not defined. */
    tcpPort?: number;
    /** Enable optional compression of the payload/body portion of the packet using the brotli algorithm. Callsigns and SSIDs are not compressed in the spirit of amateur radio. Note that regardless of setting, if for some reason the compressed version is larger than the uncompressed version, the uncompressed version is sent. Default false if not defined. */
    compression?: boolean;
    /** SerialPort and Socket will by default print errors to the console, set this to true to disable them. Default false if not defined. */
    suppressConnectionErrors?: boolean;
    /** A fake modem for running tests without a radio. Anything written to it will simply be printed to the console. Setting this to true overrides any and all serial and TCP options. Default to false if not defined. */
    nullModem?: boolean;
}
