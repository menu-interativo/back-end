# Fiorentina API (APS3)

## Requisitos Funcionais (RFs)

- [x] Deve ser possível lista os pratos;
- [x] Deve ser possível visualizar o histórico de pedidos;
- [x] Deve ser possível realizar um pedido;
- [ ] Deve ser possível enviar notificação para os garçom;
- [ ] Deve ser possível visualizar o histórico de notificações;
- [x] Deve ser possível que o garçon visualize as mesas que ele é responsável;
- [ ] Deve ser possível pedir a conta;
- [ ] Deve ser possível pagar a conta;
- [x] Deve ser possível listar os pedidos;
- [ ] Deve ser possível notificar os garções quando o prato estiver pronto;
- [ ] Deve ser possível listar as métricas dos pedidos
- [x] Deve ser possível gerenciar os pratos;
- [x] Deve ser possível gerenciar os funcionários;
- [x] Deve ser possível gerenciar o estoque;
- [ ] Deve ser possível gerar um relatório do pedidos;
- [x] Deve ser possível se autenticar;
- [ ] Deve ser possível que o garçom possa visualizar suas métricas;

## Regras de Negócio (RNs)

- [x] Deve ser possível identificar os clientes entres as requisições;
- [x] O cliente só pode ver o histórico dos pedidos feito por ele;
- [ ] Somente os garções podem ver as notificações;
- [ ] Somente os garções e o admin podem visualizar as mesas é os pedidos;
- [ ] Quando um pedido for finalizado deve restaurar o histórico da mesa;
- [x] somente o gerente pode gerenciar os funcionários, pratos e estoque;
- [ ] somente o gerente pode gerar um relatório

## Requisitos Não Funcionais (RNFs)

- [x] A autenticação deve ser feita usando JWT
- [ ] Todas as listagens devem ser paginadas em 20 itens;
- [x] Os dados devem ser salvos em um banco de dados Postgres;