
(() => {
	const connection = new WebSocket("ws://127.0.0.1:" + REPLICA_SERVER_PORT, [ "soap", "xmpp" ])
	connection.onopen = () => {
		console.log("(replica) Connected to development server")
	}
	connection.onerror = (error) => {
		console.log("(replica) Error:", error)
	}
	connection.onmessage = (event) => {
		document.location.reload()
	}
})();