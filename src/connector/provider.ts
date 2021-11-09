import type { Observable } from "rxjs"
import { map } from "rxjs/operators"

export type StateConnected<T> = {
	status: "connected"
	connection: T
}

export type StateConnecting = {
	status: "connecting"
}

export type ConnectionState<T> = StateConnected<T> | StateConnecting | undefined

/**
 * Provider of the connection.
 * Examples: injected web3, fortmatic, temple tezos wallet, blocto.
 */
export type ConnectionProvider<Option, Connection> = {
	/**
	 * Checks if this provider is auto-connected. For example, injected mobile providers are connected by default
	 */
	isAutoConnected: Promise<boolean>
	/**
	 * List of available connection options: injected web3 can find out what option is available (Metamask, Trust etc.)
	 */
	options: Promise<Option[]>
	/**
	 * Start connection using specified option
	 * @param option selected connection option
	 */
	connect(option: Option): void
	/**
	 * Current connection state. If value is undefined, then provider is considered disconnected.
	 */
	connection: Observable<ConnectionState<Connection>>
}

export class MappedConnectionProvider<O, Connection, NewConnection> implements ConnectionProvider<O, NewConnection> {
	constructor(
		private readonly source: ConnectionProvider<O, Connection>,
		private readonly mapper: (from: Connection) => NewConnection
	) {
		this.connect = this.connect.bind(this)
	}

	connect(option: O): void {
		this.source.connect(option)
	}

	connection = this.source.connection.pipe(map(state => {
		if (state === undefined) {
			return undefined
		} else if (state.status === "connected") {
			return { status: "connected" as const, connection: this.mapper(state.connection) }
		} else {
			return state
		}
	}))

	get isAutoConnected() {
		return this.source.isAutoConnected
	}

	get options() {
		return this.source.options
	}

	static create<O, C, NewC>(souce: ConnectionProvider<O, C>, mapper: (from: C) => NewC): ConnectionProvider<O, NewC> {
		return new MappedConnectionProvider(souce, mapper)
	}
}
