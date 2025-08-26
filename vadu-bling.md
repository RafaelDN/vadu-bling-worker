# VA Importação
Integração entre VADU e Bling usando a ferramenta de automação Make.

*Atualizado em 25/08/2025*

## Cenários
### Bling - EnableBlingApiCode
Este cenário é responsável por autorizar a API do BLing para o uso pelo Make.
O Bling envia um postback com uma qyery chamda [code]. Com esse [code] é gerado uma access token e um refresh token.

### Bling - TokenBling
O access token do Bling tem um tempo de vida de 8 horas. Então esse cenário vai rodar a cada 4 horas pra gerar um access token novo para ser utlizado pelo outros cenários.

### VADU - Processa pedidos em análise de créditos
Esse é o processo responsável por buscar os pedidos em **análise de crédito 1** e **análise de crédito 2** e enviar para a análise de crédito do VADU.
Este cenário possui algumas validações que definem qual o destino daquele pedido/cnpj:

1. Se o pedido estiver em **análise de crédito 1** e o valor do pedido for MENOR que **R$1500,00**: O pedido será atualizado no bling para **Reprovado VADU - 470116**
2. Se o pedido estiver em **análise de crédito 1** e o valor do pedido for MAIOR ou IGUAL que **R$1500,00**: 
   - Se for o **primeiro** pedido do cliente:  O CNPJ será enviado para a análise de crédito com o grupo de anaálise do VADU **13256**
   - Se **não for o primeiro**: O CNPJ será enviado para a análise de crédito com o grupo de anaálise do VADU **12777**
3. Se o pedido estiver em **análise de crédito 2**: O CNPJ será enviado para a análise de crédito com o grupo de anaálise do VADU **13257**

### VADU - Processa retorno da análise do VADU
Responsável por capturar a resposta do VADU por Webhook e ajustar a situação dos pedidos.
1. Se houver retorno com **bloqueio**: Os pedidos serão alterados para **Reprovado VADU - 470116**
2. Se houver retorno com **aprovado**: Os pedidos serão alterados para **Aprovado VADU - 469260**

Os dados da resposta do VADU serão compilados por um Worker Cloudflare e serão enviados no campo de observação interna do pedido.

---
## Notas do desenvolvedor
### Uso de Cloudflare Worker
O Bling possui uma situação específica onde, na atualização do pedido, é necessário reenviar todo o corpo do pedido. O Make não dá o suporte necessário para esse tipo de processo por conta das regras de mapeamento do próprio Make. 

Com isso foi feito um Worker no Cloudflare (que nada mais é que um endpoint público que vai executar um processo http).

O cloudflare tem um plano free bem generoso, o que não deve adicionar custos adicionais no processo. 

O código fonte utilizado para o Cloudflare Worker está em: https://github.com/RafaelDN/vadu-bling-worker

O Worker está publicado na conta: https://dash.cloudflare.com/337e4657ecc6e2e49e1cb885dee31c51/workers/services/view/vadu-bling-worker/production/metrics