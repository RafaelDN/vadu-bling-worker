export default {
	buildObservacao: (tipo, itens) => {
		let obs = `${tipo}:\r\n`;
		itens.forEach((a) => {
			obs += `- ${a.analise_descricao}\r\n`;
			obs += `- ${a.regra_descricao}\r\n`;
			obs += `- ${a.regra_condicao}\r\n`;
			obs += `\r\n`;
		});
		return obs;
	},

	async fetch(request, env, _ctx) {
		// Guard: aceita apenas POST
		if (request.method !== 'POST') {
			return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
				status: 405,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		// Guard: verifica o header 'vadu-bling-token'
		console.log(env, env.BLING_VADU_SECRET);
		const token = request.headers.get('vadu-bling-token');
		if (token !== env.BLING_VADU_SECRET) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
		}

		let body;
		try {
			body = await request.json();
		} catch {
			return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
		}
		const { pedido, vadu: lista, date } = body;
		const vadu = lista[0]; // Pega o primeiro item da lista

		let observacao = '\r\nValidação VADU:\r\n';
		observacao += `Data da análise: ${date}\r\n`;
		observacao += `Rating 1: ${vadu.rating}:${vadu.rating_sigla}\r\n`;
		observacao += `Rating 2: ${vadu.rating2}:${vadu.rating2_sigla}\r\n\r\n`;

		const bloqueios = vadu.analises.filter((a) => a.bloqueio);
		const recusado = bloqueios.length > 0;

		if (recusado) {
			observacao += this.buildObservacao('Bloqueios', bloqueios);
		} else {
			const alertas = vadu.analises.filter((a) => a.alerta);
			if (alertas.length > 0) {
				observacao += this.buildObservacao('Alertas', alertas);
			} else {
				observacao += `Nenhum alerta encontrado.\r\n`;
			}
		}

		pedido.data.observacoesInternas = (pedido.data.observacoesInternas || '') + observacao;

		return new Response(JSON.stringify(pedido.data), {
			headers: { 'Content-Type': 'application/json' },
		});
	},
};
